
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3002/api/blog/posts';

async function testLongSlug() {
    const longSlug = 'a'.repeat(200);
    const postData = {
        title: "Long Slug Post",
        content: "Content",
        status: "draft",
        date: new Date().toISOString(),
        category: "1",
        slug: longSlug
    };

    console.log("Testing Long Slug...");
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
        });
        if (res.ok) {
            console.log("Long slug success");
            // Clean up
            await fetch(`${API_URL}/${longSlug}`, { method: 'DELETE' });
        } else {
            const err = await res.json();
            console.error("Long slug failed:", err);
        }
    } catch (e) {
        console.error("Long slug exception:", e);
    }
}

async function testRename() {
    const slug1 = `test-rename-1-${Date.now()}`;
    const slug2 = `test-rename-2-${Date.now()}`;

    console.log("Testing Rename...");
    try {
        // Create
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: "Test Rename", slug: slug1, content: "Content" })
        });

        // Rename
        const res = await fetch(`${API_URL}/${slug1}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: "Test Rename Updated", slug: slug2, content: "Content Updated" })
        });

        if (res.ok) {
            console.log("Rename success");
            // Clean up
            await fetch(`${API_URL}/${slug2}`, { method: 'DELETE' });
        } else {
            const err = await res.json();
            console.error("Rename failed:", err);
        }
    } catch (e) {
        console.error("Rename exception:", e);
    }
}

async function run() {
    await testLongSlug();
    await testRename();
}

run();
