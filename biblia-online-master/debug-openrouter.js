import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'server', 'ai-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const apiKey = config.apiKeys.openrouter;

console.log(`Using Key: ${apiKey.substring(0, 10)}...`);

fetch('https://openrouter.ai/api/v1/models', {
    headers: {
        'Authorization': `Bearer ${apiKey}`
    }
})
    .then(res => res.json())
    .then(data => {
        if (data.data) {
            const imageModels = data.data.filter(m =>
                m.id.includes('flux') ||
                m.id.includes('midjourney') ||
                m.id.includes('stable') ||
                m.id.includes('diffusion') ||
                m.id.includes('image') ||
                m.id.includes('ideogram') ||
                m.id.includes('recraft')
            );

            const output = imageModels.map(m => `- ${m.id} (${m.name})`).join('\n');
            fs.writeFileSync(path.join(process.cwd(), 'available-image-models.txt'), output);
            console.log(`Saved ${imageModels.length} image models to available-image-models.txt`);
        }
    })
    .catch(err => console.error('Error:', err));
