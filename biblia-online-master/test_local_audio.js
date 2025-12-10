import fetch from 'node-fetch';
import fs from 'fs';

(async () => {
    try {
        console.log("Testing LOCALHOST:3002...");
        const response = await fetch('http://localhost:3002/api/audio/edge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: "Teste 123", voice: "male" })
        });

        console.log("Status:", response.status);
        const data = await response.json();

        if (data.base64) {
            console.log("Base64 Len:", data.base64.length);
            const buf = Buffer.from(data.base64, 'base64');
            const file = 'test_out.mp3';
            fs.writeFileSync(file, buf);
            console.log("Saved to", file);
            console.log("Header Hex:", buf.subarray(0, 10).toString('hex'));
        } else {
            console.log("No base64:", data);
        }

    } catch (e) {
        console.error(e);
    }
})();
