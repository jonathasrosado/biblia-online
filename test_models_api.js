// Test models.generateContent
import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyBUNuJzGLlKBCHMRNcqLDXQVLfDKmqIcYk';

async function testModelsAPI() {
    try {
        console.log('Testing models.generateContent...');

        const ai = new GoogleGenAI({ apiKey });

        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [{
                role: 'user',
                parts: [{ text: 'Say hello in Portuguese' }]
            }]
        });

        console.log('Success!');
        console.log('Result type:', typeof result);
        console.log('Result keys:', Object.keys(result));
        console.log('Full result:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testModelsAPI();
