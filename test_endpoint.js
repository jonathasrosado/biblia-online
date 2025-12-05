
(async () => {
    try {
        console.log("Testing endpoint...");
        const response = await fetch('http://localhost:3002/api/audio/edge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: "Teste 123", voice: "male" })
        });

        if (!response.ok) {
            console.error("Status:", response.status);
            console.error("Text:", await response.text());
            return;
        }

        const data = await response.json();
        console.log("Success:", data.success);
        console.log("URL:", data.url);
        console.log("Base64 Length:", data.base64 ? data.base64.length : 0);

    } catch (e) {
        console.error("Error:", e);
    }
})();
