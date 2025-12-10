async function testBlogTitle() {
    try {
        const response = await fetch('http://localhost:3001/api/ai/blog-title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword: 'Fé', language: 'pt' })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Blog Title Success:', data);
        } else {
            console.error('Blog Title Failed:', response.status, await response.text());
        }
    } catch (e) {
        console.error('Blog Title Error:', e);
    }
}

testBlogTitle();
