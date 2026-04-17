import { generateJSON, generateImage, generateVideo, models } from "../lib/gemini";
import { BrandProfile, Post } from "../types";
import { compressBase64Image } from "../lib/imageUtils";

interface CampaignPostData {
  platform: 'X' | 'Discord' | 'Telegram' | 'Instagram' | 'YouTube';
  content: string;
  mediaType: 'text' | 'image' | 'video';
  imagePrompt?: string;
  videoPrompt?: string;
  psychology_rationale: string;
  title: string;
}

interface CritiqueResult {
  is_valid: boolean;
  score: number;
  criticism: string;
  improvement_suggestions: string;
}

export async function generateCampaignIdeas(
  brand: BrandProfile,
  userInput: {
    idea: string;
    targetAudience: string;
    aspectRatio: string;
    type: string;
    aesthetic: string;
    rules: string;
  }
): Promise<CampaignPostData[]> {
  const schema = {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        platform: { type: "STRING", enum: ["X", "Discord", "Telegram", "Instagram", "YouTube"] },
        content: { type: "STRING" },
        mediaType: { type: "STRING", enum: ["text", "image", "video"] },
        imagePrompt: { type: "STRING" },
        videoPrompt: { type: "STRING" },
        psychology_rationale: { type: "STRING" },
        title: { type: "STRING" }
      },
      required: ["platform", "content", "mediaType", "psychology_rationale", "title"]
    }
  };

  const prompt = `Act as a Master Creative Campaign Strategist and Expert in Consumer Psychology.
  Create EXACTLY 5 high-performing marketing posts (Posters, Text, or Videos) based on the brand DNA, market research, and the following campaign brief.
  
  BRAND DNA:
  - Name: ${brand.name}
  - Description: ${brand.description}
  - Aesthetic: ${brand.aesthetic}
  - Tone: ${brand.tone}
  
  MARKET RESEARCH (from RESEARCH page):
  - Competitor SWOT: ${JSON.stringify(brand.competitor_insights)}
  - Current Platform Trends: ${JSON.stringify(brand.social_trends)}
  - Target Persona Aspirations: ${brand.audience_persona.aspirations.join(', ')}
  - Target Persona Pain Points: ${brand.audience_persona.pain_points.join(', ')}
  
  CAMPAIGN BRIEF:
  - Idea: ${userInput.idea}
  - Target Audience: ${userInput.targetAudience}
  - Preferred Media Types: ${userInput.type}
  - Visual Aesthetic: ${userInput.aesthetic}
  - Aspect Ratio Wanted: ${userInput.aspectRatio}
  - Branding Rules: ${userInput.rules}
  
  For each post:
  1. For IMAGES: Provide a highly descriptive prompt that includes lighting, mood, camera angle, and the specific "human element" (diverse, authentic expressions). Use psychological triggers based on pain points and aspirations.
  2. For VIDEOS: Provide a cinematic storyboard/prompt.
  3. For TEXT: Provide high-converting copy that uses psychological triggers (FOMO, Social Proof, Reciprocity, etc.).
  4. Explain the "psychology_rationale" in depth, detailing how the visual and textual elements trigger the specific target audience's emotions and behavior based on the research provided.
  5. Title: A short descriptive name for this post.`;

  return generateJSON<CampaignPostData[]>(prompt, schema, models.proNew);
}

