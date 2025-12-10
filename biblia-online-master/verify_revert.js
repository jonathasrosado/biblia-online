
import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'http://localhost:3005';

async function testAudioRevert() {
    console.log("Testing Audio Revert (Port 3005)...");
    const text = "O Senhor é o meu pastor; nada me faltará.";

    try {
        const res = await fetch(`${BASE_URL}/api/audio/edge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice: 'male' })
        });

        console.log(`Response Status: ${res.status}`);

        if (res.ok) {
            const data = await res.json();
            if (data.base64) {
                const buffer = Buffer.from(data.base64, 'base64');
                console.log(`Received Audio Size: ${buffer.length} bytes`);
                if (buffer.length > 500) {
                    console.log("✅ Audio Generation Working (Standard Quality)");
                } else {
                    console.log("❌ Audio too small");
                }
            } else {
                console.log("❌ schema mismatch", data);
            }
        } else {
            console.log("❌ Failed:", await res.text());
        }
    } catch (e) {
        console.log("❌ Error:", e.message);
    }
}

testAudioRevert();
