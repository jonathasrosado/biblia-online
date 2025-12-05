import fetch from 'node-fetch';

const FREEPIK_KEY = 'FPSX938d6430ab7fd18096f8a840fb659cda';

async function testFreepikNoModel() {
    console.log('\n--- TESTING FREEPIK API (NO MODEL) ---');
    try {
        const response = await fetch('https://api.freepik.com/v1/ai/text-to-image', {
            method: 'POST',
            headers: {
                'x-freepik-api-key': FREEPIK_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                prompt: 'A cute cat'
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log('Body:', text.substring(0, 500));

    } catch (error) {
        console.error('Freepik Connection Error:', error.message);
    }
}

testFreepikNoModel();
