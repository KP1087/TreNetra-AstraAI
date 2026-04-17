import { generateJSON, models } from "../lib/gemini";
import { Post, Analytics } from "../types";

const FEEDBACK_SCHEMA = {
  type: "OBJECT",
  properties: {
    views: { type: "NUMBER" },
    likes: { type: "NUMBER" },
    shares: { type: "NUMBER" },
    sentiment: { type: "STRING", enum: ["positive", "neutral", "negative"] },
    pain_points: { type: "ARRAY", items: { type: "STRING" } },
    feature_requests: { type: "ARRAY", items: { type: "STRING" } },
    suggestions: { type: "ARRAY", items: { type: "STRING" } }
  },
  required: ["views", "likes", "sentiment", "pain_points", "feature_requests"]
};

export async function analyzeFeedback(posts: Post[], rawComments: string[]): Promise<Analytics> {
  const prompt = `Act as a Feedback & Optimization Agent. 
  Analyze the following social media comments and engagement data for these posts:
  
  Posts: ${posts.map(p => p.content).join(" | ")}
  
  Raw Comments: ${rawComments.join("\n")}
  
  Extract:
  1. Customer Pain Points: What are people complaining about?
  2. Feature Requests: What do they want us to build?
  3. General Sentiment: Overall mood.
  4. Marketing Optimizations: How should the NEXT batch of content improve?
  
  Provide estimated views/likes based on the feedback volume.`;

  return await generateJSON<Analytics>(prompt, FEEDBACK_SCHEMA, models.flashNew);
}
