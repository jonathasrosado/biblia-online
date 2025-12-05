import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey) {
    console.error("No API Key found in .env.local");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function listModels() {
    try {
        const response = await ai.models.list();
        console.log("Available Models:");
        for await (const model of response) {
            if (model.name.includes('flash')) {
                process.stdout.write(model.name + '\n');
            }
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
