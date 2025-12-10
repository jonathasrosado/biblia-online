
import fetch from 'node-fetch';

async function testSavePost() {
    try {
        const postData = {
            title: "Test Post " + Date.now(),
            content: "<p>This is a test post content.</p>",
            status: "draft",
            date: new Date().toISOString(),
            category: "1", // Assuming category ID 1 exists
            slug: "test-post-" + Date.now()
        };

        console.log("Attempting to save post:", postData.slug);

        const response = await fetch('http://localhost:3002/api/blog/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Response body:", text);
        } else {
            const data = await response.json();
            console.log("Success:", data);
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testSavePost();
