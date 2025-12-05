// Test Google Imagen availability
import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyANJ9tY2cBqyLOpxgpanvq5iJNytGXO4C0';
const ai = new GoogleGenAI({ apiKey });

const models = [
    'imagen-3.0-generate-001',
    'imagen-2',
    'gemini-pro-vision' // Just to check
];

async function testImagen() {
    console.log('Testing Google Imagen models...\n');

    for (const model of models) {
        try {
            // Imagen uses a different method usually, but let's try standard generateContent first
            // or check if it's listed in models
            console.log(`Testing ${model}...`);
            const result = await ai.models.generateContent({
                model,
                contents: 'Generate an image of a biblical landscape',
                config: {}
            });
            console.log(`✅ ${model}: WORKS`);
        } catch (error) {
            console.log(`❌ ${model}: ${error.message.substring(0, 100)}`);
        }
    }
}

testImagen();
