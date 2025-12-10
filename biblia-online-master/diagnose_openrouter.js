import { aiManager } from './server/services/aiManager.js';

async function diagnose() {
    console.log("=== OpenRouter Diagnostic ===");
    const config = aiManager.getConfig();
    const apiKey = config.apiKeys.openrouter;

    if (!apiKey) {
        console.error("No OpenRouter API Key found!");
        return;
    }

    // 1. Test Text Generation (Gemini Flash)
    console.log("\n1. Testing Text Generation (google/gemini-2.0-flash-exp:free)...");
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-exp:free",
                messages: [{ role: "user", content: "Hello, are you working?" }]
            })
        });

        if (!response.ok) {
            console.error("Text Gen Failed:", response.status, await response.text());
        } else {
            const data = await response.json();
            console.log("Text Gen Success:", data.choices[0].message.content);
        }
    } catch (e) {
        console.error("Text Gen Error:", e.message);
    }

    // 2. Test Image Generation (Imagen 3) - Endpoint: /images/generations
    console.log("\n2. Testing Image Generation (google/imagen-3) via /images/generations...");
    try {
        const response = await fetch("https://openrouter.ai/api/v1/images/generations", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/imagen-3",
                prompt: "A cute robot"
            })
        });

        if (!response.ok) {
            console.error("Image Gen (Standard) Failed:", response.status, await response.text());
        } else {
            const data = await response.json();
            console.log("Image Gen (Standard) Success:", JSON.stringify(data));
        }
    } catch (e) {
        console.error("Image Gen (Standard) Error:", e.message);
    }

    // 3. Test Image Generation (Flux) - Endpoint: /images/generations
    console.log("\n3. Testing Image Generation (Flux) via /images/generations...");
    try {
        const response = await fetch("https://openrouter.ai/api/v1/images/generations", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "black-forest-labs/flux-1-dev",
                prompt: "A cute robot"
            })
        });

        if (!response.ok) {
            console.error("Flux Gen (Standard) Failed:", response.status, await response.text());
        } else {
            const data = await response.json();
            console.log("Flux Gen (Standard) Success:", JSON.stringify(data));
        }
    } catch (e) {
        console.error("Flux Gen (Standard) Error:", e.message);
    }
}

diagnose();
