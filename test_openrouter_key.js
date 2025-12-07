async function testKey() {
    const key = "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";
    console.log("Testing Key:", key.substring(0, 10) + "...");

    try {
        const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${key}`
            }
        });

        if (res.ok) {
            const data = await res.json();
            console.log("✅ Key is VALID!");
            console.log("Data:", data);
        } else {
            console.log(`❌ Key Check Failed: ${res.status}`);
            console.log(await res.text());
        }
    } catch (e) {
        console.log("❌ Error:", e.message);
    }
}

testKey();
