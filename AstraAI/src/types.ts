export type BrandProfile = {
  uid?: string;
  name: string;
  website: string;
  industry: string;
  tagline: string;
  description: string;
  colors: string[];
  fonts: string[];
  aesthetic: string;
  tone: string;
  values: string[];
  products: string[];
  competition_area: string;
  strong_competitors: string[];
  brand_images: string[];
  logo_url?: string;
  audience_persona: {
    demographics: string;
    pain_points: string[];
    aspirations: string[];
  };
  competitor_insights: {
    strengths: string[];
    weaknesses: string[];
    market_gaps: string[];
    opportunities: string[];
  };
  social_trends: {
    platform: string;
    trends: string[];
  }[];
  checklist: string[];
};

export type Post = {
  id: string;
  uid?: string;
  campaignId?: string;
  platform: 'X' | 'Discord' | 'Telegram' | 'Instagram' | 'YouTube';
  content: string;
  title?: string;
  mediaType: 'text' | 'image' | 'video';
  aspectRatio?: string;
  imageUrl?: string;
  videoUrl?: string;
  status: 'draft' | 'pending' | 'approved' | 'scheduled' | 'posted' | 'failed';
  score?: number;
  quality_report?: {
    engagement: number;
    alignment: number;
    creativity: number;
    clarity: number;
  };
  feedback?: string;
  createdAt: string;
  scheduledAt?: string;
};

export type Campaign = {
  id: string;
  uid: string;
  title: string;
  brief: string;
  targetAudience: string;
  aspectRatio: string;
  type: string;
  aesthetic: string;
  rules: string;
  status: 'active' | 'completed' | 'archived';
  autoApproval: boolean;
  createdAt: string;
};

export type Analytics = {
  views: number;
  likes: number;
  shares: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  pain_points?: string[];
  feature_requests?: string[];
  suggestions: string[];
};

export type AgentState = {
  currentAgent: number;
  isLooping: boolean;
  lastUpdate: string;
};
