
import fetch from 'node-fetch';

async function validateKey() {
    try {
        const response = await fetch('http://localhost:3002/api/ai/validate-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey: "AIzaSyANJ9tY2cBqyLOpxgpanvq5iJNytGXO4C0"
            })
        });

        const data = await response.json();
        console.log("Validation Result:", data);
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

validateKey();
