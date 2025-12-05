import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001/api/blog/posts';

async function testBlogApi() {
    console.log('--- TESTING BLOG API ---');
    const slug = `test-post-${Date.now()}`;

    // 1. Create Post
    console.log(`\n1. Creating post: ${slug}`);
    try {
        const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                slug: slug,
                title: 'Test Post',
                content: '<p>Content</p>',
                status: 'draft',
                date: new Date().toISOString()
            })
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Create failed: ${res.status} - ${err}`);
        }
        console.log('Create SUCCESS');
    } catch (e) {
        console.error(e.message);
        return;
    }

    // 2. Update Post (Publish)
    console.log(`\n2. Updating post (Publishing): ${slug}`);
    try {
        const res = await fetch(`${BASE_URL}/${slug}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                slug: slug, // Keep same slug
                title: 'Test Post Updated',
                content: '<p>Content Updated</p>',
                status: 'published',
                date: new Date().toISOString()
            })
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Update failed: ${res.status} - ${err}`);
        }
        console.log('Update SUCCESS');
    } catch (e) {
        console.error(e.message);
    }

    // 3. Delete Post (Cleanup)
    console.log(`\n3. Deleting post: ${slug}`);
    try {
        const res = await fetch(`${BASE_URL}/${slug}`, {
            method: 'DELETE'
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Delete failed: ${res.status} - ${err}`);
        }
        console.log('Delete SUCCESS');
    } catch (e) {
        console.error(e.message);
    }
}

testBlogApi();
