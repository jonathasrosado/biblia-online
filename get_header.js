import fetch from 'node-fetch';
import fs from 'fs';

(async () => {
    try {
        const response = await fetch('http://localhost:3002/api/audio/edge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: "Teste 123", voice: "male" })
        });

        const data = await response.json();
        if (data.base64) {
            const buf = Buffer.from(data.base64, 'base64');
            const hex = buf.subarray(0, 16).toString('hex');
            fs.writeFileSync('header_hex.txt', hex);
        }
    } catch (e) {
        fs.writeFileSync('header_hex.txt', e.message);
    }
})();
