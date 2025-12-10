import fetch from 'node-fetch';

(async () => {
    try {
        const response = await fetch('https://biblia-online.up.railway.app/api/audio/edge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: "A", voice: "male" })
        });

        if (!response.ok) {
            console.log("STATUS:", response.status);
            return;
        }

        const data = await response.json();
        if (data.base64) {
            const buf = Buffer.from(data.base64, 'base64');
            console.log("HEX:", buf.subarray(0, 16).toString('hex'));
        } else {
            console.log("NO_BASE64");
        }
    } catch (e) {
        console.log("ERR:", e.message);
    }
})();
