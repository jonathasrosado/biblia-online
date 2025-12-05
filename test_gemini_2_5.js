
import { aiManager } from './server/services/aiManager.js';

async function testModel(modelId) {
    console.log(`Testing model: ${modelId}...`);
    try {
        // Temporarily override config for this test
        aiManager.config.features.chat = { provider: 'gemini', model: modelId };

        const response = await aiManager.generateContent('chat', 'Hello, are you working?', 'Reply with "Yes, I am working."');
        console.log(`SUCCESS: ${modelId} responded: ${response.substring(0, 50)}...`);
        return true;
    } catch (error) {
        console.error(`FAILURE: ${modelId} failed.`);
        if (error.message.includes('404')) {
            console.error('Error: Model not found (404)');
        } else {
            console.error('Error:', error.message);
        }
        return false;
    }
}

async function runTests() {
    console.log('--- Starting Model Verification ---');

    await testModel('gemini-2.5-flash');
    await testModel('gemini-2.5-pro');
    await testModel('gemini-2.0-flash'); // Verify the one we know works
    await testModel('gemini-1.5-flash'); // Verify the one user just set

    console.log('--- Verification Complete ---');
}

runTests();
