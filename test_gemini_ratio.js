
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'server', 'ai-config.json');
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
const apiKey = config.apiKeys.openrouter;

async function testRatio(ratioInput) {
    console.log(`Testing ratio input: ${ratioInput}`);

    // Simulate logic from aiManager.js
    let width = 1024;
    let height = 1024;
    if (ratioInput === "16:9") { width = 1280; height = 720; }

    let ratio = "1:1";
    let finalPrompt = "A futuristic city";

    if (width > height) {
        ratio = "16:9";
        finalPrompt = `Wide 16:9 landscape image of A futuristic city`;
    } else if (height > width) {
        ratio = "9:16";
        finalPrompt = `Tall 9:16 portrait image of A futuristic city`;
    } else {
        finalPrompt = `Square 1:1 image of A futuristic city`;
    }

    const body = {
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
            { role: "user", content: finalPrompt }
        ],
        extra_body: {
            image_config: {
                aspect_ratio: ratio
            }
        }
    };

    console.log("Request Body:", JSON.stringify(body, null, 2));

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://biblia-test.com",
                "X-Title": "Biblia Test"
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
}

testRatio("16:9");
