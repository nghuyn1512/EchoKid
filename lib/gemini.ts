import {GoogleGenAI} from "@google/genai"
// avaiable for Gemini-3.1-flash-lite and 3-flash-preview version
export const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
});