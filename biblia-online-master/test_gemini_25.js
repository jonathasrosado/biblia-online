// Test Gemini 2.5 models
import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyANJ9tY2cBqyLOpxgpanvq5iJNytGXO4C0';
const ai = new GoogleGenAI({ apiKey });

const models25 = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-exp',
    'gemini-2.5-pro',
    'gemini-2.5-pro-exp'
];

async function testGemini25() {
    console.log('Testing Gemini 2.5 models...\n');

    for (const model of models25) {
        try {
            const result = await ai.models.generateContent({
                model,
                contents: 'Say OK',
                config: {}
            });
            console.log(`✅ ${model}: WORKS`);
        } catch (error) {
            console.log(`❌ ${model}: ${error.message.substring(0, 60)}`);
        }
    }
}

testGemini25();
