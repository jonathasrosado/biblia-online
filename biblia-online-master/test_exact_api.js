// Test with exact API from geminiService.ts
import { GoogleGenAI, Type } from '@google/genai';

const apiKey = 'AIzaSyBUNuJzGLlKBCHMRNcqLDXQVLfDKmqIcYk';

async function testCorrectAPI() {
    try {
        console.log('Testing with correct API from geminiService.ts...');

        const ai = new GoogleGenAI({ apiKey });

        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: 'Say hello in Portuguese',
            config: {
                responseMimeType: 'application/json'
            }
        });

        console.log('Success!');
        console.log('Result:', result);
        console.log('Result.text:', result.text);

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testCorrectAPI();
