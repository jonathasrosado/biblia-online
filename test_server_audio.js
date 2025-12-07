
const axios = require('axios');
const fs = require('fs');

async function testAudio() {
    try {
        console.log("Testing Server TTS (MP3)...");
        const response = await axios.post('http://localhost:3002/api/tts', {
            text: "O Senhor é o meu pastor e nada me faltará.",
            voice: "male"
        });

        if (response.data.success && response.data.base64) {
            console.log("Success! Received base64 audio.");
            const buffer = Buffer.from(response.data.base64, 'base64');
            fs.writeFileSync('test_output.mp3', buffer);
            console.log("Saved to test_output.mp3. Check if this file plays correctly.");
        } else {
            console.error("Failed:", response.data);
        }
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) console.error("Response:", e.response.data);
    }
}

testAudio();
