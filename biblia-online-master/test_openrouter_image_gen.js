import { aiManager } from './server/services/aiManager.js';

async function test() {
    console.log("Testing OpenRouter Image Generation...");

    // 1. Check Config
    const config = aiManager.getConfig();
    console.log("API Key configured:", config.apiKeys.openrouter ? "YES" : "NO");

    // 2. Test Generation
    try {
        console.log("\nGenerating Image with OpenRouter (Flux Dev)...");

        // Force configuration for test
        aiManager.config.features.images.provider = 'openrouter';
        aiManager.config.features.images.model = 'black-forest-labs/flux-1-dev';

        const imageUrl = await aiManager.generateImage(
            'A beautiful landscape of a futuristic city with golden towers, cinematic lighting, 8k resolution',
            { width: 1024, height: 1024 }
        );
        console.log("SUCCESS! Generated Image URL:", imageUrl);
    } catch (e) {
        console.error("Generation Failed:", e.message);
        if (e.cause) console.error("Cause:", e.cause);
    }
}

test();
