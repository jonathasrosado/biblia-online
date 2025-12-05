
import { aiManager } from './server/services/aiManager.js';

async function testTitleGen() {
    console.log('Testing Title Generation...');
    try {
        const keyword = 'Fé em Deus';
        const systemInstruction = `
            Generate 5 catchy, SEO-friendly titles for a blog post about the given keyword.
            Language: pt.
            Return ONLY a JSON array of objects.
        `;

        console.log('Calling generateContent...');
        const response = await aiManager.generateContent('blog_title', keyword, systemInstruction, 'json_object');
        console.log('Response received:', response);

    } catch (error) {
        console.error('Test Failed:', error);
        if (error.response) {
            console.error('API Error Details:', JSON.stringify(error.response, null, 2));
        }
    }
}

testTitleGen();
