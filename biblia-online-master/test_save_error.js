// Test and save error to file
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';

const apiKey = 'AIzaSyBUNuJzGLlKBCHMRNcqLDXQVLfDKmqIcYk';

async function testAndSaveError() {
    try {
        console.log('Testing Gemini API...');

        const ai = new GoogleGenAI({ apiKey });

        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: 'Say hello in Portuguese',
            config: {
                responseMimeType: 'application/json'
            }
        });

        console.log('Success!');
        console.log('Result:', JSON.stringify(result, null, 2));
        fs.writeFileSync('gemini_success.txt', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Error occurred');
        const errorDetails = {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: error.code,
            fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
        };
        console.error(JSON.stringify(errorDetails, null, 2));
        fs.writeFileSync('gemini_error.txt', JSON.stringify(errorDetails, null, 2));
    }
}

testAndSaveError();
