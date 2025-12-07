
async function checkKey() {
    const key = "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";
    try {
        console.log("Testing key...");
        const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${key}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log("SUCCESS. Key is valid.");
            console.log("Data:", JSON.stringify(data, null, 2));
        } else {
            const text = await response.text();
            console.log(`FAILED. Status: ${response.status}`);
            console.log("Response:", text);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

checkKey();
