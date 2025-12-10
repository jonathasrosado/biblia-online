const fetch = require('node-fetch');

async function testTitleGeneration() {
    try {
        console.log('Testing Title Generation...');

        const response = await fetch('http://localhost:3001/api/ai/blog-title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                keyword: 'Homem mais rico do mundo',
                language: 'pt'
            })
        });

        console.log('Response Status:', response.status);
        console.log('Response Headers:', response.headers.raw());

        const text = await response.text();
        console.log('Raw Response:', text);

        if (!response.ok) {
            console.error('HTTP Error:', response.status);
            return;
        }

        const data = JSON.parse(text);
        console.log('Parsed Response:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Test Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testTitleGeneration();
