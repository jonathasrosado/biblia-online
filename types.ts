export interface BibleBook {
  name: string;
  chapters: number;
  testament: 'Old' | 'New';
}

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
  theme: 'light' | 'dark' | 'sepia';
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

export interface DevotionalContent {
  title: string;
  verseReference: string;
  verseText: string;
  reflection: string;
  prayer: string;
}

export interface FluidChapterContent {
  title: string;
  paragraphs: string[];
}