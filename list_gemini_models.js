import { aiManager } from './server/services/aiManager.js';

async function list() {
    const config = aiManager.getConfig();
    const apiKey = config.apiKeys.gemini;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                // Filter for Gemini models
                if (m.name.includes('gemini')) {
                    console.log(m.name.replace('models/', ''));
                }
            });
        } else {
            console.log("Error listing models:", JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

list();
