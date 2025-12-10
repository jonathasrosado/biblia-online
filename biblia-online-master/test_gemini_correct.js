// Test with correct import
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = 'AIzaSyBUNuJzGLlKBCHMRNcqLDXQVLfDKmqIcYk';

async function testGemini() {
    try {
        console.log('Testing Gemini API with correct import...');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: 'Say hello in Portuguese' }] }]
        });

        console.log('Success! Response:', result.response.text());

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        if (error.response) {
            console.error('Response error:', JSON.stringify(error.response, null, 2));
        }
    }
}

testGemini();
