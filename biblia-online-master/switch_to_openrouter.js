const BASE_URL = 'https://easygoing-achievement-production.up.railway.app';

async function fixConfig() {
    console.log("Fetching current config...");
    try {
        const res = await fetch(`${BASE_URL}/api/ai/config`);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

        const config = await res.json();

        // Define OpenRouter Model Config
        const openRouterModel = {
            provider: 'openrouter',
            model: 'google/gemini-2.0-flash-exp:free'
        };

        console.log("Target Config (OpenRouter):", openRouterModel);

        if (!config.features) config.features = {};

        // Apply OpenRouter to ALL endpoints (to be safe and consistent)
        // Chat works with direct Gemini, but might as well unify or keep it separate.
        // Let's switch EVERYTHING to OpenRouter to guarantee no blocks.
        const targets = ['search', 'devotional', 'explain', 'detailed_answer', 'fluid_gen', 'blog_title', 'blog_post', 'rewrite', 'chat'];

        targets.forEach(t => {
            console.log(`Updating ${t} -> OpenRouter/${openRouterModel.model}`);
            config.features[t] = { ...openRouterModel };
        });

        console.log("Sending updated config...");
        const postRes = await fetch(`${BASE_URL}/api/ai/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        if (postRes.ok) {
            console.log("✅ Config Switched to OpenRouter!");
        } else {
            console.error("❌ Config Update Failed:", await postRes.text());
        }

    } catch (e) {
        console.error("Link Error:", e.message);
    }
}

fixConfig();
