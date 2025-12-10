
import fetch from 'node-fetch';

async function testSeo() {
    try {
        const response = await fetch('http://localhost:3002/api/ai/seo-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: "Este é um post de teste sobre a Bíblia e a fé.",
                keyword: "fé",
                language: "pt"
            })
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(text);
        } else {
            const data = await response.json();
            console.log("Success:", data);
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testSeo();
