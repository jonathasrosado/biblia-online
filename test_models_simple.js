// Simple test for each model
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const apiKey = 'AIzaSyANJ9tY2cBqyLOpxgpanvq5iJNytGXO4C0';
const ai = new GoogleGenAI({ apiKey });

const models = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
    'gemini-1.5-pro-002',
    'gemini-pro'
];

async function testModel(model) {
    try {
        const result = await ai.models.generateContent({
            model,
            contents: 'Say OK',
            config: {}
        });
        return { model, status: 'WORKS', response: result.text.substring(0, 30) };
    } catch (error) {
        return { model, status: 'FAILED', error: error.message.substring(0, 50) };
    }
}

async function testAll() {
    console.log('Testing Gemini models...\n');
    const results = [];

    for (const model of models) {
        const result = await testModel(model);
        results.push(result);
        if (result.status === 'WORKS') {
            console.log(`✅ ${result.model}`);
        } else {
            console.log(`❌ ${result.model} - ${result.error}`);
        }
    }

    fs.writeFileSync('model_test_results.json', JSON.stringify(results, null, 2));
    console.log('\nResults saved to model_test_results.json');
}

testAll();
