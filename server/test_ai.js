const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/ai/config',
    method: 'GET',
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('AI Config Response:');
        try {
            const config = JSON.parse(data);
            console.log('Features:', JSON.stringify(config.features, null, 2));
        } catch (e) {
            console.log("Raw Data:", data);
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
