import fetch from 'node-fetch';

async function testSeoGen() {
    console.log("Testing SEO Generation...");
    try {
        const response = await fetch('http://localhost:3001/api/ai/seo-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: "This is a blog post about the creation of the world in Genesis 1. God created the heavens and the earth.",
                keyword: "Creation",
                language: "pt"
            })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP Error: ${response.status} - ${text}`);
        }

        const data = await response.json();
        console.log("Success! SEO Data:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Failed:", error.message);
    }
}

testSeoGen();
