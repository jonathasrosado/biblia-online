
import fs from 'fs';
import { execSync } from 'child_process';
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
        console.log("Executing railway variables set command synchronously...");

        try {
            // Using execSync to ensure it completes
            const result = execSync(`railway variables --set GEMINI_API_KEY="${key}"`, { encoding: 'utf-8' });
            console.log("Command Output:", result);
        } catch (execError) {
            console.error("Execution failed:", execError.message);
            if (execError.stdout) console.log("Stdout:", execError.stdout);
            if (execError.stderr) console.error("Stderr:", execError.stderr);
        }
    } else {
        console.error("GEMINI_API_KEY not found in .env.local");
    }
} catch (e) {
    console.error("Failed:", e.message);
}
