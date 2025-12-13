
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, 'blivre.json');
const outputFile = path.join(__dirname, 'src', 'data', 'bible_jra.json');

const bookOrder = [
    "gn", "ex", "lv", "nm", "dt", "js", "jz", "rt", "1sm", "2sm", "1rs", "2rs", "1cr", "2cr", "ed", "ne", "et", "job", "sl", "pv", "ec", "ct", "is", "jr", "lm", "ez", "dn", "os", "jl", "am", "ob", "jn", "mq", "na", "hc", "sf", "ag", "zc", "ml",
    "mt", "mc", "lc", "jo", "at", "rm", "1co", "2co", "gl", "ef", "fp", "cl", "1ts", "2ts", "1tm", "2tm", "tt", "fm", "hb", "tg", "1pe", "2pe", "1jo", "2jo", "3jo", "jd", "ap"
];

console.log('Script started.');
console.log('Input file:', inputFile);

try {
    // Load input file
    console.log('Reading input file...');
    if (!fs.existsSync(inputFile)) {
        throw new Error(`Input file not found at ${inputFile}`);
    }
    const rawData = fs.readFileSync(inputFile, 'utf8');
    console.log('Parsing input file...');
    const inputData = JSON.parse(rawData);
    console.log('Input file parsed.');

    // Validate input format
    if (!inputData.verses || !Array.isArray(inputData.verses)) {
        console.error('Error: Input file does not have a "verses" array.');
        process.exit(1);
    }

    console.log(`Loaded ${inputData.verses.length} verses.`);

    // Group verses by book and chapter
    const booksMap = new Map();

    inputData.verses.forEach(v => {
        const bookNum = v.book;
        const chapterNum = v.chapter;
        const text = v.text;

        if (!booksMap.has(bookNum)) {
            booksMap.set(bookNum, {});
        }
        const book = booksMap.get(bookNum);

        if (!book[chapterNum]) {
            book[chapterNum] = [];
        }

        book[chapterNum].push(text);
    });

    const processedData = [];

    // Iterate 1 to 66
    for (let i = 1; i <= 66; i++) {
        const abbrev = bookOrder[i - 1];
        if (!abbrev) {
            console.warn(`No abbreviation found for book index ${i}`);
            continue;
        }

        const bookContent = booksMap.get(i);
        const chapters = [];

        if (bookContent) {
            const chapterNums = Object.keys(bookContent).map(Number).sort((a, b) => a - b);

            chapterNums.forEach(chNum => {
                chapters.push(bookContent[chNum]);
            });
        } else {
            // Create empty book strictly if missing, or specific logic?
            // App expects chapters.
            console.warn(`No content found for book index ${i} (${abbrev})`);
        }

        processedData.push({
            abbrev: abbrev,
            chapters: chapters
        });
    }

    console.log('Writing output file...');
    fs.writeFileSync(outputFile, JSON.stringify(processedData, null, 2));
    console.log(`Successfully created ${outputFile} with ${processedData.length} books.`);

} catch (error) {
    console.error('Error processing bible file:', error.message);
    process.exit(1);
}
