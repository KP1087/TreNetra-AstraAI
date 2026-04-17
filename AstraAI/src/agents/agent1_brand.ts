import { generateJSON, models } from "../lib/gemini";
import { BrandProfile } from "../types";

const BRAND_PROFILE_SCHEMA = {
  type: "OBJECT",
  properties: {
    name: { type: "STRING" },
    website: { type: "STRING" },
    industry: { type: "STRING" },
    tagline: { type: "STRING" },
    description: { type: "STRING" },
    colors: { type: "ARRAY", items: { type: "STRING" } },
    fonts: { type: "ARRAY", items: { type: "STRING" } },
    aesthetic: { type: "STRING" },
    tone: { type: "STRING" },
    values: { type: "ARRAY", items: { type: "STRING" } },
    products: { type: "ARRAY", items: { type: "STRING" } },
    competition_area: { type: "STRING" },
    strong_competitors: { type: "ARRAY", items: { type: "STRING" } },
    logo_url: { type: "STRING", description: "URL to the brand logo or icon" },
    audience_persona: {
      type: "OBJECT",
      properties: {
        demographics: { type: "STRING" },
        pain_points: { type: "ARRAY", items: { type: "STRING" } },
        aspirations: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["demographics", "pain_points", "aspirations"]
    },
    competitor_insights: {
      type: "OBJECT",
      properties: {
        strengths: { type: "ARRAY", items: { type: "STRING" } },
        weaknesses: { type: "ARRAY", items: { type: "STRING" } },
        market_gaps: { type: "ARRAY", items: { type: "STRING" } },
        opportunities: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["strengths", "weaknesses", "market_gaps", "opportunities"]
    },
    social_trends: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          platform: { type: "STRING" },
          trends: { type: "ARRAY", items: { type: "STRING" } }
        },
        required: ["platform", "trends"]
      }
    },
    checklist: { type: "ARRAY", items: { type: "STRING" } }
  },
  required: ["name", "industry", "description", "tone", "audience_persona", "competitor_insights", "products", "competition_area", "strong_competitors", "social_trends"]
};

export async function analyzeBrand(userInput: string, targetPlatforms: string[] = ['X', 'YouTube', 'Facebook', 'Instagram', 'Pinterest', 'Discord']): Promise<BrandProfile> {
  const prompt = `Act as a Senior Research & Brand Intelligence Agent. 
  Analyze the provided user input (which may include website URLs, product descriptions, or target audience info).
  
  Your goal is to perform DEEP real-time research using Google Search and extract:
  1. Core Identity: Name, tagline, logo_url (find the official logo image URL if possible), colors (hex codes), fonts, and overall aesthetic.
  2. Brand Essence: Values, tone of voice, and a concise business summary.
  3. Products: List of key products or services offered.
  4. Competition Research: 
     - Field/Area: Define the specific market category or niche.
     - Strong Competitors: List specific major competitors (search for current market leaders).
     - SWOT: Identify perceived strengths, weaknesses, market gaps, and upcoming opportunities.
  5. Audience Persona: Detailed demographics, core pain points, and aspirations.
  6. Social Media Trends: For EXACTLY these platforms: ${targetPlatforms.join(", ")}, identify what is CURRENTLY trending (search for recent hashtags, topics, and viral content) that relates to this niche/industry.
  7. Checklist: A set of content rules/validation points this brand must follow.
  
  User Input Source: ${userInput}`;

  return await generateJSON<BrandProfile>(prompt, BRAND_PROFILE_SCHEMA, models.flashNew, [{ googleSearch: {} }]);
}
