import https from 'https';

const url = 'https://bibliaonline.me/api/admin/system/logs';

console.log(`Fetching: ${url}`);

https.get(url, { rejectUnauthorized: false }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log("\n--- SERVER LOGS START ---");
        console.log(data);
        console.log("--- SERVER LOGS END ---");
    });
}).on('error', (err) => {
    console.error("Fetch Error:", err.message);
});
