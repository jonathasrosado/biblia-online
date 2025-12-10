
import fs from 'fs';
const content = fs.readFileSync('server/api.js', 'utf-8');
const lines = content.split('\n');
lines.forEach((line, index) => {
    if (line.includes("app.get('/api/categories'")) {
        console.log(`Found at line ${index + 1}: ${line.trim()}`);
    }
});
