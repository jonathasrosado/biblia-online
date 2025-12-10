import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'server', 'ai-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const apiKey = config.apiKeys.openrouter;

const modelsToTest = [
    "google/gemini-2.5-flash-image-preview",
    "black-forest-labs/flux-1-schnell",
    "openai/gpt-5-image-mini"
];

const results = [];

async function testModel(model) {
    console.log(`Testing ${model}...`);
    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://biblia-online-inteligente.com",
                "X-Title": "Biblia Online Inteligente"
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "user", content: "Generate an image of a futuristic city" }
                ],
                modalities: ["image", "text"]
            })
        });

        if (res.ok) {
            const data = await res.json();
            results.push(`[SUCCESS] ${model} worked!`);
            if (data.choices && data.choices[0].message.images) {
                results.push(`[IMAGE] URL: ${data.choices[0].message.images[0].image_url.url}`);
            } else {
                results.push(`[RESPONSE] ${JSON.stringify(data)}`);
            }
        } else {
            const text = await res.text();
            results.push(`[FAILED] ${model}: ${res.status} - ${text}`);
        }
    } catch (e) {
        results.push(`[ERROR] ${model}: ${e.message}`);
    }
}

async function run() {
    for (const m of modelsToTest) {
        await testModel(m);
    }
    fs.writeFileSync(path.join(process.cwd(), 'test-results-modalities.txt'), results.join('\n'));
}

run();
