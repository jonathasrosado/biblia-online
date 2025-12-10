const BASE_URL = 'http://localhost:3002';

async function testDevotional() {
    console.log("Testing DEVOTIONAL (Local)...");
    try {
        const res = await fetch(`${BASE_URL}/api/ai/devotional`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: 'pt' })
        });

        if (res.ok) {
            const data = await res.json();
            console.log("✅ Devotional Success!");
            console.log("Keys:", Object.keys(data));
            if (data.title) console.log("Title:", data.title);
        } else {
            console.log(`❌ Devotional Failed: ${res.status}`);
            const text = await res.text();
            console.log("FULL ERROR:", text);
        }
    } catch (e) {
        console.log("❌ Error:", e.message);
    }
}

testDevotional();
