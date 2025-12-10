const apiKey = "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";

async function checkModels() {
    try {
        console.log("Fetching OpenRouter models...");
        const response = await fetch("https://openrouter.ai/api/v1/models", {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
            }
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            return;
        }

        const data = await response.json();
        const models = data.data;

        console.log(`Found ${models.length} models.`);

        // Filter for google or image related
        const googleModels = models.filter(m => m.id.includes('google'));
        const imageModels = models.filter(m => m.id.includes('image') || m.id.includes('flux') || m.id.includes('diffusion'));

        console.log("\n--- Google Models ---");
        googleModels.forEach(m => console.log(m.id));

        console.log("\n--- Potential Image Models ---");
        imageModels.forEach(m => console.log(m.id));

    } catch (error) {
        console.error("Script Error:", error);
    }
}

checkModels();
