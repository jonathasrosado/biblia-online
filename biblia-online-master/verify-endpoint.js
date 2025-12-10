
async function testEndpoint() {
    try {
        console.log("Testing /api/ai/test-model endpoint...");
        const response = await fetch('http://localhost:5173/api/ai/test-model', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: 'openrouter',
                model: 'deepseek/deepseek-chat',
                type: 'text'
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("SUCCESS:", JSON.stringify(data, null, 2));
        } else {
            const text = await response.text();
            console.log("FAILED:", response.status, text);
        }
    } catch (error) {
        console.error("ERROR:", error.message);
    }
}

testEndpoint();
