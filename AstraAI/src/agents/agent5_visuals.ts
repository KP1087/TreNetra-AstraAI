import { generateImage } from "../lib/gemini";
import { BrandProfile } from "../types";

export async function generateBrandVisuals(brand: BrandProfile): Promise<string[]> {
  const prompts = [
    `Professional product lifestyle photography for ${brand.name}, showing ${brand.description} in a ${brand.aesthetic} environment. Clean, high-end commercial aesthetic.`,
    `A cohesive moodboard for ${brand.name} featuring ${brand.aesthetic} design elements, ${brand.colors.join(", ")} color palette, and premium textures.`,
    `An artistic abstract visual representation of ${brand.name}'s core values using ${brand.aesthetic} styling and high-quality studio lighting.`
  ];

  const results = await Promise.all(
    prompts.map(prompt => generateImage(prompt, "16:9"))
  );

  return results.filter(img => !!img);
}
