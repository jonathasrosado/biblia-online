// Test all Gemini models
import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyANJ9tY2cBqyLOpxgpanvq5iJNytGXO4C0';

const models = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
    'gemini-1.5-pro-002',
    'gemini-pro'
];

async function testAllModels() {
    const ai = new GoogleGenAI({ apiKey });

    console.log('Testing all Gemini models...\n');

    for (const model of models) {
        try {
            console.log(`Testing ${model}...`);
            const result = await ai.models.generateContent({
                model,
                contents: 'Say "OK" in one word',
                config: {}
            });
            console.log(`✅ ${model}: WORKS - Response: ${result.text.substring(0, 50)}`);
        } catch (error) {
            console.log(`❌ ${model}: FAILED - ${error.message}`);
        }
        console.log('');
    }
}

testAllModels();
