async function testSEO() {
    try {
        const response = await fetch('http://localhost:3001/api/ai/seo-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: 'This is a blog post about the love of God.',
                keyword: 'Amor de Deus',
                language: 'pt'
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('SEO Success:', data);
        } else {
            console.error('SEO Failed:', response.status, await response.text());
        }
    } catch (e) {
        console.error('SEO Error:', e);
    }
}

testSEO();
