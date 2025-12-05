// Simple test to verify Gemini API is working
import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyBUNuJzGLlKBCHMRNcqLDXQVLfDKmqIcYk';

async function testGemini() {
    try {
        console.log('Testing Gemini API...');

        const ai = new GoogleGenAI({ apiKey });
        const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: 'Say hello in Portuguese' }] }]
        });

        console.log('Success! Response:', result.response.text());

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
}

testGemini();
