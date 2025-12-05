
import { getChapterContentLocal } from './services/localBibleService';
import { bibleBooks } from './constants';

console.log("Starting Local Bible Data Test...");

const testBooks = ['Gênesis', 'Salmos', 'João', 'Apocalipse'];

testBooks.forEach(bookName => {
    const book = bibleBooks.find(b => b.name === bookName);
    if (book) {
        const start = performance.now();
        const verses = getChapterContentLocal(bookName, 1);
        const end = performance.now();

        if (verses && verses.length > 0) {
            console.log(`[SUCCESS] Loaded ${bookName} 1: ${verses.length} verses in ${(end - start).toFixed(4)}ms`);
        } else {
            console.error(`[FAIL] Could not load ${bookName} 1`);
        }
    }
});

console.log("Test Complete.");
