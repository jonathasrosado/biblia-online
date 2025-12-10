import bibleAcfData from '../src/data/bible_acf.json';
import bibleNviData from '../src/data/bible_nvi.json';
import bibleNtlhData from '../src/data/bible_ntlh.json';
import { bibleBooks } from '../constants';
import { Verse, SearchResult, BibleVersion } from '../types';

// Type definition for the JSON structure
interface BibleBookJson {
    abbrev: string;
    chapters: string[][];
}

// Cast the imported JSON to the correct type
const bibleAcf: BibleBookJson[] = bibleAcfData as BibleBookJson[];
const bibleNvi: BibleBookJson[] = bibleNviData as BibleBookJson[];
const bibleNtlh: BibleBookJson[] = bibleNtlhData as BibleBookJson[];

export const getChapterContentLocal = (bookName: string, chapterNumber: number, version: BibleVersion = 'nvi'): Verse[] | null => {
    try {
        // 1. Find the book index
        const bookIndex = bibleBooks.findIndex(b => b.name === bookName);

        if (bookIndex === -1) {
            console.warn(`Book not found: ${bookName}`);
            return null;
        }

        // Select the correct bible version
        const bibleData = version === 'nvi' ? bibleNvi : (version === 'ntlh' ? bibleNtlh : bibleAcf);
        const bookData = bibleData[bookIndex];

        if (!bookData) {
            console.warn(`Book data not found for index: ${bookIndex} in version ${version}`);
            return null;
        }

        // 2. Get the chapter content (chapters are 0-indexed in array, but 1-indexed in request)
        const chapterTextArray = bookData.chapters[chapterNumber - 1];

        if (!chapterTextArray) {
            console.warn(`Chapter not found: ${bookName} ${chapterNumber}`);
            return null;
        }

        // 3. Convert string[] to Verse[]
        const verses: Verse[] = chapterTextArray.map((text, index) => ({
            number: index + 1,
            text: text
        }));

        return verses;

    } catch (error) {
        console.error("Error reading local bible data:", error);
        return null;
    }
};

export const searchBibleLocal = (query: string, version: BibleVersion = 'nvi'): SearchResult[] => {
    if (!query || query.length < 3) return [];

    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();
    const limit = 20; // Limit local results to prevent UI lag

    // Select the correct bible version
    const bibleData = version === 'nvi' ? bibleNvi : (version === 'ntlh' ? bibleNtlh : bibleAcf);

    try {
        // Iterate through all books
        for (let bIndex = 0; bIndex < bibleData.length; bIndex++) {
            const book = bibleData[bIndex];
            const bookName = bibleBooks[bIndex]?.name || book.abbrev;

            // Iterate through all chapters
            for (let cIndex = 0; cIndex < book.chapters.length; cIndex++) {
                const chapter = book.chapters[cIndex];

                // Iterate through all verses
                for (let vIndex = 0; vIndex < chapter.length; vIndex++) {
                    const verseText = chapter[vIndex];

                    if (verseText.toLowerCase().includes(lowerQuery)) {
                        results.push({
                            reference: `${bookName} ${cIndex + 1}:${vIndex + 1}`,
                            text: verseText,
                            context: "Resultado exato do texto bíblico."
                        });

                        if (results.length >= limit) return results;
                    }
                }
            }
        }
    } catch (e) {
        console.error("Local search error:", e);
    }

    return results;
};
