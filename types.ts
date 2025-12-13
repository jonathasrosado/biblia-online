export interface BibleBook {
  name: string;
  chapters: number;
  testament: 'Old' | 'New';
}

export type Theme = 'light' | 'dark' | 'bw' | 'sepia';

export type BibleVersion = 'blivre' | 'acf' | 'jra';

export interface Verse {
  number: number;
  text: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
}

export interface SearchResult {
  reference: string;
  text: string;
  context: string;
}

export interface ReadingPreferences {
  theme: 'light' | 'dark' | 'bw';
  fontFamily: 'serif' | 'sans';
  textAlign: 'left' | 'justify';
  fontSize: number; // Percentage (e.g. 100)
  voice: 'male' | 'female';
}

export interface ReadingHistoryItem {
  bookName: string;
  chapter: number;
  timestamp: number;
}

export interface FavoriteVerse {
  id: string; // Composite: book-chapter-verse
  book: string;
  chapter: number;
  verse: number;
  text: string;
  timestamp: number;
}

export interface DevotionalContent {
  title: string;
  verseReference: string;
  verseText: string;
  reflection: string;
  prayer: string;
}

export interface ChapterSummary {
  title: string;
  summary: string;
  structure: {
    intro: string;
    blocks: { verses: string; description: string }[];
    centralMessage: string;
  };
  keyVerses: {
    verses: string;
    title: string;
    explanation: string;
  }[];
  historicalContext: string;
  practicalApplication: string[];
  prayer: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  image?: string;
  date: string;
  content?: string;
  status: 'published' | 'draft';
  tags?: string[];
}