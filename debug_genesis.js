
import { aiManager } from './server/services/aiManager.js';

async function run() {
    try {
        console.log("Testing Genesis Summary Generation...");
        const data = await aiManager.generateBookSummary('Gênesis', 'pt', true);
        console.log("SUCCESS:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("FAILURE:", error);
    }
}

run();
