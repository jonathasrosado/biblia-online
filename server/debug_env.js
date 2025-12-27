import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

console.log("Current Directory:", process.cwd());
const envPath = path.resolve(process.cwd(), '.env');
console.log("Env Path:", envPath);
console.log("Env File Exists:", fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
    console.log("Env File Content (First 20 chars):", fs.readFileSync(envPath, 'utf8').substring(0, 20));
}

const result = dotenv.config({ path: envPath });
console.log("Dotenv Result Error:", result.error);
console.log("Dotenv Parsed Keys:", result.parsed ? Object.keys(result.parsed) : 'None');

console.log("\n--- Process Env Check ---");
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "FOUND (Ends with " + process.env.GEMINI_API_KEY.slice(-4) + ")" : "NOT FOUND");
