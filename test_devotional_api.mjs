
import fetch from 'node-fetch';

async function testDevotional() {
    try {
        console.log('Testing /api/ai/devotional...');
        const response = await fetch('http://localhost:3002/api/ai/devotional', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: 'pt' })
        });

        if (!response.ok) {
            console.error('API Error:', response.status);
            const text = await response.text();
            console.error('Body:', text);
            return;
        }

        const data = await response.json();
        console.log('Response status:', response.status);
        console.log('Raw Data received:', JSON.stringify(data, null, 2));

        if (data.text) {
            let jsonString = data.text;
            // Clean up markdown code blocks if present
            jsonString = jsonString.replace(/```json\n?|\n?```/g, '').replace(/```/g, '').trim();
            console.log('Cleaned JSON String:', jsonString);
            try {
                const parsed = JSON.parse(jsonString);
                console.log('Parsed successfully:', parsed.title);
            } catch (e) {
                console.error('JSON Parse Error:', e.message);
            }
        }

    } catch (e) {
        console.error('Fetch Error:', e);
    }
}

testDevotional();
