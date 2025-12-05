import { aiManager } from './server/services/aiManager.js';

async function test() {
    console.log("=== Freepik Verification ===");
    const config = aiManager.getConfig();
    const apiKey = config.apiKeys.freepik;

    if (!apiKey) {
        console.error("No Freepik API Key found!");
        return;
    }

    console.log("Testing Freepik Image Generation...");
    try {
        // Force Freepik provider for this test
        // We can't easily force it via generateImage arguments without modifying the method signature or config temporarily.
        // But generateImage checks config.features.images.provider.
        // So let's temporarily modify the in-memory config.

        const originalProvider = config.features.images.provider;
        config.features.images.provider = 'freepik';

        const url = await aiManager.generateImage('A futuristic city with flying cars');
        console.log("Freepik Success:", url.substring(0, 50) + "...");

        // Restore
        config.features.images.provider = originalProvider;

    } catch (e) {
        console.error("Freepik Failed:", e.message);
    }
}

test();
