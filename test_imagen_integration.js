import { aiManager } from './server/services/aiManager.js';

async function test() {
    try {
        console.log('Testing Google Imagen generation...');

        // Force provider google temporarily for this test instance
        aiManager.config.features.images = { provider: 'google', model: 'imagen-3.0-generate-001' };

        // Check if key is present
        if (!aiManager.config.apiKeys.gemini) {
            console.error('SKIPPING: No Gemini API Key found in config.');
            return;
        }

        const result = await aiManager.generateImage('A beautiful landscape of Jerusalem at sunset, photorealistic, 8k');

        console.log('Result received.');
        if (result.startsWith('data:image/png;base64,')) {
            console.log('SUCCESS: Generated Base64 Image');
            console.log('Length:', result.length);
        } else if (result.startsWith('https://image.pollinations.ai')) {
            console.log('FALLBACK: Fell back to Pollinations (Check logs for error)');
        } else {
            console.log('FAIL: Unexpected format:', result.substring(0, 50));
        }
    } catch (e) {
        console.error('ERROR:', e);
    }
}

test();
