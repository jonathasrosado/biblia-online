import { aiManager } from './server/services/aiManager.js';

async function test() {
    console.log("=== OpenRouter Payload Test ===");
    const config = aiManager.getConfig();
    const apiKey = config.apiKeys.openrouter;

    // 1. Test Flux via Chat (Minimal Payload)
    console.log("\n1. Testing Flux via Chat (Minimal)...");
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "black-forest-labs/flux-1-dev",
                messages: [{ role: "user", content: "Generate an image of a cat" }]
            })
        });

        if (!response.ok) {
            console.log("Flux Minimal Failed Status:", response.status);
            console.log("Flux Minimal Failed Body:", await response.text());
        } else {
            const data = await response.json();
            console.log("Flux Minimal Success:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Flux Minimal Error:", e.message);
    }

    // 2. Test Gemini Flash Text (Minimal)
    console.log("\n2. Testing Gemini Flash Text (Minimal)...");
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-exp:free",
                messages: [{ role: "user", content: "Hello" }]
            })
        });

        if (!response.ok) {
            console.log("Gemini Text Failed Status:", response.status);
            console.log("Gemini Text Failed Body:", await response.text());
        } else {
            const data = await response.json();
            console.log("Gemini Text Success:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Gemini Text Error:", e.message);
    }
}

test();
