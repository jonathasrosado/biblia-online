import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5173'; // Frontend URL

async function testAudioEndpoint() {
    console.log("🧪 Testing audio endpoint via frontend proxy...\n");

    try {
        const res = await fetch(`${BASE_URL}/api/audio/edge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: "No princípio, Deus criou os céus e a terra.",
                voice: "male"
            })
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        console.log(`Headers:`, res.headers.raw());

        if (res.ok) {
            const data = await res.json();
            console.log("\n✅ Response received");
            console.log("Keys in response:", Object.keys(data));

            if (data.base64) {
                console.log("Base64 length:", data.base64.length);
                console.log("First 100 chars:", data.base64.substring(0, 100));

                // Check if it's valid base64
                try {
                    const decoded = Buffer.from(data.base64, 'base64');
                    console.log("Decoded size:", decoded.length, "bytes");

                    // Check for MP3 signature (first 3 bytes should be ID3 or 0xFF 0xFB)
                    const header = decoded.slice(0, 3).toString('hex');
                    console.log("Audio header (hex):", header);

                    if (header.startsWith('494433') || header.startsWith('fffb')) {
                        console.log("✅ Valid MP3 detected!");
                    } else {
                        console.log("⚠️ Unexpected audio format");
                    }
                } catch (e) {
                    console.log("❌ Not valid base64:", e.message);
                }
            } else {
                console.log("❌ No base64 in response");
                console.log("Response data:", data);
            }
        } else {
            const text = await res.text();
            console.log("❌ Error response:", text);
        }
    } catch (e) {
        console.log("❌ Network error:", e.message);
    }
}

testAudioEndpoint();
