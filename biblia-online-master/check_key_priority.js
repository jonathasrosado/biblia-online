import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Mock process.env
process.env.GEMINI_API_KEY = "";

// 1. Manually load env like server/api.js does
const loadEnv = () => {
    const envFiles = ['.env.local', '.env'];
    envFiles.forEach(file => {
        const filePath = path.resolve(__dirname, file);
        if (fs.existsSync(filePath)) {
            console.log(`[Test] Loading env from ${file}`);
            const content = fs.readFileSync(filePath, 'utf-8');
            content.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
                    process.env[key] = value;
                }
            });
        }
    });
};

loadEnv();
const ENV_KEY = process.env.GEMINI_API_KEY;
console.log(`[Test] Key from .env: ${ENV_KEY ? ENV_KEY.substring(0, 10) + '...' : 'NONE'}`);

// 2. Check Force Key
let FORCED_KEY = "";
try {
    const forced = require('./server/force_key.js'); // Adjusted path relative to root
    if (forced && forced.GEMINI_KEY) {
        FORCED_KEY = forced.GEMINI_KEY;
        console.log(`[Test] Key from force_key.js: ${FORCED_KEY ? FORCED_KEY.substring(0, 10) + '...' : 'NONE'}`);
    }
} catch (e) { console.log("[Test] No force_key found or error:", e.message); }

// 3. Simulate Server Logic
let FINAL_KEY = ENV_KEY;
if (FORCED_KEY) {
    if (!FINAL_KEY) {
        FINAL_KEY = FORCED_KEY;
        console.log("[Test] Server would use FORCE KEY (env missing)");
    } else {
        console.log("[Test] Server would use ENV KEY (env present)");
    }
} else {
    console.log("[Test] Server would use ENV KEY (no force key)");
}

// 4. Test Connectivity with FINAL_KEY
const modelsToTest = ['gemma-3-27b-it', 'gemini-2.0-flash', 'gemini-1.5-flash'];
const runTests = async () => {
    for (const model of modelsToTest) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${FINAL_KEY}`;
        console.log(`\n[Test] Testing ${model}...`);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
            });
            console.log(`[Test] ${model} Status: ${res.status}`);
            const text = await res.text();
            if (res.ok) {
                console.log(`[Test] ${model} SUCCESS!`);
                console.log(text.substring(0, 100));
                return; // Stop on first success
            } else {
                console.error(`[Test] ${model} Failed: ${text.substring(0, 200)}`);
            }
        } catch (e) {
            console.error(`[Test] ${model} Error: ${e.message}`);
        }
    }
    console.log("[Test] ALL MODELS FAILED.");
};
runTests();
