
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3005';

async function verifyAll() {
    console.log("=== FINAL SYSTEM CHECK (Port 3005) ===");
    let success = true;

    // 1. Check Devotional (Was crashing)
    try {
        process.stdout.write("1. Testing Devotional... ");
        const res = await fetch(`${BASE_URL}/api/ai/devotional`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: 'pt' })
        });
        if (res.ok) {
            const data = await res.json();
            if (data.text || data.title) console.log("✅ OK");
            else { console.log("❌ Invalid Format"); success = false; }
        } else {
            console.log(`❌ Failed (${res.status})`);
            success = false;
        }
    } catch (e) {
        console.log(`❌ Error: ${e.message}`);
        success = false;
    }

    // 2. Check Audio (Was 0 bytes or bad format)
    try {
        process.stdout.write("2. Testing Audio Gen... ");
        const res = await fetch(`${BASE_URL}/api/audio/edge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: "Teste de áudio final.", voice: "male" })
        });
        if (res.ok) {
            const data = await res.json();
            if (data.base64 && data.base64.length > 1000) {
                console.log("✅ OK");
            } else {
                console.log("❌ Audio too small/empty");
                success = false;
            }
        } else {
            console.log(`❌ Failed (${res.status})`);
            success = false;
        }
    } catch (e) {
        console.log(`❌ Error: ${e.message}`);
        success = false;
    }

    console.log("================================");
    if (success) console.log("✅ SYSTEM FULLY OPERATIONAL");
    else console.log("❌ ISSUES DETECTED");
}

verifyAll();
