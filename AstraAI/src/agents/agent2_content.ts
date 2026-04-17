import { generateJSON, generateImage, generateVideo, models } from "../lib/gemini";
import { BrandProfile, Post } from "../types";
import { compressBase64Image } from "../lib/imageUtils";

const SINGLE_POST_SCHEMA = {
  type: "OBJECT",
  properties: {
    platform: { type: "STRING", enum: ["X", "Discord", "Telegram", "Instagram", "YouTube"] },
    title: { type: "STRING" },
    content: { type: "STRING" },
    mediaType: { type: "STRING", enum: ["text", "image", "video"] },
    imagePrompt: { type: "STRING", description: "Prompt for AI image generation if mediaType is image" },
    videoPrompt: { type: "STRING", description: "Prompt for AI video generation if mediaType is video" },
    quality_report: {
      type: "OBJECT",
      properties: {
        engagement: { type: "NUMBER" },
        alignment: { type: "NUMBER" },
        creativity: { type: "NUMBER" },
        clarity: { type: "NUMBER" }
      },
      required: ["engagement", "alignment", "creativity", "clarity"]
    },
    score: { type: "NUMBER" },
    feedback: { type: "STRING" }
  },
  required: ["platform", "content", "mediaType", "quality_report", "score"]
};

async function generateSinglePost(brand: BrandProfile, platform: string, existingFeedback?: string): Promise<Post> {
  const prompt = `Act as a Creative Multimedia Marketing Agent. 
  Generate a high-impact post for ${platform}.
  
  Brand: ${brand.name}
  Aesthetic: ${brand.aesthetic}
  Tone: ${brand.tone}
  Target Audience: ${brand.audience_persona.demographics}
  Checklist Rules: ${brand.checklist.join(", ")}
  
  Determine the best media type for this platform:
  - Instagram/YouTube: Prefer image or video.
  - X/Discord: Can be text, image, or video.
  
  If you choose image or video, provide a detailed visual prompt.
  
  ${existingFeedback ? `CRITICAL PREVIOUS FEEDBACK TO FIX: ${existingFeedback}` : ""}
  
  Final Score is the average of quality metrics.`;

  const result = await generateJSON<any>(prompt, SINGLE_POST_SCHEMA, models.flashNew);
  
  let imageUrl: string | undefined = undefined;
  let videoUrl: string | undefined = undefined;

  if (result.mediaType === 'image' && result.imagePrompt) {
    const rawImage = await generateImage(result.imagePrompt, platform === 'Instagram' ? '3:4' : '1:1');
    if (rawImage) {
      imageUrl = await compressBase64Image(rawImage, 800, 0.6);
    }
  } else if (result.mediaType === 'video' && result.videoPrompt) {
    videoUrl = await generateVideo(result.videoPrompt, platform === 'YouTube' ? '16:9' : '9:16');
  }
  
  const post: Post = {
    ...result,
    id: Math.random().toString(36).substring(7),
    status: result.score >= 9 ? 'approved' : 'pending',
    createdAt: new Date().toISOString()
  };

  if (imageUrl) post.imageUrl = imageUrl;
  if (videoUrl) post.videoUrl = videoUrl;

  return post;
}

export async function generateContentLoop(brand: BrandProfile, count: number = 3): Promise<Post[]> {
  const finalPosts: Post[] = [];
  const platforms: ('X' | 'Discord' | 'Telegram' | 'Instagram' | 'YouTube')[] = ['X', 'Instagram', 'YouTube', 'Discord'];

  for (let i = 0; i < count; i++) {
    const platform = platforms[i % platforms.length];
    let post = await generateSinglePost(brand, platform);
    
    let attempts = 0;
    while ((post.score || 0) < 7 && attempts < 1) {
      post = await generateSinglePost(brand, platform, post.feedback || "Improve overall impact.");
      attempts++;
    }
    
    finalPosts.push(post);
  }

  return finalPosts;
}
