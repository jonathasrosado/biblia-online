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
