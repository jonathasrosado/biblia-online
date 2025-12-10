
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyB20fNNC98BOelkCYsBmYiFc-1pRi2NZPU";
const genAI = new GoogleGenerativeAI(API_KEY);

const modelsToTest = [
    "gemini-2.0-flash",
    "gemini-flash-latest",
    "gemini-1.5-flash-latest",
    "gemini-pro"
];

async function test() {
    console.log("Testing Models with Key: " + API_KEY.substring(0, 10) + "...");

    for (const modelName of modelsToTest) {
        console.log(`\nTesting: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, are you there?");
            console.log(`✅ SUCCESS: ${modelName}`);
            // console.log("Response:", result.response.text());
        } catch (e) {
            console.log(`❌ FAILED: ${modelName}`);
            console.log(`   Error: ${e.message}`);
        }
    }
}

test();
