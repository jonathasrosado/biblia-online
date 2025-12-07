
import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'http://localhost:3004';

async function testAudioQuality() {
    console.log("Testing Audio Quality (Port 3004)...");
    const text = "O Senhor é o meu pastor; nada me faltará. Deitar-me faz em verdes pastos, guia-me mansamente a águas tranquilas.";

    try {
        const start = Date.now();
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
                fs.writeFileSync('test_audio_192kbps.mp3', buffer);

                // 96kbps for this text is roughly X bytes. 192kbps should be roughly 2X.
                // A short sentence: ~5 seconds.
                // 96kbps = 12KB/s -> ~60KB
                // 192kbps = 24KB/s -> ~120KB

                if (buffer.length > 80000) {
                    console.log("✅ High Quality Detected ( > 80KB for short sentence)");
                } else {
                    console.log("⚠️ Size seems small, check if 192kbps is applied.");
                }
            }
        } else {
            console.log("❌ Failed to get audio");
            console.log(await res.text());
        }
    } catch (e) {
        console.log("❌ Error:", e.message);
    }
}

testAudioQuality();
