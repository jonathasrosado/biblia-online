import { bibleBooks } from '../constants';
import { Verse, SearchResult, BibleVersion } from '../types';

// Type definition for the JSON structure
interface BibleBookJson {
    abbrev: string;
    chapters: string[][];
}

// Helper to load data dynamically
const loadBibleData = async (version: BibleVersion): Promise<BibleBookJson[]> => {
    try {
        switch (version) {
            case 'nvi': return (await import('../src/data/bible_nvi.json')).default as BibleBookJson[];
            case 'acf': return (await import('../src/data/bible_acf.json')).default as BibleBookJson[];
            case 'ntlh': return (await import('../src/data/bible_ntlh.json')).default as BibleBookJson[];
            case 'ara': return (await import('../versoes/ARA.json')).default as BibleBookJson[];
            case 'arc': return (await import('../versoes/ARC.json')).default as BibleBookJson[];
            case 'as21': return (await import('../versoes/AS21.json')).default as BibleBookJson[];
            case 'jfaa': return (await import('../versoes/JFAA.json')).default as BibleBookJson[];
            case 'kja': return (await import('../versoes/KJA.json')).default as BibleBookJson[];
            case 'kjf': return (await import('../versoes/KJF.json')).default as BibleBookJson[];
            case 'naa': return (await import('../versoes/NAA.json')).default as BibleBookJson[];
            case 'nbv': return (await import('../versoes/NBV.json')).default as BibleBookJson[];
            case 'nvt': return (await import('../versoes/NVT.json')).default as BibleBookJson[];
            case 'tb': return (await import('../versoes/TB.json')).default as BibleBookJson[];
            default: return (await import('../src/data/bible_nvi.json')).default as BibleBookJson[];
        }
    } catch (error) {
        console.error(`Failed to load bible version: ${version}`, error);
        return (await import('../src/data/bible_nvi.json')).default as BibleBookJson[];
    }
}

export const getChapterContentLocal = async (bookName: string, chapterNumber: number, version: BibleVersion = 'nvi'): Promise<Verse[] | null> => {
    try {
        // 1. Find the book index
        const bookIndex = bibleBooks.findIndex(b => b.name === bookName);

        if (bookIndex === -1) {
            console.warn(`Book not found: ${bookName}`);
            return null;
        }

        // Select the correct bible version
        const bibleData = await loadBibleData(version);
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

export const searchBibleLocal = async (query: string, version: BibleVersion = 'nvi'): Promise<SearchResult[]> => {
    if (!query || query.length < 3) return [];

    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();
    const limit = 20; // Limit local results to prevent UI lag

    try {
        // Select the correct bible version
        const bibleData = await loadBibleData(version);

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
