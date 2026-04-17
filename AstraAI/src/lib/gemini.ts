import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const models = {
  flash: "gemini-flash-latest",
  pro: "gemini-3.1-pro-preview",
  flashNew: "gemini-3-flash-preview",
  proNew: "gemini-3.1-pro-preview",
  image: "gemini-2.5-flash-image",
  video: "veo-3.1-lite-generate-preview"
};

export async function generateImage(prompt: string, aspectRatio: "1:1" | "4:3" | "3:4" | "16:9" | "9:16" = "1:1"): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: models.image,
      contents: [{ text: prompt }],
      config: {
        imageConfig: {
          aspectRatio,
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return "";
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    return "";
  }
}

export async function generateVideo(prompt: string, aspectRatio: "16:9" | "9:16" = "16:9"): Promise<string> {
  try {
    const operation = await ai.models.generateVideos({
      model: models.video,
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio
      }
    });

    let result = operation;
    while (!result.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      result = await (ai as any).operations.get(result.name);
    }

    const videoData = result.response?.generatedVideos?.[0]?.video?.videoBytes;
    if (videoData) {
      return `data:video/mp4;base64,${videoData}`;
    }
    return "";
  } catch (error) {
    console.error("Gemini Video Generation Error:", error);
    return "";
  }
}

export async function generateJSON<T>(prompt: string, schema: any, modelName: string = models.flashNew, tools?: any[]): Promise<T> {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      tools: tools,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    } as any);

    return JSON.parse(response.text || "{}") as T;
  } catch (error) {
    console.error("Gemini JSON Generation Error:", error);
    throw error;
  }
}

export async function generateContent(prompt: string, modelName: string = models.flashNew): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini Content Generation Error:", error);
    return "";
  }
}
