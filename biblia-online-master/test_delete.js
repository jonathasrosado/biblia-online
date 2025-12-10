
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testDelete() {
    // 1. Create a dummy file
    const uploadsDir = path.resolve(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

    const testFile = path.join(uploadsDir, 'delete_test.txt');
    fs.writeFileSync(testFile, 'test content');
    console.log('Created test file:', testFile);

    // 2. Try to delete it via API
    try {
        const response = await fetch('http://localhost:3002/api/media/delete_test.txt', {
            method: 'DELETE'
        });

        const data = await response.json();
        console.log('Delete Response:', data);

        if (data.success) {
            console.log('SUCCESS: API reported success.');
        } else {
            console.error('FAILURE: API reported error.');
        }

        if (fs.existsSync(testFile)) {
            console.error('FAILURE: File still exists on disk!');
        } else {
            console.log('SUCCESS: File is gone from disk.');
        }

    } catch (e) {
        console.error('Test Exception:', e);
    }
}

testDelete();
