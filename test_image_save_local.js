
import { aiManager } from './server/services/aiManager.js';
import fs from 'fs';
import path from 'path';

async function testImageSaving() {
    console.log('Testing Image Saving...');

    // Test 1: Pollinations URL
    const prompt = 'test image saving ' + Date.now();
    console.log(`Generating image for prompt: "${prompt}"`);

    try {
        const localUrl = await aiManager.generateImage(prompt);
        console.log('Result URL:', localUrl);

        if (localUrl.startsWith('/uploads/')) {
            const filename = localUrl.replace('/uploads/', '');
            const filePath = path.join(process.cwd(), 'uploads', filename);

            if (fs.existsSync(filePath)) {
                console.log('SUCCESS: File exists at', filePath);
                const stats = fs.statSync(filePath);
                console.log('File size:', stats.size, 'bytes');
            } else {
                console.error('FAILURE: File does not exist at', filePath);
            }
        } else {
            console.error('FAILURE: URL does not start with /uploads/');
        }

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testImageSaving();
