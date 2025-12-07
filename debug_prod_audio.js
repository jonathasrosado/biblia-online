import fetch from 'node-fetch';

(async () => {
    try {
        console.log("Fetching from PROD...");
        const response = await fetch('https://biblia-online.up.railway.app/api/audio/edge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: "Teste de audio 123", voice: "male" })
        });

        console.log("Status:", response.status);
        if (!response.ok) {
            console.log("Error Text:", await response.text());
            return;
        }

        const data = await response.json();
        if (data.base64) {
            console.log("Base64 Length:", data.base64.length);
            console.log("First 50 chars:", data.base64.substring(0, 50));

            const buf = Buffer.from(data.base64, 'base64');
            console.log("Hex Header:", buf.subarray(0, 10).toString('hex'));
        } else {
            console.log("No base64 in response:", Object.keys(data));
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
})();
