
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function testKey() {
    console.log("Testing GEMINI_API_KEY from .env...");
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
        console.error("ERROR: GEMINI_API_KEY not found in process.env");
        return;
    }

    console.log(`Key found (ends with ${key.slice(-4)})`);

    try {
        const genAI = new GoogleGenerativeAI(key);
        // Try a stable model first
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log("Sending request to gemini-1.5-flash...");
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log("Response received:", response.text());
        console.log("SUCCESS: Key is valid and working.");

    } catch (error) {
        console.error("ERROR testing gemini-1.5-flash:", error.message);

        // If 1.5 fails, try 2.0 just in case
        try {
            console.log("Retrying with gemini-2.0-flash-exp...");
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            const result = await model.generateContent("Hello?");
            console.log("Response received:", result.response.text());
            console.log("SUCCESS: Key works with 2.0-flash-exp.");
        } catch (e2) {
            console.error("ERROR testing gemini-2.0-flash-exp:", e2.message);
        }
    }
}

testKey();
