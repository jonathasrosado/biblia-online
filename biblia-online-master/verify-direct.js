
async function testDirect() {
    try {
        console.log("Testing direct server endpoint...");
        const response = await fetch('http://localhost:3002/api/ai/test-model', {
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

testDirect();
