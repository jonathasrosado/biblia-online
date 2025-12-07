const BASE_URL = 'https://easygoing-achievement-production.up.railway.app';

async function testDebug() {
    console.log(`Testing Debug Endpoint: ${BASE_URL}/api/ai/debug-raw ...`);
    try {
        const res = await fetch(`${BASE_URL}/api/ai/debug-raw`);
        if (res.ok) {
            const data = await res.json();
            console.log("✅ Debug Results:");
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.error(`❌ Debug Request Failed: ${res.status}`);
            console.error(await res.text());
        }
    } catch (e) {
        console.error("❌ Connection Failed:", e.message);
    }
}

testDebug();
