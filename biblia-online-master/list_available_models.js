import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load key from .env.local
let apiKey = "";
try {
    const envContent = fs.readFileSync(path.resolve(__dirname, '.env.local'), 'utf-8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    if (match) apiKey = match[1].trim();
} catch (e) {
    console.error("Could not read .env.local");
}

console.log(`Using Key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'NONE'}`);

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.models) {
            console.log("\n✅ Available Models:");
            data.models.forEach(m => {
                console.log(`- ${m.name.replace('models/', '')} (${m.displayName})`);
                // Check if it supports generateContent
                if (m.supportedGenerationMethods) {
                    console.log(`   Methods: ${m.supportedGenerationMethods.join(', ')}`);
                }
            });
        } else {
            console.error("\n❌ Error listing models:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Network error:", e.message);
    }
}

listModels();
