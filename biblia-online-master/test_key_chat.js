async function testChat() {
    const key = "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";
    console.log("Testing Chat with Key:", key.substring(0, 10) + "...");

    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://biblia-online-inteligente.com",
                "X-Title": "Biblia Online Inteligente"
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-exp:free",
                messages: [{ role: "user", content: "Hi" }]
            })
        });

        if (res.ok) {
            const data = await res.json();
            console.log("✅ Chat Success!");
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log(`❌ Chat Failed: ${res.status}`);
            console.log(await res.text());
        }
    } catch (e) {
        console.log("❌ Error:", e.message);
    }
}

testChat();
