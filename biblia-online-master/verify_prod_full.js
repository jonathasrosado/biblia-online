const fetch = import('node-fetch').then(m => m.default).catch(() => global.fetch);

const BASE_URL = 'https://easygoing-achievement-production.up.railway.app';

async function testEndpoint(name, url, body) {
    console.log(`\nTesting ${name} (${BASE_URL}${url})...`);
    const start = Date.now();
    try {
        // Use dynamic fetch import or global
        const f = await fetch;
        const res = await f(`${BASE_URL}${url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const duration = (Date.now() - start) / 1000;
        console.log(`⏱️ Duration: ${duration}s`);

        if (res.ok) {
            const rawData = await res.json();
            let data = rawData;
            // Handle wrapped response (Frontend Expectation)
            if (rawData.text) {
                try {
                    data = JSON.parse(rawData.text);
                    console.log("✅ Wrapped JSON parsing success!");
                } catch (e) {
                    console.warn("⚠️ Could not parse wrapped JSON:", e);
                }
            }

            console.log(`✅ ${name} Success!`);
            console.log("FULL DATA:", JSON.stringify(data, null, 2));
        } else {
            console.log(`❌ ${name} Failed: ${res.status}`);
            const text = await res.text();
            console.log("Error Body:", text.substring(0, 200));
        }
    } catch (e) {
        console.log(`❌ ${name} Error:`, e.message);
    }
}

async function run() {
    await testEndpoint('SEARCH', '/api/ai/search', { query: "hope", language: "pt" });
    await new Promise(r => setTimeout(r, 2000)); // Pause to separate logs
    await testEndpoint('DEVOTIONAL', '/api/ai/devotional', { language: "pt" });
}

run();
