import fetch from 'node-fetch';

const BASE_URL = 'https://easygoing-achievement-production.up.railway.app';

async function testServer() {
    console.log(`Testing Production Server: ${BASE_URL} ...`);
    try {
        const res = await fetch(`${BASE_URL}/api/ai/status`);
        if (res.ok) {
            console.log("✅ Production Server Status: OK");
            const data = await res.json();
            console.log("Status Data:", data);
        } else {
            console.error(`❌ Production Server Status Failed: ${res.status}`);
            console.error(await res.text());
        }
    } catch (e) {
        console.error("❌ Connection Failed:", e.message);
        return;
    }

    console.log("\nTesting Search Endpoint (Production)...");
    try {
        const res = await fetch(`${BASE_URL}/api/ai/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'Hope', language: 'en' })
        });

        if (res.ok) {
            console.log("✅ Production Search Endpoint: OK");
            const data = await res.json();
            console.log("Search Result:", JSON.stringify(data, null, 2));
        } else {
            console.error(`❌ Production Search Endpoint Failed: ${res.status}`);
            const text = await res.text();
            try {
                const jsonErr = JSON.parse(text);
                console.error("FULL ERROR BODY:", JSON.stringify(jsonErr, null, 2));
            } catch (e) {
                console.error("FULL ERROR BODY (Raw):", text);
            }
        }
    } catch (e) {
        console.error("❌ Production Search Request Failed:", e.message);
    }

    console.log("\nTesting Chat Endpoint (Control Test)...");
    try {
        const res = await fetch(`${BASE_URL}/api/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Hello, explain John 3:16',
                history: [],
                language: 'en'
            })
        });

        if (res.ok) {
            const data = await res.json();
            console.log("✅ Chat Endpoint: OK");
            console.log("Chat Response:", data.text.substring(0, 100) + "...");
        } else {
            console.error(`❌ Chat Endpoint Failed: ${res.status}`);
            console.error("Chat Error:", await res.text());
        }
    } catch (e) {
        console.error("❌ Chat Request Failed:", e.message);
    }
}

testServer();
