
async function test() {
    console.log("Testing Local Server (Gemma-3-27b-it)...");
    try {
        const res = await fetch('http://localhost:3002/api/ai/devotional', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: 'pt' })
        });
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Body: ${text.substring(0, 300)}...`);

        if (res.status === 200) console.log("✅ VERIFIED!");
        else console.log("❌ FAILED");
    } catch (e) {
        console.log(`Connection Error: ${e.message}`);
    }
}
test();
