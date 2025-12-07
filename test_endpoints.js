
const http = require('http');

function test(path, method, body) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3002,
            path: path,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`[${method} ${path}] Status: ${res.statusCode}`);
                if (res.statusCode >= 400) {
                    console.log(`[ERROR BODY]: ${data.substring(0, 500)}`);
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`[${method} ${path}] Connection Error: ${e.message}`);
            resolve();
        });

        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    console.log("--- TESTING API ENDPOINTS ---");
    // Test 1: Devotional
    await test('/api/ai/devotional', 'POST', { language: 'pt' });

    // Test 2: Audio (EdgeTTS)
    await test('/api/audio/edge', 'POST', { text: 'Oi, teste de áudio.', voice: 'female' });

    // Test 3: Debug Log
    await test('/api/debug/log', 'GET');
}

run();
