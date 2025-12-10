const BASE_URL = 'https://easygoing-achievement-production.up.railway.app';

async function fixConfig() {
    console.log("Fetching current config...");
    try {
        const res = await fetch(`${BASE_URL}/api/ai/config`);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

        const config = await res.json();

        // Restore 2.0 Flash Exp (Matches Chat)
        const targetModel = {
            provider: 'gemini',
            model: 'gemini-2.0-flash-exp'
        };

        console.log("Target Model Config:", targetModel);

        if (!config.features) config.features = {};

        const targets = ['search', 'devotional', 'explain', 'detailed_answer', 'fluid_gen', 'blog_title', 'blog_post', 'rewrite'];

        targets.forEach(t => {
            console.log(`Updating ${t} -> ${targetModel.model}`);
            config.features[t] = { ...targetModel };
        });

        console.log("Sending updated config...");
        const postRes = await fetch(`${BASE_URL}/api/ai/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        if (postRes.ok) {
            console.log("✅ Config Restored to 2.0-flash-exp!");
        } else {
            console.error("❌ Config Update Failed:", await postRes.text());
        }

    } catch (e) {
        console.error("Link Error:", e.message);
    }
}

fixConfig();
