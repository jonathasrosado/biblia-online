import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey) {
    console.error("No API Key found");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function testModel(modelName) {
    process.stdout.write(`Testing model: ${modelName}... `);
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text: "Hello, this is a test." }] }],
            config: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: "Aoede" },
                    },
                },
            },
        });
        process.stdout.write("SUCCESS!\n");
    } catch (error) {
        process.stdout.write(`FAILED: ${error.message.substring(0, 50)}...\n`);
    }
}

async function runTests() {
    await testModel("gemini-2.0-flash");
    await new Promise(r => setTimeout(r, 1000));
    await testModel("gemini-2.0-flash-exp");
    await new Promise(r => setTimeout(r, 1000));
    await testModel("gemini-2.5-flash");
}

runTests();
