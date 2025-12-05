import { aiManager } from './server/services/aiManager.js';

async function test() {
    console.log("=== Testing All Gemini Models ===");

    // Get models directly from the manager to ensure we test what's listed
    const models = (await aiManager.getAvailableModels()).gemini;

    console.log(`Found ${models.length} models to test.\n`);

    for (const model of models) {
        process.stdout.write(`Testing ${model.id} (${model.name})... `);
        try {
            // Temporarily override config to test specific model
            // We can't easily override internal config without a setter or modifying the file.
            // But generateContent takes a feature. We can just call the GoogleGenAI directly or 
            // use a temporary feature config if we could.
            // Actually, aiManager.generateContent uses:
            // const featureConfig = this.config.features[feature];
            // const model = featureConfig?.model || 'gemini-2.0-flash-exp';

            // Wait, generateContent doesn't let me pass the model directly as an argument.
            // I should probably expose a direct generation method or modify the config in memory.

            // Let's modify the in-memory config for 'chat' feature for this test.
            const config = aiManager.getConfig();
            const originalModel = config.features.chat.model;

            config.features.chat.model = model.id;

            const response = await aiManager.generateContent('chat', 'Say "OK"');

            if (response && response.includes('OK')) {
                console.log("✅ SUCCESS");
            } else {
                console.log("⚠️  Response received but unexpected: " + response.substring(0, 20));
            }

            // Restore
            config.features.chat.model = originalModel;

        } catch (e) {
            console.log("❌ FAILED");
            console.log(`   Error: ${e.message.split('\n')[0]}`); // Print first line of error
        }
    }
}

test();
