// Native fetch is available in Node 18+
async function checkModels() {
    try {
        const response = await fetch('http://localhost:3001/api/ai/models');
        const data = await response.json();

        console.log('--- Checking for Image Models ---');
        const orModels = data.openrouter || [];

        const keywords = ['flux', 'diffusion', 'stability', 'midjourney', 'dall-e'];
        const imageModels = orModels.filter(m =>
            keywords.some(k => m.id.toLowerCase().includes(k))
        );

        if (imageModels.length === 0) {
            console.log('NO IMAGE MODELS FOUND matching keywords:', keywords);
            console.log('Total OpenRouter models available:', orModels.length);
            if (orModels.length > 0) {
                console.log('Sample IDs:', orModels.slice(0, 10).map(m => m.id));
            }
        } else {
            console.log('Found Image Models:', imageModels.map(m => m.id));
        }

    } catch (e) {
        console.error('Error fetching models:', e);
    }
}

checkModels();
