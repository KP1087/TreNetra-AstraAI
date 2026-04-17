import React from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  doc,
  setDoc,
  getDocs,
  limit
} from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { analyzeBrand } from '../agents/agent1_brand';
import { generateContentLoop } from '../agents/agent2_content';
import { analyzeFeedback } from '../agents/agent3_feedback';
import { generateBrandVisuals } from '../agents/agent5_visuals';
import { generateCampaignIdeas, critiqueCampaignIdea, refineCampaignIdea, finalizeCampaignPost } from '../agents/agent6_campaign';
import { BrandProfile, Post, Analytics, AgentState, Campaign } from '../types';
import { compressBase64Image } from './imageUtils';
import { toast } from 'sonner';

export function useOrchestrator() {
  const [user, setUser] = React.useState<User | null>(null);
  const [brand, setBrand] = React.useState<BrandProfile | null>(null);
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [connections, setConnections] = React.useState<any[]>([]);
  const [analytics, setAnalytics] = React.useState<Analytics | null>(null);
  const [isReady, setIsReady] = React.useState(false);
  const [state, setState] = React.useState<AgentState>({
    currentAgent: 0,
    isLooping: false,
    lastUpdate: new Date().toISOString()
  });

  // Auth Listener
  React.useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsReady(true);
    });
  }, []);

  // Data Persistence Listeners
  React.useEffect(() => {
    if (!user) {
      setBrand(null);
      setPosts([]);
      return;
    }

    const brandQuery = query(
      collection(db, 'brands'), 
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeBrand = onSnapshot(brandQuery, (snapshot) => {
      if (!snapshot.empty) {
        setBrand(snapshot.docs[0].data() as BrandProfile);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'brands'));

    const postsQuery = query(
      collection(db, 'posts'), 
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'posts'));

    const campaignsQuery = query(
      collection(db, 'campaigns'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeCampaigns = onSnapshot(campaignsQuery, (snapshot) => {
      setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'campaigns'));

    const connectionsQuery = query(
      collection(db, 'social_connections'),
      where('uid', '==', user.uid)
    );
    const unsubscribeConnections = onSnapshot(connectionsQuery, (snapshot) => {
      setConnections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeBrand();
      unsubscribePosts();
      unsubscribeCampaigns();
      unsubscribeConnections();
    };
  }, [user]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const runFullLoop = async (userInput: string, targetPlatforms?: string[]) => {
    if (!user) return;
    setState(prev => ({ ...prev, isLooping: true, currentAgent: 1 }));
    
    try {
      // 1. Brand Intelligence
      const brandProfile = await analyzeBrand(userInput, targetPlatforms);
      
      // 1.5 Visual Identity Generation
      const rawVisuals = await generateBrandVisuals(brandProfile);
      const brandVisuals = await Promise.all(rawVisuals.map(img => compressBase64Image(img, 800, 0.6)));
      
      const brandRef = doc(collection(db, 'brands'));
      await setDoc(brandRef, { 
        ...brandProfile, 
        brand_images: brandVisuals,
        uid: user.uid, 
        createdAt: new Date().toISOString() 
      });
      setState(prev => ({ ...prev, currentAgent: 2 }));

      // 2. Content Generation
      const generatedPosts = await generateContentLoop(brandProfile);
      for (const p of generatedPosts) {
        await addDoc(collection(db, 'posts'), {
          ...p,
          uid: user.uid,
          createdAt: new Date().toISOString()
        });
      }
      setState(prev => ({ ...prev, currentAgent: 3 }));

      // 3. Feedback Analysis (Agent 3)
      // Mock raw comments for initial run
      const rawComments = [
        "I love the aesthetic but it's a bit pricey.",
        "Does this integrate with Shopify?",
        "Beautiful designs, when is the next drop?"
      ];
      const feedbackAnalytics = await analyzeFeedback(generatedPosts, rawComments);
      setAnalytics(feedbackAnalytics);
      
      setState(prev => ({ ...prev, currentAgent: 5, isLooping: false }));

    } catch (error) {
      console.error("Orchestrator Error:", error);
      setState(prev => ({ ...prev, isLooping: false }));
    }
  };

  const addUploadedImage = async (base64Image: string) => {
    if (!user) return;
    try {
      const q = query(collection(db, 'brands'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      const compressed = await compressBase64Image(base64Image, 800, 0.6);

      if (!snapshot.empty) {
        const brandDoc = snapshot.docs[0];
        const currentData = brandDoc.data() as BrandProfile;
        const updatedImages = [compressed, ...(currentData.brand_images || [])].slice(0, 8);
        await setDoc(brandDoc.ref, { brand_images: updatedImages }, { merge: true });
      } else {
        // Create initial skeleton brand if it doesn't exist
        const brandRef = doc(collection(db, 'brands'));
        await setDoc(brandRef, {
          uid: user.uid,
          name: 'New Brand',
          industry: 'Unknown',
          brand_images: [compressed],
          createdAt: new Date().toISOString(),
          description: '',
          tagline: '',
          website: '',
          colors: [],
          fonts: [],
          aesthetic: '',
          tone: '',
          values: [],
          products: [],
          competition_area: '',
          strong_competitors: [],
          audience_persona: { demographics: '', pain_points: [], aspirations: [] },
          competitor_insights: { strengths: [], weaknesses: [], market_gaps: [], opportunities: [] },
          social_trends: [],
          checklist: []
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'brands');
    }
  };

  const updateLogo = async (base64Image: string) => {
    if (!user) return;
    try {
      const q = query(collection(db, 'brands'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      const compressed = await compressBase64Image(base64Image, 400, 0.8);

      if (!snapshot.empty) {
        const brandDoc = snapshot.docs[0];
        await setDoc(brandDoc.ref, { logo_url: compressed }, { merge: true });
      } else {
        const brandRef = doc(collection(db, 'brands'));
        await setDoc(brandRef, {
          uid: user.uid,
          name: 'New Brand',
          industry: 'Unknown',
          logo_url: compressed,
          createdAt: new Date().toISOString(),
          brand_images: [],
          description: '',
          tagline: '',
          website: '',
          colors: [],
          fonts: [],
          aesthetic: '',
          tone: '',
          values: [],
          products: [],
          competition_area: '',
          strong_competitors: [],
          audience_persona: { demographics: '', pain_points: [], aspirations: [] },
          competitor_insights: { strengths: [], weaknesses: [], market_gaps: [], opportunities: [] },
          social_trends: [],
          checklist: []
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'brands');
    }
  };

  const savePhotoshootResult = async (base64Image: string) => {
    if (!user || !brand) return;
    try {
      const compressed = await compressBase64Image(base64Image, 1024, 0.7);

      // 1. Save to brand_images
      await addUploadedImage(compressed);

      // 2. Create a draft post
      await addDoc(collection(db, 'posts'), {
        uid: user.uid,
        platform: 'Instagram',
        content: `Brand photoshoot result for ${brand.name}. Created with AI Orchestrator.`,
        mediaType: 'image',
        imageUrl: compressed,
        status: 'draft',
        score: 9,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'posts');
    }
  };

  const createCampaign = async (campaignInput: {
    idea: string;
    targetAudience: string;
    aspectRatio: string;
    type: string;
    aesthetic: string;
    rules: string;
    autoApproval: boolean;
  }) => {
    if (!user || !brand) return;
    setState(prev => ({ ...prev, isLooping: true, currentAgent: 6 }));

    try {
      // 1. Create campaign record
      const campaignRef = await addDoc(collection(db, 'campaigns'), {
        uid: user.uid,
        title: campaignInput.idea.substring(0, 50),
        brief: campaignInput.idea,
        targetAudience: campaignInput.targetAudience,
        aspectRatio: campaignInput.aspectRatio,
        type: campaignInput.type,
        aesthetic: campaignInput.aesthetic,
        rules: campaignInput.rules,
        status: 'active',
        autoApproval: campaignInput.autoApproval,
        createdAt: new Date().toISOString()
      });

      // 2. Generate Initial Ideas
      toast.info('Agent 6: Generating high-impact campaign posts...');
      const rawPosts = await generateCampaignIdeas(brand, campaignInput);
      
      // 3. Process each post through Critique Loop
      for (let postData of rawPosts) {
        let attempts = 0;
        let finalPostData = postData;
        
        toast.info(`Critiquing Post: "${finalPostData.title || 'Untitled'}"...`);
        let critique = await critiqueCampaignIdea(brand, finalPostData, campaignInput);

        while (!critique.is_valid && attempts < 3) {
          toast.info(`Refining Post: "${finalPostData.title}" (Psychology Optimization Attempt ${attempts + 1}/3)...`);
          finalPostData = await refineCampaignIdea(brand, finalPostData, critique, campaignInput);
          critique = await critiqueCampaignIdea(brand, finalPostData, campaignInput);
          attempts++;
        }

        // 4. Generate Visuals and Save Posts
        toast.info(`Finalizing media for: "${finalPostData.title}"...`);
        const post = await finalizeCampaignPost(brand, finalPostData, campaignInput.aspectRatio, critique.score);
        await addDoc(collection(db, 'posts'), {
          ...post,
          uid: user.uid,
          campaignId: campaignRef.id,
          status: campaignInput.autoApproval ? 'approved' : 'draft'
        });
      }

      setState(prev => ({ ...prev, isLooping: false }));
    } catch (error) {
      console.error("Campaign Creation Error:", error);
      setState(prev => ({ ...prev, isLooping: false }));
    }
  };

  const approvePost = async (postId: string) => {
    try {
      await setDoc(doc(db, 'posts', postId), { status: 'approved' }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'posts');
    }
  };

  const removeImage = async (imageUrl: string) => {
    if (!user || !brand) return;
    try {
      const q = query(collection(db, 'brands'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const brandDoc = snapshot.docs[0];
        const updatedImages = (brand.brand_images || []).filter(img => img !== imageUrl);
        await setDoc(brandDoc.ref, { brand_images: updatedImages }, { merge: true });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'brands');
    }
  };

  const schedulePost = async (postId: string, date: string) => {
    try {
      await setDoc(doc(db, 'posts', postId), { status: 'scheduled', scheduledAt: date }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'posts');
    }
  };

  return {
    user,
    brand,
    posts,
    campaigns,
    connections,
    analytics,
    state,
    isReady,
    login,
    runFullLoop,
    setPosts,
    setBrand,
    addUploadedImage,
    updateLogo,
    removeImage,
    savePhotoshootResult,
    createCampaign,
    approvePost,
    schedulePost
  };
}
