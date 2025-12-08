import 'dotenv/config';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Load config manually since we are outside the app context
const configPath = path.join(process.cwd(), 'server/ai-config.json');
let apiKey = process.env.OPENROUTER_API_KEY;

if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.apiKeys && config.apiKeys.openrouter) {
        apiKey = config.apiKeys.openrouter;
    }
}

if (!apiKey) {
    console.error("❌ No OpenRouter API Key found in env or ai-config.json");
    process.exit(1);
}

console.log(`🔑 Using API Key: ${apiKey.substring(0, 10)}...`);

const testModel = async (family, modelId, prompt = "Say hello briefly.") => {
    console.log(`\nTesting ${family} (${modelId})...`);
    try {
        const body = {
            model: modelId,
            messages: [{ role: "user", content: prompt }]
        };

        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://biblia-online-test.com",
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`${res.status} - ${txt}`);
        }

        const data = await res.json();
        const output = data.choices[0].message.content;
        console.log(`✅ Success! Response: "${output.substring(0, 50)}..."`);
        return true;
    } catch (e) {
        console.error(`❌ Failed: ${e.message}`);
        return false;
    }
};

const runTests = async () => {
    console.log("🚀 Starting OpenRouter Connectivity Tests...");

    // Test 1: Google (Gemini)
    await testModel("Google", "google/gemini-2.0-flash-exp:free");

    // Test 2: OpenAI
    await testModel("OpenAI", "openai/gpt-4o-mini");

    // Test 3: Anthropic
    await testModel("Anthropic", "anthropic/claude-3-haiku");

    // Test 4: xAI (Grok)
    await testModel("xAI (Grok)", "x-ai/grok-2-1212");

    // Test 5: Image (Flux)
    console.log("\nTesting Image Generation (Flux)...");
    try {
        const body = {
            model: "black-forest-labs/flux-1-schnell",
            messages: [{ role: "user", content: "A small red cube" }]
        };
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://biblia-online-test.com",
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        // Check for image URL logic
        if (data.choices && data.choices[0].message.content.includes("http")) {
            console.log(`✅ Success! Image URL found in content.`);
        } else {
            // Sometimes OpenRouter returns image directly in a different format or as a link
            console.log(`⚠️ Partial/Check: ${JSON.stringify(data).substring(0, 200)}`);
        }
    } catch (e) {
        console.error(`❌ Image Test Failed: ${e.message}`);
    }

    console.log("\n🏁 Validation Complete.");
};

runTests();
