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