export async function critiqueCampaignIdea(
  brand: BrandProfile,
  post: CampaignPostData,
  brief: any
): Promise<CritiqueResult> {
  const schema = {
    type: "OBJECT",
    properties: {
      is_valid: { type: "BOOLEAN" },
      score: { type: "NUMBER" },
      criticism: { type: "STRING" },
      improvement_suggestions: { type: "STRING" }
    },
    required: ["is_valid", "score", "criticism", "improvement_suggestions"]
  };

  const prompt = `Act as a Senior Creative Director and World-Class Consumer Psychology Expert.
  CRITICALLY rate and critique the following marketing post. Your goal is to find flaws in accuracy, branding, and psychological impact.
  
  CONTEXT:
  - Brand DNA: ${brand.name} (${brand.description})
  - Market Research: ${JSON.stringify(brand.competitor_insights)}
  - Social Trends: ${JSON.stringify(brand.social_trends)}
  
  CAMPAIGN BRIEF:
  ${JSON.stringify(brief, null, 2)}
  
  GENERATED POST TO RATE:
  ${JSON.stringify(post, null, 2)}
  
  EVALUATION CRITERIA (Strict):
  1. BRAND FIDELITY: Does it perfectly match the tone, aesthetic, and rules?
  2. PSYCHOLOGICAL TRIGGERS: Does it leverage the research data? Does it use strong cognitive biases (Social Proof, Urgency, Scarcity, Authority) effectively for the target audience?
  3. HUMAN ACCURACY: For images, is the "human element" authentic or generic?
  4. CONTRARIAN CHECK: Is it boring? Does it stand out against competitors?
  
  MARK AS INVALID (is_valid: false) if the score is below 8.0/10. Provide constructive feedback to guide the generator.`;

  return generateJSON<CritiqueResult>(prompt, schema, models.proNew);
}

export async function refineCampaignIdea(
  brand: BrandProfile,
  originalPost: CampaignPostData,
  critique: CritiqueResult,
  brief: any
): Promise<CampaignPostData> {
  const schema = {
    type: "OBJECT",
    properties: {
      platform: { type: "STRING", enum: ["X", "Discord", "Telegram", "Instagram", "YouTube"] },
      content: { type: "STRING" },
      mediaType: { type: "STRING", enum: ["text", "image", "video"] },
      imagePrompt: { type: "STRING" },
      videoPrompt: { type: "STRING" },
      psychology_rationale: { type: "STRING" },
      title: { type: "STRING" }
    },
    required: ["platform", "content", "mediaType", "psychology_rationale", "title"]
  };

  const prompt = `Refine the following marketing post based on the Creative Director's critique.
  
  ORIGINAL POST:
  ${JSON.stringify(originalPost, null, 2)}
  
  CRITIQUE:
  ${critique.criticism}
  
  IMPROVEMENT SUGGESTIONS:
  ${critique.improvement_suggestions}
  
  Re-generate the post with improved accuracy, better psychological triggers, and strict adherence to the brand rules provided in the brief:
  ${JSON.stringify(brief, null, 2)}`;

  return generateJSON<CampaignPostData>(prompt, schema, models.proNew);
}

export async function finalizeCampaignPost(
  brand: BrandProfile,
  postData: any,
  aspectRatio: string,
  score: number = 9.5
): Promise<Post> {
  let imageUrl: string | undefined = undefined;
  let videoUrl: string | undefined = undefined;

  if (postData.mediaType === 'image' && postData.imagePrompt) {
    const rawImage = await generateImage(postData.imagePrompt, (aspectRatio as any) || '1:1');
    if (rawImage) {
      imageUrl = await compressBase64Image(rawImage, 1024, 0.7);
    }
  } else if (postData.mediaType === 'video' && postData.videoPrompt) {
    videoUrl = await generateVideo(postData.videoPrompt, (aspectRatio as any) === '9:16' ? '9:16' : '16:9');
  }

  const post: Post = {
    id: Math.random().toString(36).substring(7),
    platform: postData.platform,
    content: postData.content,
    mediaType: postData.mediaType,
    aspectRatio,
    status: 'draft',
    score: score,
    quality_report: {
      engagement: Math.floor(score),
      alignment: 10,
      creativity: Math.floor(score),
      clarity: 10
    },
    feedback: postData.psychology_rationale,
    createdAt: new Date().toISOString()
  };

  if (imageUrl) post.imageUrl = imageUrl;
  if (videoUrl) post.videoUrl = videoUrl;

  return post;
}
