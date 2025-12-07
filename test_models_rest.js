
const API_KEY = "AIzaSyB20fNNC98BOelkCYsBmYiFc-1pRi2NZPU";

const candidates = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-1.5-pro",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-flash-latest", // From models.json
    "gemini-pro"
];

async function testModels() {
    console.log("🔍 Testing Gemini Models via REST API...");
    const working = [];

    for (const model of candidates) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
        const body = {
            contents: [{ parts: [{ text: "Hello" }] }]
        };

        try {
            process.stdout.write(`Testing ${model.padEnd(25)}: `);
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                console.log(`✅ OK (${res.status})`);
                working.push(model);
            } else {
                const err = await res.json();
                console.log(`❌ ${res.status} - ${err.error?.message || res.statusText}`);
            }
        } catch (e) {
            console.log(`❌ ERROR: ${e.message}`);
        }
    }

    console.log("\n--- SUMMARY ---");
    if (working.length > 0) {
        console.log("🏆 WORKING MODELS: " + working.join(", "));
    } else {
        console.log("💀 ALL MODELS FAILED.");
    }
}

testModels();
