const BASE_URL = 'https://easygoing-achievement-production.up.railway.app';

async function testSearch() {
    console.log("Testing SEARCH ONLY...");
    try {
        const res = await fetch(`${BASE_URL}/api/ai/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'Faith', language: 'en' })
        });

        if (res.ok) {
            const data = await res.json();
            console.log("✅ Search Success!");
            console.log("Keys:", Object.keys(data));
            if (data.verses) console.log("Verse Count:", data.verses.length);
        } else {
            console.log(`❌ Search Failed: ${res.status}`);
            const text = await res.text();
            try {
                const json = JSON.parse(text);
                const errStr = json.error;
                console.log("ERR START:", errStr.substring(0, 50));
                console.log("ERR MIDDLE:", errStr.substring(50, 150));
                console.log("ERR END:", errStr.substring(errStr.length - 50));
            } catch (e) {
                console.log("RAW ERROR:", text);
            }
        }
    } catch (e) {
        console.log("❌ Error:", e.message);
    }
}

testSearch();
