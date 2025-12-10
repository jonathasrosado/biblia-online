import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../src/data/fluid_chapters');

const normalize = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

if (fs.existsSync(DATA_DIR)) {
    const files = fs.readdirSync(DATA_DIR);

    files.forEach(file => {
        const oldPath = path.join(DATA_DIR, file);
        const newFilename = normalize(file);
        const newPath = path.join(DATA_DIR, newFilename);

        if (oldPath !== newPath) {
            fs.renameSync(oldPath, newPath);
            console.log(`Renamed: ${file} -> ${newFilename}`);
        }
    });
    console.log("Migration complete.");
} else {
    console.log("Data directory not found.");
}
