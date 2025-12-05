// Test script to verify AI endpoints
import './server/services/aiManager.js';
import { aiManager } from './server/services/aiManager.js';

console.log('Testing aiManager...');
try {
    const config = aiManager.getConfig();
    console.log('✓ Config loaded:', JSON.stringify(config, null, 2));

    const models = await aiManager.getAvailableModels();
    console.log('✓ Models fetched:', models);

    console.log('\n✅ All tests passed! AI endpoints should work after server restart.');
} catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
}
