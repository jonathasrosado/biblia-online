import { bibleBooks } from '../constants';
import { BibleBook } from '../types';
import { characters, CharacterProfile } from '../data/search/characters';
import { stories, StoryEntry } from '../data/search/stories';
import { emotions, EmotionEntry } from '../data/search/emotions';

export type SearchIntentType = 'BOOK' | 'CHAPTER' | 'VERSE' | 'RANGE' | 'THEME' | 'QUESTION' | 'CHARACTER' | 'STORY' | 'EMOTION' | 'UNKNOWN';

export interface SearchIntent {
    type: SearchIntentType;
    originalQuery: string;
    data?: {
        book?: BibleBook;
        chapter?: number;
        verse?: number;
        endVerse?: number;
        theme?: string;
        question?: string;
        character?: CharacterProfile;
        story?: StoryEntry;
        emotion?: EmotionEntry;
    };
    confidence: number;
}

// Map of normalized aliases to canonical book names
const BOOK_ALIASES: Record<string, string> = {
    // Old Testament
    'gn': 'Gênesis', 'genesis': 'Gênesis', 'gen': 'Gênesis',
    'ex': 'Êxodo', 'exodo': 'Êxodo', 'exo': 'Êxodo',
    'lv': 'Levítico', 'levitico': 'Levítico', 'lev': 'Levítico',
    'nm': 'Números', 'numeros': 'Números', 'num': 'Números',
    'dt': 'Deuteronômio', 'deuteronomio': 'Deuteronômio', 'deut': 'Deuteronômio',
    'js': 'Josué', 'josue': 'Josué', 'jos': 'Josué',
    'jz': 'Juízes', 'juizes': 'Juízes', 'jui': 'Juízes',
    'rt': 'Rute', 'rute': 'Rute', 'rut': 'Rute',
    '1sm': '1 Samuel', '1samuel': '1 Samuel', '1sam': '1 Samuel', 'i sm': '1 Samuel', 'isam': '1 Samuel',
    '2sm': '2 Samuel', '2samuel': '2 Samuel', '2sam': '2 Samuel', 'ii sm': '2 Samuel', 'iisam': '2 Samuel',
    '1rs': '1 Reis', '1reis': '1 Reis', 'i rs': '1 Reis', 'ireis': '1 Reis',
    '2rs': '2 Reis', '2reis': '2 Reis', 'ii rs': '2 Reis', 'iireis': '2 Reis',
    '1cr': '1 Crônicas', '1cronicas': '1 Crônicas', 'i cr': '1 Crônicas', 'icronicas': '1 Crônicas',
    '2cr': '2 Crônicas', '2cronicas': '2 Crônicas', 'ii cr': '2 Crônicas', 'iicronicas': '2 Crônicas',
    'ed': 'Esdras', 'esdras': 'Esdras', 'esd': 'Esdras',
    'ne': 'Neemias', 'neemias': 'Neemias', 'nee': 'Neemias',
    'et': 'Ester', 'ester': 'Ester', 'est': 'Ester',
    'jo': 'Jó', 'job': 'Jó',
    'sl': 'Salmos', 'salmos': 'Salmos', 'sal': 'Salmos', 'salmo': 'Salmos',
    'pv': 'Provérbios', 'proverbios': 'Provérbios', 'prov': 'Provérbios',
    'ec': 'Eclesiastes', 'eclesiastes': 'Eclesiastes', 'ecl': 'Eclesiastes',
    'ct': 'Cânticos', 'canticos': 'Cânticos', 'cantares': 'Cânticos',
    'is': 'Isaías', 'isaias': 'Isaías', 'isa': 'Isaías',
    'jr': 'Jeremias', 'jeremias': 'Jeremias', 'jer': 'Jeremias',
    'lm': 'Lamentações', 'lamentacoes': 'Lamentações', 'lam': 'Lamentações',
    'ez': 'Ezequiel', 'ezequiel': 'Ezequiel', 'eze': 'Ezequiel',
    'dn': 'Daniel', 'daniel': 'Daniel', 'dan': 'Daniel',
    'os': 'Oseias', 'oseias': 'Oseias',
    'jl': 'Joel', 'joel': 'Joel',
    'am': 'Amós', 'amos': 'Amós',
    'ob': 'Obadias', 'obadias': 'Obadias',
    'jn': 'Jonas', 'jonas': 'Jonas',
    'mq': 'Miqueias', 'miqueias': 'Miqueias', 'miq': 'Miqueias',
    'na': 'Naum', 'naum': 'Naum',
    'hc': 'Habacuque', 'habacuque': 'Habacuque', 'hab': 'Habacuque',
    'sf': 'Sofonias', 'sofonias': 'Sofonias',
    'ag': 'Ageu', 'ageu': 'Ageu',
    'zc': 'Zacarias', 'zacarias': 'Zacarias', 'zac': 'Zacarias',
    'ml': 'Malaquias', 'malaquias': 'Malaquias', 'mal': 'Malaquias',
    'mt': 'Mateus', 'mateus': 'Mateus', 'mat': 'Mateus',
    'mc': 'Marcos', 'marcos': 'Marcos', 'mar': 'Marcos',
    'lc': 'Lucas', 'lucas': 'Lucas', 'luc': 'Lucas',
    'joao': 'João', 'jhn': 'João',
    'at': 'Atos', 'atos': 'Atos',
    'rm': 'Romanos', 'romanos': 'Romanos', 'rom': 'Romanos',
    '1co': '1 Coríntios', '1corintios': '1 Coríntios',
    '2co': '2 Coríntios', '2corintios': '2 Coríntios',
    'gl': 'Gálatas', 'galatas': 'Gálatas', 'gal': 'Gálatas',
    'ef': 'Efésios', 'efesios': 'Efésios', 'efe': 'Efésios',
    'fp': 'Filipenses', 'filipenses': 'Filipenses', 'fil': 'Filipenses',
    'cl': 'Colossenses', 'colossenses': 'Colossenses', 'col': 'Colossenses',
    '1ts': '1 Tessalonicenses', '1tessalonicenses': '1 Tessalonicenses',
    '2ts': '2 Tessalonicenses', '2tessalonicenses': '2 Tessalonicenses',
    '1tm': '1 Timóteo', '1timoteo': '1 Timóteo',
    '2tm': '2 Timóteo', '2timoteo': '2 Timóteo',
    'tt': 'Tito', 'tito': 'Tito',
    'fm': 'Filemom', 'filemom': 'Filemom',
    'hb': 'Hebreus', 'hebreus': 'Hebreus', 'heb': 'Hebreus',
    'tg': 'Tiago', 'tiago': 'Tiago',
    '1pe': '1 Pedro', '1pedro': '1 Pedro',
    '2pe': '2 Pedro', '2pedro': '2 Pedro',
    '1jo': '1 João', '1joao': '1 João',
    '2jo': '2 João', '2joao': '2 João',
    '3jo': '3 João', '3joao': '3 João',
    'jd': 'Judas', 'judas': 'Judas',
    'ap': 'Apocalipse', 'apocalipse': 'Apocalipse'
};

