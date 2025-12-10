
// Native fetch is available in Node 18+

const BASE_URL = 'http://localhost:3002';

async function testEndpoint(name, url, body) {
    console.log(`\n--- Testing ${name} ---`);
    try {
        const response = await fetch(`${BASE_URL}${url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Success!");
            console.log("Response Preview:", JSON.stringify(data).substring(0, 100) + "...");
            return true;
        } else {
            console.error(`❌ Failed: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error("Error Body:", text);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        return false;
    }
}

async function runTests() {
    // 1. Test Model Endpoint (AISettings)
    await testEndpoint('Test Model (Text)', '/api/ai/test-model', {
        provider: 'gemini',
        model: 'gemini-2.0-flash-exp',
        type: 'text'
    });

    // 2. Test Chat Endpoint (ChatBot)
    await testEndpoint('Chat API', '/api/ai/chat', {
        message: 'Hello, who are you?',
        history: [],
        language: 'en'
    });

    // 3. Test Blog Post Endpoint (Blog Editor)
    // Using a very simple prompt to save tokens/time
    await testEndpoint('Blog Post API', '/api/ai/blog-post', {
        title: 'Test Post',
        context: 'Short test',
        language: 'en'
    });
}

runTests();
