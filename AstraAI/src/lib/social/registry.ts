import axios from 'axios';

export interface SocialClient {
  platform: string;
  getAuthUrl(redirectUri: string): string;
  exchangeCode(code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: number; externalId?: string; username?: string }>;
  postContent(accessToken: string, content: string, mediaUrls?: string[]): Promise<{ externalId: string }>;
  getMetrics(accessToken: string, externalId: string): Promise<{ views: number; likes: number; shares: number; comments: number }>;
}

// Concrete Implementations

// 1. X (Twitter)
export class XClient implements SocialClient {
  platform = 'X';
  private clientId = process.env.X_CLIENT_ID || '';
  private clientSecret = process.env.X_CLIENT_SECRET || '';

  getAuthUrl(redirectUri: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: 'tweet.read tweet.write users.read offline.access',
      state: 'state',
      code_challenge: 'challenge', // Real impl would use PKCE
      code_challenge_method: 'plain'
    });
    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string) {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const response = await axios.post('https://api.twitter.com/2/oauth2/token', new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: 'challenge'
    }), {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Get basic user info to get username/id
    const userRes = await axios.get('https://api.twitter.com/2/users/me', {
      headers: { 'Authorization': `Bearer ${response.data.access_token}` }
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: Date.now() + (response.data.expires_in * 1000),
      externalId: userRes.data.data.id,
      username: userRes.data.data.username
    };
  }

  async postContent(accessToken: string, content: string, mediaUrls?: string[]) {
    // Media upload is separate in X API v2, for simplicity we post text
    const response = await axios.post('https://api.twitter.com/2/tweets', {
      text: content
    }, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return { externalId: response.data.data.id };
  }

  async getMetrics(accessToken: string, externalId: string) {
    const response = await axios.get(`https://api.twitter.com/2/tweets/${externalId}`, {
      params: { 'tweet.fields': 'public_metrics' },
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const metrics = response.data.data.public_metrics;
    return {
      views: metrics.impression_count || 0,
      likes: metrics.like_count || 0,
      shares: metrics.retweet_count || 0,
      comments: metrics.reply_count || 0
    };
  }
}

// 2. Discord (Webhooks or Bot depend on context, using OAuth for channel Posting)
export class DiscordClient implements SocialClient {
  platform = 'Discord';
  private clientId = process.env.DISCORD_CLIENT_ID || '';
  private clientSecret = process.env.DISCORD_CLIENT_SECRET || '';

  getAuthUrl(redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify guilds.join messages.read' // Simplified
    });
    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string) {
    const response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    }));

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: Date.now() + (response.data.expires_in * 1000),
      externalId: 'discord-user',
      username: 'Discord User'
    };
  }

  async postContent(accessToken: string, content: string) {
    // Discord normally uses webhooks for easy posting, but via OAuth we'd need a bot or specific channel access
    // For this context, assuming we use a webhook link stored in metadata if OAuth isn't enough
    return { externalId: 'msg-' + Date.now() };
  }

  async getMetrics() {
    return { views: 0, likes: 0, shares: 0, comments: 0 };
  }
}

// 3. Instagram
export class InstagramClient implements SocialClient {
  platform = 'Instagram';
  getAuthUrl() { return '#'; }
  async exchangeCode() { return { accessToken: 'stub', externalId: 'stub', username: 'Instagram User' }; }
  async postContent() { return { externalId: 'stub' }; }
  async getMetrics() { return { views: 0, likes: 0, shares: 0, comments: 0 }; }
}

// 4. YouTube
export class YouTubeClient implements SocialClient {
  platform = 'YouTube';
  getAuthUrl() { return '#'; }
  async exchangeCode() { return { accessToken: 'stub', externalId: 'stub', username: 'YouTube Channel' }; }
  async postContent() { return { externalId: 'stub' }; }
  async getMetrics() { return { views: 0, likes: 0, shares: 0, comments: 0 }; }
}

// 5. Telegram
export class TelegramClient implements SocialClient {
  platform = 'Telegram';
  getAuthUrl() { return '#'; }
  async exchangeCode() { return { accessToken: 'stub', externalId: 'stub', username: 'Telegram User' }; }
  async postContent() { return { externalId: 'stub' }; }
  async getMetrics() { return { views: 0, likes: 0, shares: 0, comments: 0 }; }
}

// 6. Facebook
export class FacebookClient implements SocialClient {
  platform = 'Facebook';
  getAuthUrl() { return '#'; }
  async exchangeCode() { return { accessToken: 'stub', externalId: 'stub', username: 'Facebook User' }; }
  async postContent() { return { externalId: 'stub' }; }
  async getMetrics() { return { views: 0, likes: 0, shares: 0, comments: 0 }; }
}

// Registry to find clients
export const socialProviders: Record<string, SocialClient> = {
  'X': new XClient(),
  'Discord': new DiscordClient(),
  'Instagram': new InstagramClient(),
  'YouTube': new YouTubeClient(),
  'Telegram': new TelegramClient(),
  'Facebook': new FacebookClient(),
};
