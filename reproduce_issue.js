
async function test() {
    try {
        const response = await fetch('http://localhost:3002/api/ai/blog-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "Test Title",
                context: "Category: Geral. Number of Images to Generate: 1. Image Format: landscape.",
                language: "pt"
            })
        });

        if (!response.ok) {
            console.log('Status:', response.status);
            const text = await response.text();
            console.log('Error Body:', text);
        } else {
            const data = await response.json();
            console.log('Success! Content length:', data.content.length);
        }
    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

test();
