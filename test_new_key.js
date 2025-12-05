// Test new API key
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const apiKey = 'AIzaSyANJ9tY2cBqyLOpxgpanvq5iJNytGXO4C0';

async function testNewKey() {
    try {
        console.log('Testing new API key...');

        const ai = new GoogleGenAI({ apiKey });

        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: 'Say hello in Portuguese',
            config: {
                responseMimeType: 'application/json'
            }
        });

        console.log('✅ Success!');
        console.log('Result:', JSON.stringify(result, null, 2));
        fs.writeFileSync('new_key_success.txt', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
        const errorDetails = {
            message: error.message,
            stack: error.stack,
            name: error.name
        };
        fs.writeFileSync('new_key_error.txt', JSON.stringify(errorDetails, null, 2));
    }
}

testNewKey();