function normalizeStr(s: string): string {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, ' ');
}

function findBook(query: string): BibleBook | undefined {
    const normalized = normalizeStr(query);
    if (BOOK_ALIASES[normalized]) {
        const target = BOOK_ALIASES[normalized];
        return bibleBooks.find(b => b.name === target);
    }
    const exact = bibleBooks.find(b => normalizeStr(b.name) === normalized);
    if (exact) return exact;
    const prefix = bibleBooks.find(b => normalizeStr(b.name).startsWith(normalized));
    if (prefix) return prefix;
    return undefined;
}

export function parseSearchIntent(query: string): SearchIntent {
    const cleanQuery = query.trim();
    const lowerQuery = cleanQuery.toLowerCase();
    const normalizedQuery = normalizeStr(query);

    // 1. Check for Question
    const questionWords = ['quem', 'onde', 'porque', 'por que', 'o que', 'como', 'qual', 'quando', 'significado'];
    if (cleanQuery.endsWith('?') || questionWords.some(w => lowerQuery.startsWith(w))) {
        return {
            type: 'QUESTION',
            originalQuery: cleanQuery,
            data: { question: cleanQuery },
            confidence: 0.9
        };
    }

    // 2. Emotions (High Priority for "feelings")
    // Exact matching logic for keys or titles
    for (const [key, emotion] of Object.entries(emotions)) {
        if (normalizedQuery.includes(normalizeStr(key)) || normalizedQuery.includes(normalizeStr(emotion.title))) {
            return {
                type: 'EMOTION',
                originalQuery: cleanQuery,
                data: { emotion },
                confidence: 0.95
            };
        }
    }

    // 3. Characters (Exact or Alias)
    for (const [key, char] of Object.entries(characters)) {
        const aliases = char.searchAliases || [];
        // Exact match of query against name or aliases
        if (normalizedQuery === normalizeStr(char.name) || aliases.some(a => normalizedQuery === normalizeStr(a))) {
            return {
                type: 'CHARACTER',
                originalQuery: cleanQuery,
                data: { character: char },
                confidence: 0.95
            };
        }
    }

    // 4. Stories (Fuzzy / Keywords)
    for (const [key, story] of Object.entries(stories)) {
        // Direct match with key (which is a description like "menino gigante") or title
        // We use 'includes' for the key because the user might type "historia do menino gigante"
        // But ideally we want exact match for the key if it's very specific, or partial if it's unique.
        // Let's stick to exact match against key OR title for now to avoid noise.

        if (normalizedQuery === normalizeStr(key) || normalizedQuery === normalizeStr(story.title)) {
            return {
                type: 'STORY',
                originalQuery: cleanQuery,
                data: { story },
                confidence: 0.95
            };
        }

        // Also check if query contains the key phrase (e.g. "quem foi o menino gigante")
        if (normalizedQuery.includes(normalizeStr(key))) {
            return {
                type: 'STORY',
                originalQuery: cleanQuery,
                data: { story },
                confidence: 0.9
            };
        }
    }


    // 5. Verse Reference (Standard Pattern)
    const refRegex = /^([\d\s]*[a-zA-Zçéáíóúâêôãõ\.]+)\s+(\d+)(?:[:\s](\d+))?(?:-(\d+))?$/;
    const match = cleanQuery.match(refRegex);
    if (match) {
        const bookPart = match[1].trim().replace(/\.$/, '');
        const chapter = parseInt(match[2], 10);
        const verse = match[3] ? parseInt(match[3], 10) : undefined;
        const endVerse = match[4] ? parseInt(match[4], 10) : undefined;
        const book = findBook(bookPart);

        if (book) {
            if (endVerse && verse) {
                return { type: 'RANGE', originalQuery: cleanQuery, data: { book, chapter, verse, endVerse }, confidence: 1.0 };
            } else if (verse) {
                return { type: 'VERSE', originalQuery: cleanQuery, data: { book, chapter, verse }, confidence: 1.0 };
            } else {
                return { type: 'CHAPTER', originalQuery: cleanQuery, data: { book, chapter }, confidence: 1.0 };
            }
        }
    }

    // 6. Standalone Book
    const book = findBook(cleanQuery);
    if (book) {
        return { type: 'BOOK', originalQuery: cleanQuery, data: { book }, confidence: 1.0 };
    }

    // 7. Fallback to Theme/Text Search
    return {
        type: 'THEME',
        originalQuery: cleanQuery,
        data: { theme: cleanQuery },
        confidence: 0.5
    };
}
