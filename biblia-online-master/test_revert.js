import { aiManager } from './server/services/aiManager.js';

async function test() {
    console.log("=== Revert Verification ===");
    const config = aiManager.getConfig();

    console.log("Blog Provider:", config.features.blog_post.provider);
    console.log("Image Provider:", config.features.images.provider);

    if (config.features.blog_post.provider !== 'gemini') console.error("ERROR: Blog provider should be gemini");
    if (config.features.images.provider !== 'pollinations') console.error("ERROR: Image provider should be pollinations");

    // 1. Test Text (Gemini)
    console.log("\n1. Testing Text Generation (Gemini)...");
    try {
        const text = await aiManager.generateContent('blog_post', 'Write a short sentence about peace.');
        console.log("Text Success:", text);
    } catch (e) {
        console.error("Text Failed:", e.message);
    }

    // 2. Test Image (Pollinations)
    console.log("\n2. Testing Image Generation (Pollinations)...");
    try {
        const url = await aiManager.generateImage('A peaceful landscape');
        console.log("Image Success:", url);
    } catch (e) {
        console.error("Image Failed:", e.message);
    }
}

test();
