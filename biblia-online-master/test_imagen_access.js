import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
import https from 'https';

// Load env manually
const loadEnv = () => {
    const envFiles = ['.env.local', '.env'];
    for (const file of envFiles) {
        const filePath = path.resolve(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            content.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
                    process.env[key] = value;
                }
            });
        }
    }
};
loadEnv();

const apiKey = process.env.GEMINI_API_KEY;
console.log("Testing API Key:", apiKey ? "Present" : "Missing");

if (!apiKey) {
    console.error("No API Key found in .env or .env.local");
    process.exit(1);
}

const model = 'imagen-3.0-generate-001';
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

console.log(`Testing URL: ${url.replace(apiKey, 'HIDDEN_KEY')}`);

const payload = {
    instances: [{ prompt: "A beautiful landscape of a mountain at sunset, photorealistic, 8k" }],
    parameters: {
        aspectRatio: '16:9',
        sampleCount: 1
    }
};

fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
})
    .then(async res => {
        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log("Response Body:", text);
    })
    .catch(err => {
        console.error("Fetch Error:", err);
    });
