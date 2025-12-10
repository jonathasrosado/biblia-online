import { aiManager } from './server/services/aiManager.js';

async function test() {
    console.log("Testing Full Blog Post Generation with OpenRouter...");

    // 1. Config Check
    const config = aiManager.getConfig();
    console.log("Blog Provider:", config.features.blog_post.provider);
    console.log("Blog Model:", config.features.blog_post.model);
    console.log("Image Provider:", config.features.images.provider);
    console.log("Image Model:", config.features.images.model);

    // 2. Generate Post
    try {
        console.log("\nGenerating Post about 'A Paz de Deus'...");
        const post = await aiManager.generateContent(
            'blog_post',
            'Escreva um post inspirador sobre a Paz de Deus que excede todo o entendimento. Inclua [[IMAGE_PROMPT: Uma paisagem serena com luz divina]]',
            'Você é um assistente teológico.',
            null
        );

        console.log("\nSUCCESS! Post Generated.");
        console.log("Length:", post.length);
        console.log("Snippet:", post.substring(0, 200));

        // Check for image
        if (post.includes('<img')) {
            console.log("Image tag found: YES");
            // Extract src
            const match = post.match(/src="([^"]+)"/);
            if (match) console.log("Image URL:", match[1]);
        } else {
            console.log("Image tag found: NO (Check logs for generation error)");
        }

    } catch (e) {
        console.error("Generation Failed:", e.message);
        if (e.cause) console.error("Cause:", e.cause);
    }
}

test();
