import { aiManager } from './server/services/aiManager.js';

async function test() {
    console.log("Testing generation of Summary for 'Gênesis'...");
    try {
        const summary = await aiManager.generateBookSummary('Gênesis', 'pt');
        console.log("Success! Summary:", JSON.stringify(summary, null, 2));
    } catch (e) {
        console.error("Test Failed:", e);
    }
}

test();
