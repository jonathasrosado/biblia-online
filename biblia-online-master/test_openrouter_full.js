import { aiManager } from './server/services/aiManager.js';

async function test() {
    console.log("Testing OpenRouter Integration...");

    // 1. Check Config
    const config = aiManager.getConfig();
    console.log("API Key configured:", config.apiKeys.openrouter ? "YES" : "NO");
    if (config.apiKeys.openrouter) {
        console.log("Key starts with:", config.apiKeys.openrouter.substring(0, 10) + "...");
    }

    // 2. Check Models
    const models = await aiManager.getAvailableModels();
    if (models.openrouter) {
        console.log(`OpenRouter Models found: ${models.openrouter.length}`);
        models.openrouter.forEach(m => console.log(` - ${m.id} (${m.name})`));
    } else {
        console.error("No OpenRouter models found in getAvailableModels()");
    }

    // 3. Test Generation
    try {
        console.log("\nGenerating Title with OpenRouter (GPT-4o Mini)...");

        // Force configuration for test
        aiManager.config.features.blog_title.provider = 'openrouter';
        aiManager.config.features.blog_title.model = 'openai/gpt-4o-mini';

        const title = await aiManager.generateContent(
            'blog_title',
            'Write a title for a blog post about Faith.',
            'You are a helpful assistant.',
            null
        );
        console.log("SUCCESS! Generated Title:", title);
    } catch (e) {
        console.error("Generation Failed:", e.message);
        if (e.cause) console.error("Cause:", e.cause);
    }
}

test();
