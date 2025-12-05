import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001/api/blog/posts';

async function testSaveDraft() {
    console.log('--- TESTING SAVE DRAFT ---');
    const slug = `draft-test-${Date.now()}`;

    try {
        console.log(`Attempting to save draft: ${slug}`);
        const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                slug: slug,
                title: 'Draft Test',
                content: '<p>Draft Content</p>',
                status: 'draft',
                date: new Date().toISOString()
            })
        });

        if (!res.ok) {
            const err = await res.text();
            console.error(`Failed: ${res.status} - ${err}`);
        } else {
            console.log('Success! Draft saved.');
            // Cleanup
            await fetch(`${BASE_URL}/${slug}`, { method: 'DELETE' });
        }
    } catch (e) {
        console.error('Network/Server Error:', e.message);
    }
}

testSaveDraft();
