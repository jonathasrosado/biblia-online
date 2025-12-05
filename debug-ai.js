import { aiManager } from './server/services/aiManager.js';

const config = aiManager.getConfig();
console.log('--- DEBUG START ---');
console.log('Images Feature Config:', JSON.stringify(config.features?.images || 'UNDEFINED'));
console.log('Resolved Provider:', config.features?.images?.provider || 'pollinations (fallback)');
console.log('--- DEBUG END ---');
