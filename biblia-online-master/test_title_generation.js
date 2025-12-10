import fetch from 'node-fetch';

const API_URL = 'http://localhost:3002/api/ai/blog-title';

async function testTitleGeneration() {
    console.log("Testing Title Generation API...");
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword: 'Fé', language: 'pt' })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Full Response Data:", JSON.stringify(data, null, 2));

            if (data.titles && Array.isArray(data.titles)) {
                console.log(`Validation Passed: Found ${data.titles.length} titles.`);
            } else {
                console.error("Validation Failed: 'titles' array missing. Received structure:", Object.keys(data));
            }
        } else {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Response body:", text);
        }
    } catch (error) {
        console.error("Request failed:", error);
    }
}

testTitleGeneration();
