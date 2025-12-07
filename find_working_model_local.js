
import fs from 'fs';

const API_KEY = "AIzaSyB20fNNC98BOelkCYsBmYiFc-1pRi2NZPU";
const modelsData = JSON.parse(fs.readFileSync('models.json', 'utf8'));

async function test() {
    console.log(`Found ${modelsData.models.length} models.`);

    for (const m of modelsData.models) {
        if (!m.supportedGenerationMethods.includes("generateContent")) continue;

        const name = m.name.replace("models/", "");
        process.stdout.write(`Testing ${name}... `);

        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
            });

            if (res.ok) {
                console.log("✅ SUCCESS!");
                successModels.push(name);
            } else {
                console.log(`❌ ${res.status}`);
            }
        } catch (e) {
            console.log("ERR");
        }
    }

    console.log("\n--- SUMMARY ---");
    console.log("WORKING MODELS:", successModels.join(", "));
    fs.writeFileSync('working_models_list.txt', successModels.join("\n"));
}
const successModels = [];
test();
