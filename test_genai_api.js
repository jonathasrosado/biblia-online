// Test @google/genai package
import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyBUNuJzGLlKBCHMRNcqLDXQVLfDKmqIcYk';

async function testGenAI() {
    try {
        console.log('Testing @google/genai package...');

        const ai = new GoogleGenAI({ apiKey });
        console.log('GoogleGenAI instance created:', typeof ai);
        console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(ai)));

        // Try different approaches
        if (ai.models) {
            console.log('Has models property');
            const result = await ai.models.generateContent({
                model: 'gemini-2.0-flash-exp',
                prompt: 'Say hello in Portuguese'
            });
            console.log('Response:', result);
        } else if (ai.generateContent) {
            console.log('Has generateContent method');
            const result = await ai.generateContent({
                model: 'gemini-2.0-flash-exp',
                prompt: 'Say hello in Portuguese'
            });
            console.log('Response:', result);
        }

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testGenAI();
