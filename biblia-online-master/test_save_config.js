
import fetch from 'node-fetch';

async function testSaveConfig() {
    const url = 'http://localhost:3002/api/ai/config';

    // 1. Get current config
    console.log('Fetching current config...');
    const getRes = await fetch(url);
    const currentConfig = await getRes.json();
    console.log('Current Gemini Key:', currentConfig.apiKeys.gemini);

    // 2. Update key
    const newKey = 'TEST_KEY_' + Date.now();
    console.log('Updating Gemini Key to:', newKey);

    const newConfig = {
        ...currentConfig,
        apiKeys: {
            ...currentConfig.apiKeys,
            gemini: newKey
        }
    };

    // 3. Save config
    const postRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
    });

    if (postRes.ok) {
        console.log('Save successful.');
    } else {
        console.error('Save failed:', postRes.status, postRes.statusText);
        return;
    }

    // 4. Verify update
    console.log('Verifying update...');
    const verifyRes = await fetch(url);
    const verifyConfig = await verifyRes.json();
    console.log('New Gemini Key:', verifyConfig.apiKeys.gemini);

    if (verifyConfig.apiKeys.gemini === newKey) {
        console.log('SUCCESS: Config updated and persisted.');
    } else {
        console.error('FAILURE: Config did not persist.');
    }
}

testSaveConfig();
