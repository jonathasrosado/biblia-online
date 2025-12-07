
import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');

try {
    if (!fs.existsSync(envPath)) {
        console.error(".env.local file not found at", envPath);
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);

    if (match && match[1]) {
        const key = match[1].trim();
        console.log(`Found key: ${key.substring(0, 5)}...`);
        console.log("Setting Railway variable...");

        exec(`railway variables --set GEMINI_API_KEY="${key}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                return;
            }
            // Railway CLI might output to stderr for info/warnings
            if (stderr) console.log(`StdErr: ${stderr}`);
            if (stdout) console.log(`Success! Output: ${stdout}`);
        });
    } else {
        console.error("GEMINI_API_KEY not found in .env.local");
    }
} catch (e) {
    console.error("Failed:", e.message);
}
