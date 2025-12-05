
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3002';

async function checkEndpoint(name, url) {
    try {
        console.log(`Checking ${name} (${url})...`);
        const res = await fetch(`${BASE_URL}${url}`);
        if (res.ok) {
            console.log(`✅ ${name}: OK (${res.status})`);
            // Try to parse JSON to ensure it's not sending HTML error page
            try {
                const data = await res.json();
                console.log(`   Data sample: ${JSON.stringify(data).substring(0, 50)}...`);
            } catch (e) {
                console.log(`   ⚠️ Non-JSON response`);
            }
        } else {
            console.error(`❌ ${name}: Failed (${res.status} ${res.statusText})`);
            const text = await res.text();
            console.error(`   Body: ${text.substring(0, 200)}`);
        }
    } catch (e) {
        console.error(`❌ ${name}: Network Error (${e.message})`);
    }
}

async function run() {
    await checkEndpoint('Blog Posts', '/api/blog/posts');
    await checkEndpoint('AI Config', '/api/ai/config');
    await checkEndpoint('Media', '/api/media');
}

run();
