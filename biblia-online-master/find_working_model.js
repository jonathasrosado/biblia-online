
import { GoogleGenerativeAI } from "@google/generative-ai";

// Correct Key (Validated)
const API_KEY = "AIzaSyB20fNNC98BOelkCYsBmYiFc-1pRi2NZPU";
const genAI = new GoogleGenerativeAI(API_KEY);

const candidates = [
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-pro"
];

async function testAll() {
    console.log("🔍 Starting Exhaustive Model Search...");
    const workingModels = [];

    for (const modelName of candidates) {
        process.stdout.write(`Testing ${modelName.padEnd(25)}: `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Test.");
            const response = await result.response;
            const text = response.text();

            if (text) {
                console.log("✅ WORKING (200 OK)");
                workingModels.push(modelName);
            } else {
                console.log("⚠️ EMPTY RESPONSE");
            }
        } catch (e) {
            let errorMsg = e.message;
            if (errorMsg.includes("404")) errorMsg = "404 Not Found";
            else if (errorMsg.includes("403")) errorMsg = "403 Forbidden";
            else if (errorMsg.includes("503")) errorMsg = "503 Overloaded";
            console.log(`❌ FAILED (${errorMsg})`);
        }
    }

    console.log("\n--- SUMMARY ---");
    if (workingModels.length > 0) {
        console.log("🏆 WINNER(S): " + workingModels.join(", "));
    } else {
        console.log("💀 NO WORKING MODELS FOUND.");
    }
}

testAll();
