import https from 'https';

const url = 'https://bibliaonline.me/api/debug/log';

console.log(`Fetching: ${url}`);

https.get(url, { rejectUnauthorized: false }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log("\n--- SERVER LOGS START ---");
        // Print last 2000 characters
        console.log(data.slice(-2000));
        console.log("--- SERVER LOGS END ---");

        // Find errors
        const errorLines = data.split('\n').filter(line => line.includes('Error') || line.includes('Exception'));
        console.log("\n--- FOUND ERRORS ---");
        console.log(errorLines.slice(-10).join('\n'));
    });
}).on('error', (err) => {
    console.error("Fetch Error:", err.message);
});
