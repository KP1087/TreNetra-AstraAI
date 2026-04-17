import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import cookieParser from "cookie-parser";
import { socialProviders } from "./src/lib/social/registry.js";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Middleware to verify Firebase ID Token
  const authenticate = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Social OAuth Initiation
  app.get("/api/social/connect/:platform", authenticate, (req, res) => {
    const { platform } = req.params;
    const provider = socialProviders[platform];
    if (!provider) return res.status(404).json({ error: "Platform not supported" });

    // Store state in cookie to retrieve it in callback
    const state = Math.random().toString(36).substring(7);
    res.cookie('oauth_state', state, { httpOnly: true, secure: true, sameSite: 'none' });
    res.cookie('oauth_platform', platform, { httpOnly: true, secure: true, sameSite: 'none' });
    res.cookie('oauth_uid', (req as any).user.uid, { httpOnly: true, secure: true, sameSite: 'none' });

    const redirectUri = `${process.env.APP_URL || `http://localhost:${PORT}`}/auth/callback`;
    const url = provider.getAuthUrl(redirectUri);
    res.json({ url });
  });

  // OAuth Callback
  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code, state } = req.query;
    const platform = req.cookies.oauth_platform;
    const uid = req.cookies.oauth_uid;
    
    const provider = socialProviders[platform];
    if (!provider || !uid) return res.status(400).send("Invalid request context");

    try {
      const redirectUri = `${process.env.APP_URL || `http://localhost:${PORT}`}/auth/callback`;
      const credentials = await provider.exchangeCode(code as string, redirectUri);

      // Save to Firestore
      const db = admin.firestore();
      await db.collection('social_connections').add({
        uid,
        platform,
        ...credentials,
        createdAt: new Date().toISOString()
      });

      res.send(`
        <html>
          <body style="background: #1A1E26; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: '${platform}' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <div style="text-align: center;">
              <h2>Authentication Success</h2>
              <p>Connected ${platform} successfully. Closing...</p>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("OAuth Exchange Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // Direct Posting Route
  app.post("/api/social/post/:postId", authenticate, async (req, res) => {
    const { postId } = req.params;
    const db = admin.firestore();
    const postDoc = await db.collection('posts').doc(postId).get();
    
    if (!postDoc.exists) return res.status(404).json({ error: "Post not found" });
    const postData = postDoc.data()!;

    // Find connection
    const connections = await db.collection('social_connections')
      .where('uid', '==', (req as any).user.uid)
      .where('platform', '==', postData.platform)
      .limit(1).get();

    if (connections.empty) return res.status(400).json({ error: "Platform not connected" });
    const connection = connections.docs[0].data();

    const provider = socialProviders[postData.platform];
    try {
      const result = await provider.postContent(connection.accessToken, postData.content);
      await postDoc.ref.update({ status: 'posted', externalId: result.externalId });
      res.json({ success: true, externalId: result.externalId });
    } catch (error) {
      console.error("Posting Error:", error);
      res.status(500).json({ error: "Failed to post content" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
