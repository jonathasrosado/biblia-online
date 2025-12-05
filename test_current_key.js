// Test current API key
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const apiKey = 'AIzaSyANJ9tY2cBqyLOpxgpanvq5iJNytGXO4C0';

async function testCurrentKey() {
    try {
        console.log('Testing current API key...');

        const ai = new GoogleGenAI({ apiKey });

        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: 'Say hello in Portuguese',
            config: {}
        });

        console.log('✅ API Key is VALID');
        console.log('Response:', result.text);

    } catch (error) {
        console.error('❌ API Key FAILED');
        console.error('Error:', error.message);
        const errorDetails = {
            message: error.message,
            name: error.name,
            status: error.status
        };
        console.error(JSON.stringify(errorDetails, null, 2));
        fs.writeFileSync('api_key_test_error.txt', JSON.stringify(errorDetails, null, 2));
    }
}

testCurrentKey();
