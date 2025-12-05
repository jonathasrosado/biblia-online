
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'server', 'ai-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const apiKey = config.apiKeys.openrouter;

const model = "deepseek/deepseek-chat";

console.log(`Testing JSON generation with ${model}...`);

async function test() {
    try {
        const body = {
            model: model,
            messages: [
                { role: "user", content: "List 3 fruits. IMPORTANT: Respond with valid JSON only." }
            ],
            response_format: { type: "json_object" }
        };

        console.log("Request Body:", JSON.stringify(body, null, 2));

        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://biblia-online-inteligente.com",
                "X-Title": "Biblia Online Inteligente"
            },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            const data = await res.json();
            console.log(`[SUCCESS] Response: ${JSON.stringify(data)}`);
        } else {
            const text = await res.text();
            console.log(`[FAILED] Status: ${res.status}, Body: ${text}`);
        }
    } catch (e) {
        console.log(`[ERROR] ${e.message}`);
    }
}

test();
