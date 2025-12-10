import fetch from 'node-fetch';
import fs from 'fs';

async function testImageGen() {
    console.log("Testing Image Generation...");
    try {
        const response = await fetch('http://localhost:3001/api/ai/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: "A beautiful landscape of the Garden of Eden, realistic, 8k",
                width: 1024,
                height: 1024
            })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP Error: ${response.status} - ${text}`);
        }

        const data = await response.json();
        console.log("Success! Image URL:", data.url);
    } catch (error) {
        console.error("Failed:", error.message);
        fs.writeFileSync('error_output.txt', error.message);
    }
}

testImageGen();
