const apiKey = "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";

async function testImage() {
    try {
        console.log("Testing OpenRouter Image Generation...");
        // OpenRouter doesn't officially document /images/generations yet, but let's try.
        // Or maybe via chat completions with specific request?

        const response = await fetch("https://openrouter.ai/api/v1/images/generations", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/imagen-3", // Trying a guess
                prompt: "A beautiful landscape"
            })
        });

        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log(`Body: ${text.substring(0, 500)}`);

    } catch (e) { console.error(e); }
}

testImage();
