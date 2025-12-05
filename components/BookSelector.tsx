import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Bookmark, Clock, Trash2, History, Search, BookOpen, X } from 'lucide-react';
import { BibleBook, ReadingHistoryItem } from '../types';
import { bibleBooks, normalizeBookName } from '../constants';

interface BookSelectorProps {
  currentBook: BibleBook;
  currentChapter: number;
  history: ReadingHistoryItem[];
  onSelect: (book: BibleBook, chapter: number) => void;
  onClearHistory: () => void;
  t: any;
}

const BookSelector: React.FC<BookSelectorProps> = ({ currentBook, currentChapter, history, onSelect, onClearHistory, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Old' | 'New'>('All');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Auto-expand current book when it changes
  useEffect(() => {
    if (currentBook) {
      setExpandedBook(currentBook.name);
    }
  }, [currentBook.name]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter logic
  const filteredBooks = bibleBooks.filter(b => {
    const matchesFilter = filter === 'All' ? true : b.testament === filter;
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const toggleBook = (bookName: string) => {
    if (expandedBook === bookName) {
      setExpandedBook(null);
    } else {
      setExpandedBook(bookName);
    }
  };

  const handleSelect = (book: BibleBook, chapter: number) => {
    onSelect(book, chapter);
    setIsOpen(false);
  };

  const handleHistoryClick = (item: ReadingHistoryItem) => {
    const book = bibleBooks.find(b => b.name === item.bookName);
    if (book) {
      onSelect(book, item.chapter);
      setIsOpen(false);
    }
  };

  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="w-full mb-2">
      {/* Main Trigger Button - "Most Important" */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300
          ${isOpen
            ? 'bg-bible-gold text-white shadow-lg ring-2 ring-bible-gold/50'
            : 'bg-bible-gold/10 text-bible-accent dark:text-bible-gold hover:bg-bible-gold/20'}
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-full ${isOpen ? 'bg-white/20' : 'bg-bible-gold/20'}`}>
            <BookOpen size={20} />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">Livro Atual</span>
            <span className="font-serif font-bold text-lg leading-none">
              {currentBook.name} <span className="opacity-60 text-sm">{currentChapter}</span>
            </span>
          </div>
        </div>
        <ChevronDown size={20} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown / Popover */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed left-0 md:left-auto md:w-80 w-full z-50 mt-2 bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[70vh] animate-fadeIn"
          style={{
            // Attempt to align with the sidebar if possible, or just float
            // Since we are in a fixed sidebar, fixed positioning works well.
            // We'll use a simple strategy: if mobile, bottom sheet or full width. If desktop, popover.
            // For now, let's just use fixed positioning relative to the trigger if we could, 
            // but simpler is to just be a fixed overlay in the sidebar area.
            // Actually, let's make it absolute relative to the sidebar container if we can, 
            // but the sidebar has overflow-hidden.
            // So fixed is best. We need to calculate position or just center it/put it near the mouse.
            // Let's try a simple "absolute" but assuming the parent has visible overflow? No.
            // Let's use fixed and center it for mobile, or align to sidebar for desktop.
            // Hardcoding left position for now as a safe bet for the sidebar width.
          }}
        >
          {/* Search Header */}
          <div className="p-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/95 backdrop-blur-sm sticky top-0 z-10">
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar livro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm focus:ring-2 focus:ring-bible-gold/50 outline-none transition-all"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex gap-1 p-1 bg-stone-200 dark:bg-stone-800 rounded-lg">
              {(['All', 'Old', 'New'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${filter === f
                    ? 'bg-white dark:bg-stone-700 text-bible-gold shadow-sm'
                    : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                    }`}
                >
                  {f === 'All' ? t.all : f === 'Old' ? 'Antigo' : 'Novo'}
                </button>
              ))}
            </div>
          </div>

          {/* Book List */}
          <div className="overflow-y-auto flex-1 p-2 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-stone-700">
            {/* History in Dropdown */}
            {history.length > 0 && !searchTerm && (
              <div className="mb-4 pb-4 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 flex items-center gap-1">
                    <History size={10} /> Recentes
                  </span>
                  <button onClick={onClearHistory} className="text-[10px] text-red-400 hover:text-red-500">Limpar</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {history.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleHistoryClick(item)}
                      className="text-left p-2 rounded-lg bg-stone-50 dark:bg-stone-800/50 hover:bg-bible-gold/10 border border-transparent hover:border-bible-gold/20 transition-all"
                    >
                      <div className="font-bold text-xs text-stone-700 dark:text-stone-300">{item.bookName}</div>
                      <div className="text-[10px] text-stone-500 flex justify-between">
                        <span>Cap {item.chapter}</span>
                        <span>{getRelativeTime(item.timestamp)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredBooks.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-sm">
                Nenhum livro encontrado
              </div>
            ) : (
              <div className="space-y-1">
                {filteredBooks.map((book) => (
                  <div key={book.name} className="flex flex-col">
                    <button
                      onClick={() => toggleBook(book.name)}
                      className={`
                        flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-colors group
                        ${currentBook.name === book.name
                          ? 'bg-bible-gold/10 text-bible-gold font-bold'
                          : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                          ${book.testament === 'Old' ? 'bg-stone-100 text-stone-500 dark:bg-stone-800' : 'bg-blue-50 text-blue-500 dark:bg-blue-900/20'}
                        `}>
                          {book.testament === 'Old' ? 'AT' : 'NT'}
                        </span>
                        <span>{book.name}</span>
                      </div>
                      {expandedBook === book.name
                        ? <ChevronDown size={14} className="text-bible-gold" />
                        : <ChevronRight size={14} className="opacity-30 group-hover:opacity-100" />
                      }
                    </button>

                    {expandedBook === book.name && (
                      <div className="grid grid-cols-5 gap-1.5 p-2 pl-11 animate-fadeIn">
                        {Array.from({ length: book.chapters }, (_, i) => i + 1).map((chap) => (
                          <button
                            key={chap}
                            onClick={() => handleSelect(book, chap)}
                            className={`
                              h-8 flex items-center justify-center text-xs rounded-lg transition-all border
                              ${currentBook.name === book.name && currentChapter === chap
                                ? 'bg-bible-gold text-white border-bible-gold font-bold shadow-sm'
                                : 'bg-white dark:bg-stone-800 border-stone-100 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-bible-gold hover:text-bible-gold'
                              }
                            `}
                          >
                            {chap}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookSelector;