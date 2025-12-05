import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load Env Vars
console.log("--- Loading Env Vars ---");
const loadEnv = () => {
    const envFiles = ['.env.local', '.env'];
    envFiles.forEach(file => {
        const filePath = path.resolve(__dirname, file);
        if (fs.existsSync(filePath)) {
            console.log(`Loading env from ${file}`);
            const buffer = fs.readFileSync(filePath);
            const hex = buffer.subarray(0, 40).toString('hex');
            fs.writeFileSync('debug_output.txt', `File: ${file}\nHex: ${hex}\nContent: ${buffer.toString()}\n`);

            const content = buffer.toString('utf-8'); // Try default
            // ... rest of logic
            console.log("File content length:", content.length);
            content.split('\n').forEach((line, index) => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    let value = parts.slice(1).join('=').trim();
                    if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
                        value = value.substring(1, value.length - 1);
                    }
                    process.env[key] = value;
                    console.log(`Loaded key: ${key}`);
                }
            });
        } else {
            console.log(`File not found: ${file}`);
        }
    });
};
loadEnv();

// 2. Check Key
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_API_KEY;
console.log("API Key found?", !!apiKey);
if (apiKey) {
    console.log("Key length:", apiKey.length);
    console.log("Key starts with:", apiKey.substring(0, 4));
} else {
    console.error("CRITICAL: No API Key found in process.env");
    console.log("Available keys:", Object.keys(process.env).filter(k => k.includes('KEY') || k.includes('GEMINI')));
    process.exit(1);
}

// 3. Test Generation
async function testGen() {
    console.log("--- Testing AI Generation ---");
    try {
        const ai = new GoogleGenAI({ apiKey });
        const modelName = 'gemini-2.0-flash';

        console.log(`Model: ${modelName}`);
        console.log("Sending request...");

        const response = await ai.models.generateContent({
            model: modelName,
            contents: "Say 'Hello from Server' if you can hear me."
        });

        console.log("Response received!");
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log("Text:", text);

    } catch (e) {
        console.error("AI Generation Failed:", e);
    }
}

testGen();
