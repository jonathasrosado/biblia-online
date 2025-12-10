import { aiManager } from './server/services/aiManager.js';

async function debug() {
    console.log("=== Debugging Model Data ===");
    try {
        const models = await aiManager.getAvailableModels();
        console.log(JSON.stringify(models, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

debug();
