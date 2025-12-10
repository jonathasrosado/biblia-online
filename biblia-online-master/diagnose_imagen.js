import { aiManager } from './server/services/aiManager.js';

async function diagnose() {
    console.log("Diagnosing Google Imagen integration...");

    const apiKey = aiManager.config.apiKeys.gemini;
    if (!apiKey) {
        console.error("No Gemini API Key found!");
        return;
    }

    const model = 'imagen-3.0-generate-001';

    console.log("\n--- Test 1: Predict Endpoint with Header Auth ---");
    const url1 = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`;
    try {
        const response = await fetch(url1, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                instances: [{ prompt: "A beautiful landscape" }],
                parameters: { aspectRatio: '16:9', sampleCount: 1 }
            })
        });
        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log(`Body: ${text.substring(0, 500)}`);
    } catch (e) { console.error(e); }
}

diagnose();
