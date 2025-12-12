import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ChevronDown, ChevronLeft, Menu, Search, X, BookOpen, Sun, Moon, ArrowUp, MessageCircle, Book, Settings, Loader2, Minimize, Maximize, User as UserIcon, AlignJustify, Coffee, Library, Scroll, LogIn, LogOut, UserPlus, Heart, BarChart2 } from 'lucide-react';
import { bibleBooks, translations, findBookByNormalizedName, normalizeBookName, BIBLE_VERSIONS } from './constants';

import { BibleBook, ReadingPreferences, ReadingHistoryItem, BibleVersion, Theme, FavoriteVerse } from './types';
import BookSelector from './components/BookSelector';
import { AdUnit } from './components/AdUnit';
import { AppFooter, CookieBanner, LegalModal } from './components/LegalComponents';
import Footer from './components/Footer';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';

// Pages
// Pages (Lazy Loaded)
const HomePage = React.lazy(() => import('./components/HomePage'));
const ReadingPage = React.lazy(() => import('./pages/ReadingPage'));
const SummaryPage = React.lazy(() => import('./pages/SummaryPage'));
const BookIntroPage = React.lazy(() => import('./pages/BookIntroPage'));
const SearchPage = React.lazy(() => import('./pages/SearchPage'));
const DevotionalPage = React.lazy(() => import('./pages/DevotionalPage'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const BlogPage = React.lazy(() => import('./pages/BlogPage'));
const BlogPostPage = React.lazy(() => import('./pages/BlogPostPage'));
const CategoryPage = React.lazy(() => import('./pages/CategoryPage'));
const TestamentPage = React.lazy(() => import('./pages/TestamentPage'));
const VersesPage = React.lazy(() => import('./pages/VersesPage'));
const HowToReadBiblePage = React.lazy(() => import('./pages/HowToReadBiblePage'));
const BibleFaqPage = React.lazy(() => import('./pages/BibleFaqPage'));

const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'));
const TermsPage = React.lazy(() => import('./pages/TermsPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const SignUpPage = React.lazy(() => import('./pages/SignUpPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const ProgressPage = React.lazy(() => import('./pages/ProgressPage'));



// Admin Components (Lazy Loaded)
const BlogManager = React.lazy(() => import('./components/admin/BlogManager'));
const BlogEditor = React.lazy(() => import('./components/admin/BlogEditor'));
const CategoryList = React.lazy(() => import('./components/admin/CategoryList'));
const UserManager = React.lazy(() => import('./components/admin/UserManager'));
const SettingsManager = React.lazy(() => import('./components/admin/SettingsManager'));
const AISettings = React.lazy(() => import('./components/admin/AISettings'));
const PromptsManager = React.lazy(() => import('./components/admin/PromptsManager'));
const MediaManager = React.lazy(() => import('./components/admin/MediaManager'));
const BibleManager = React.lazy(() => import('./components/admin/BibleManager'));

interface ViewWrapperProps {
  children: React.ReactNode;
  isFullScreen?: boolean;
  theme: 'light' | 'dark' | 'sepia' | 'bw';
}

const ViewWrapper: React.FC<ViewWrapperProps> = ({ children, isFullScreen, theme }) => (
  <div className="flex flex-col min-h-screen">
    <div className="flex-1 w-full">
      {children}
    </div>
    {!isFullScreen && (
      <Footer
        theme={theme}
      />
    )}
  </div>
);

// Redirect Handler Component
const RedirectHandler = () => {
  // Logic for redirects if any (kept minimal as per previous view)
  return null;
};

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Language State
  const [language, setLanguage] = useState<string>('pt');

  useEffect(() => {
    const browserLang = navigator.language.split('-')[0];
    if (['en', 'es'].includes(browserLang)) {
      setLanguage(browserLang);
    } else {
      setLanguage('pt');
    }
  }, []);

  const t = translations[language as keyof typeof translations] || translations.pt;

  // Scroll & Ref State
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Settings State
  const [preferences, setPreferences] = useState<ReadingPreferences>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('readingPreferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { fontSize: 100, ...parsed };
      }
      return { theme: 'light', fontFamily: 'serif', textAlign: 'justify', fontSize: 'normal', voice: 'male' };
    }
    return { theme: 'light', fontFamily: 'serif', textAlign: 'justify', fontSize: 'normal', voice: 'male' };
  });

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Versions Dropdown State
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);

  // Bible Version State (Global)
  const [version, setVersion] = useState<BibleVersion>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bibleVersion') as BibleVersion;
      return (BIBLE_VERSIONS.includes(saved) ? saved : 'acf') as BibleVersion;
    }
    return 'acf';
  });

  useEffect(() => {
    localStorage.setItem('bibleVersion', version);
  }, [version]);

  // History State
  const [history, setHistory] = useState<ReadingHistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('readingHistory');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Favorites State
  const [favorites, setFavorites] = useState<FavoriteVerse[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_favorites');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Save Favorites
  useEffect(() => {
    localStorage.setItem('user_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (verse: FavoriteVerse) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === verse.id);
      if (exists) {
        return prev.filter(f => f.id !== verse.id);
      }
      return [verse, ...prev];
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Apply Theme & Save Preferences
  useEffect(() => {
    // Apply visual theme immediately
    if (preferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Debounce storage save to prevent stuttering during slider interactions
    const timeoutId = setTimeout(() => {
      localStorage.setItem('readingPreferences', JSON.stringify(preferences));
      localStorage.setItem('theme', preferences.theme === 'dark' ? 'dark' : 'light');
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [preferences]);

  // Save History
  useEffect(() => {
    localStorage.setItem('readingHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const mainContainer = mainScrollRef.current;
    if (!mainContainer) return;

    const handleScroll = () => {
      if (mainContainer.scrollTop > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    mainContainer.addEventListener('scroll', handleScroll);
    return () => mainContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset sidebar state on close
  useEffect(() => {
    if (!sidebarOpen) {
      setIsVersionsOpen(false);
    }
  }, [sidebarOpen]);

  // Reset scroll on route change
  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setSidebarOpen(false); // Close sidebar on route change

    // Check for login request from state
    if (location.state && (location.state as any).openLogin) {
      setIsLoginModalOpen(true);
      // Optional: Clear state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state]);

  const scrollToTop = () => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTheme = () => {
    setPreferences(prev => {
      const nextTheme = prev.theme === 'light' ? 'dark' : prev.theme === 'dark' ? 'bw' : 'light';
      return { ...prev, theme: nextTheme };
    });
  };

  /* Legal Modal Logic Removed - Using Routes Now */

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim();

    // Check for "Book Chapter" pattern
    const match = query.match(/^([a-zA-Z\u00C0-\u00FF\s]+)\s+(\d+)$/);
    if (match) {
      const bookName = match[1].trim();
      const chapter = parseInt(match[2]);
      const foundBook = bibleBooks.find(b =>
        normalizeBookName(b.name) === normalizeBookName(bookName) ||
        b.name.toLowerCase() === bookName.toLowerCase()
      );

      if (foundBook && chapter >= 1 && chapter <= foundBook.chapters) {
        navigate(`/leitura/${normalizeBookName(foundBook.name)}/${chapter}`);
        setSidebarOpen(false);
        return;
      }
    }

    navigate(`/busca?q=${encodeURIComponent(query)}`);
    setSidebarOpen(false);
  };

  const navigateToBook = (book: BibleBook, chapter: number) => {
    const normalized = normalizeBookName(book.name);
    navigate(`/leitura/${normalized}/${chapter}`);
    setSidebarOpen(false);
  };

  const addToHistory = (bookName: string, chapter: number) => {
    setHistory(prev => {
      const filtered = prev.filter(h => !(h.bookName === bookName && h.chapter === chapter));
      const newItem: ReadingHistoryItem = {
        bookName: bookName,
        chapter: chapter,
        timestamp: Date.now()
      };
      return [newItem, ...filtered].slice(0, 4);
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('readingHistory');
  };

  const getMainBackgroundClass = () => {
    switch (preferences.theme) {
      case 'sepia': return 'bg-[#f4ecd8] text-[#5c4b37]';
      case 'dark': return 'bg-stone-950 text-stone-200';
      case 'bw': return 'bg-white text-black';
      default: return 'bg-bible-paper text-bible-text';
    }
  };

  // Determine current book/chapter for BookSelector based on URL
  const match = location.pathname.match(/\/leitura\/([^\/]+)\/(\d+)/);
  const introMatch = location.pathname.match(/\/leitura\/([^\/]+)$/);

  let currentBook = bibleBooks[0];
  let currentChapter = 1;

  if (match) {
    const bookName = decodeURIComponent(match[1]);
    const chapter = parseInt(match[2], 10);
    const foundBook = findBookByNormalizedName(bookName);
    if (foundBook) {
      currentBook = foundBook;
      currentChapter = chapter;
    }
  } else if (introMatch) {
    const bookName = decodeURIComponent(introMatch[1]);
    const foundBook = findBookByNormalizedName(bookName);
    if (foundBook) {
      currentBook = foundBook;
      currentChapter = 0;
    }
  }

  return (
    <div className={`h-[100dvh] font-sans flex flex-col overflow-hidden transition-colors duration-300 ${getMainBackgroundClass()}`}>
      <RedirectHandler />



      {/* Unified Main Header (Mobile & Desktop) */}
      {!isFullScreen && (
        <div className={`flex items-center justify-between px-4 py-3 border-b sticky top-0 z-30 transition-colors
          ${preferences.theme === 'sepia' ? 'bg-[#f4ecd8] border-[#e6dcc6]' : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'}`}>
          {/* Left: Menu */}
          {/* Left: Menu */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg border shadow-sm transition-all
              ${preferences.theme === 'bw'
                ? 'bg-white border-stone-200 text-black hover:bg-stone-50'
                : preferences.theme === 'sepia'
                  ? 'bg-[#fffbf0] border-[#d6cba6] text-[#5c4b37]'
                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
              }`}
          >
            <Menu size={20} />
          </button>

          {/* Center: Logo */}
          <div className="flex items-center justify-center cursor-pointer" onClick={() => navigate('/')}>
            <BookOpen className={`w-8 h-8 ${preferences.theme === 'bw' ? 'text-black' : 'text-bible-gold'}`} />
          </div>

          {/* Right: Book Access */}
          <div className="flex items-center gap-1">
            <BookSelector
              currentBook={currentBook}
              currentChapter={currentChapter}
              history={history}
              onSelect={navigateToBook}
              onClearHistory={clearHistory}
              t={t}
              theme={preferences.theme}
              customTrigger={(toggle) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    toggle();
                  }}
                  className={`p-2 rounded-lg border shadow-sm transition-all
                    ${preferences.theme === 'bw'
                      ? 'bg-white border-stone-200 text-black hover:bg-stone-50'
                      : preferences.theme === 'sepia'
                        ? 'bg-[#fffbf0] border-[#d6cba6] text-[#5c4b37]'
                        : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                >
                  <Scroll size={20} />
                </button>
              )}
            />
          </div>
        </div>
      )
      }

      {/* Sidebar Navigation */}
      {/* Mobile Backdrop - Now for All Screens */}
      {
        sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 animate-fadeIn"
            onClick={() => setSidebarOpen(false)}
          />
        )
      }

      {
        !isFullScreen && (

          <aside className={`
          fixed inset-y-0 left-0 z-50 border-r transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
          ${preferences.theme === 'bw'
              ? 'bg-white border-stone-200 text-black'
              : preferences.theme === 'sepia'
                ? 'bg-[#f4ecd8] border-[#e6dcc6] text-[#5c4b37]'
                : 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-300'}
          ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'}
        `}>
            {/* Sidebar Header (Unified) */}
            <div className={`p-3 border-b flex items-center justify-between
            ${preferences.theme === 'bw' ? 'border-stone-200 bg-white' : preferences.theme === 'sepia' ? 'border-[#e6dcc6] bg-[#f4ecd8]' : 'border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-950'}`}>
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                <div className={`p-1.5 rounded-lg flex items-center justify-center
                ${preferences.theme === 'bw' ? 'bg-black text-white' : 'bg-bible-gold text-white'}`}>
                  <BookOpen size={18} />
                </div>
                <h2 className={`font-serif text-lg font-bold
                ${preferences.theme === 'bw' ? 'text-black' : 'text-stone-800 dark:text-stone-100'}`}>
                  {t.appTitle}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 transition-colors"
                  title="Alternar Tema"
                >
                  {preferences.theme === 'light' ? <Moon size={16} /> : preferences.theme === 'dark' ? <Sun size={16} /> : <Coffee size={16} />}
                </button>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-3">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  className={`w-full pl-9 pr-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-colors
                  ${preferences.theme === 'bw'
                      ? 'bg-white border-stone-200 focus:ring-black/20 text-black placeholder-stone-500'
                      : preferences.theme === 'sepia'
                        ? 'bg-[#efebd6] border-[#d6cba6] placeholder-[#8c7b64] focus:ring-bible-gold/50'
                        : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 dark:placeholder-stone-500 focus:ring-bible-gold/50'}
                `}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-2.5 top-2 text-stone-400 w-4 h-4" />
              </form>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-4 scrollbar-thin scrollbar-thumb-stone-200 dark:scrollbar-thumb-stone-800">

              {/* Section 1: Navigation */}
              <div className="space-y-0.5">
                <h3 className={`px-3 text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70 ${preferences.theme === 'bw' ? 'text-stone-500' : 'text-stone-400'}`}>
                  Principal
                </h3>

                <button
                  onClick={() => { navigate('/'); setSidebarOpen(false); setIsVersionsOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium
                  ${location.pathname === '/' && !isVersionsOpen
                      ? (preferences.theme === 'bw' ? 'bg-black text-white' : 'bg-bible-gold/10 dark:bg-bible-gold/10 text-bible-accent dark:text-bible-gold')
                      : 'text-stone-600 dark:text-stone-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  <BookOpen size={16} />
                  Início
                </button>

                <button
                  onClick={() => { navigate('/chat'); setSidebarOpen(false); setIsVersionsOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium
                  ${location.pathname === '/chat' && !isVersionsOpen
                      ? (preferences.theme === 'bw' ? 'bg-black text-white' : 'bg-bible-gold/10 dark:bg-bible-gold/10 text-bible-accent dark:text-bible-gold')
                      : 'text-stone-600 dark:text-stone-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  <MessageCircle size={16} />
                  {t.chat}
                </button>

                <button
                  onClick={() => { navigate('/devocional'); setSidebarOpen(false); setIsVersionsOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium
                  ${location.pathname === '/devocional' && !isVersionsOpen
                      ? (preferences.theme === 'bw' ? 'bg-black text-white' : 'bg-bible-gold/10 dark:bg-bible-gold/10 text-bible-accent dark:text-bible-gold')
                      : 'text-stone-600 dark:text-stone-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  <Sun size={16} />
                  {t.devotional}
                </button>
              </div>

              {/* Section 2: User Area */}
              <div className="space-y-0.5">
                <h3 className={`px-3 text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70 ${preferences.theme === 'bw' ? 'text-stone-500' : 'text-stone-400'}`}>
                  Sua Área
                </h3>

                {user ? (
                  <>
                    <button
                      onClick={() => { /* Navigate to Favorites */ setSidebarOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <Heart size={16} />
                      Meus Favoritos
                    </button>
                    <button
                      onClick={() => { navigate('/progresso'); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium
                        ${location.pathname === '/progresso'
                          ? (preferences.theme === 'bw' ? 'bg-black text-white' : 'bg-bible-gold/10 dark:bg-bible-gold/10 text-bible-accent dark:text-bible-gold')
                          : 'text-stone-600 dark:text-stone-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                      <BarChart2 size={16} />
                      Meu Progresso
                    </button>

                    {/* Favorites Section */}
                    <div className="pt-2">
                      <h3 className={`px-3 text-[10px] font-bold uppercase tracking-widest mb-2 opacity-70 flex items-center gap-1 ${preferences.theme === 'bw' ? 'text-stone-500' : 'text-stone-400'}`}>
                        <Heart size={10} className="fill-current" /> Favoritos
                      </h3>
                      {favorites.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-stone-500 italic">
                          Nenhum versículo salvo ainda.
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {favorites.map(fav => (
                            <button
                              key={fav.id}
                              onClick={() => {
                                navigate(`/leitura/${normalizeBookName(fav.book)}/${fav.chapter}?verses=${fav.verse}`);
                                setSidebarOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg transition-colors group
                                  ${preferences.theme === 'bw' ? 'hover:bg-stone-50' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                              <div className={`text-xs font-bold mb-0.5 ${preferences.theme === 'bw' ? 'text-black' : 'text-stone-700 dark:text-stone-300'}`}>
                                {fav.book} {fav.chapter}:{fav.verse}
                              </div>
                              <div className="text-[10px] text-stone-500 line-clamp-1 opacity-80">
                                {fav.text}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>

                ) : (
                  <div className="mx-2 px-3 py-2 bg-stone-50/50 dark:bg-stone-800/30 rounded-lg border border-stone-100 dark:border-stone-800">
                    <p className="text-[10px] text-stone-500 dark:text-stone-500 mb-2 leading-relaxed">Faça login para salvar seu progresso e favoritos.</p>
                    <button
                      onClick={() => { navigate('/login'); setSidebarOpen(false); }}
                      className="text-xs font-bold text-bible-accent dark:text-bible-gold hover:underline"
                    >
                      Entrar agora
                    </button>
                  </div>

                )}
              </div>


              {/* Section 3: Tools/Settings (Implicit) */}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-0.5">
                <button
                  onClick={() => { setIsFullScreen(!isFullScreen); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium
                  ${isFullScreen
                      ? (preferences.theme === 'bw' ? 'bg-black text-white' : 'bg-bible-gold/10 dark:bg-bible-gold/10 text-bible-accent dark:text-bible-gold')
                      : 'text-stone-600 dark:text-stone-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
                  {isFullScreen ? t.exitFullScreen : t.fullScreen}
                </button>

                <button
                  onClick={() => { setSettingsModalOpen(true); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <Settings size={16} />
                  {t.settings}
                </button>
              </div>

            </nav>
            {/* Sidebar Footer - Auth Actions */}
            <div className={`p-3 border-t space-y-2
              ${preferences.theme === 'bw' ? 'border-stone-200 bg-stone-50' : preferences.theme === 'sepia' ? 'border-[#e0d6b6] bg-[#f4ecd8]' : 'border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950'}`}>

              {user ? (
                // LOGGED IN STATE
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-sm">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-bible-gold/30" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-bible-gold/20 flex items-center justify-center text-bible-gold">
                      <UserIcon size={16} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold truncate ${preferences.theme === 'bw' ? 'text-black' : 'text-stone-800 dark:text-stone-200'}`}>
                      {user.name}
                    </div>
                    <button
                      onClick={() => setUser(null)}
                      className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-1 mt-0.5"
                    >
                      <LogOut size={10} /> Sair
                    </button>
                  </div>
                </div>
              ) : (
                // LOGGED OUT STATE
                <>
                  <button
                    onClick={() => { navigate('/login'); setSidebarOpen(false); }}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors shadow-sm
                      ${preferences.theme === 'bw'
                        ? 'bg-white text-black border-stone-300 hover:bg-stone-50'
                        : isFullScreen
                          ? 'bg-white text-stone-700 border-stone-200'
                          : preferences.theme === 'dark'
                            ? 'bg-transparent text-stone-300 border-stone-700 hover:border-bible-gold/50'
                            : 'bg-white text-stone-700 border-stone-200 hover:border-bible-gold/50'
                      }`}
                  >
                    <LogIn size={16} />
                    Login
                  </button>

                  <button
                    onClick={() => { navigate('/cadastro'); setSidebarOpen(false); }}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm
                      ${preferences.theme === 'bw'
                        ? 'bg-black text-white hover:bg-stone-800'
                        : preferences.theme === 'sepia'
                          ? 'bg-[#5c4b37] text-[#f4ecd8] hover:bg-[#4a3b2a]'
                          : 'bg-stone-900 dark:bg-bible-gold text-white hover:opacity-90'
                      }`}
                  >
                    <UserPlus size={16} />
                    Cadastre-se
                  </button>
                </>
              )}
            </div>


          </aside>
        )
      }

      <main
        ref={mainScrollRef}
        className={`flex-1 overflow-y-auto relative scroll-smooth ${getMainBackgroundClass()}
          ${isFullScreen ? 'h-full' : ''}`}
      >
        <React.Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-bible-gold" size={48} />
          </div>
        }>
          <Routes>
            <Route path="/" element={
              <ViewWrapper isFullScreen={isFullScreen} theme={preferences.theme}>
                <HomePage language={language} t={t} theme={preferences.theme} history={history} />
              </ViewWrapper>
            } />

            <Route path="/antigo-testamento" element={
              <ViewWrapper isFullScreen={isFullScreen} theme={preferences.theme}>
                <TestamentPage testament="Old" language={language} t={t} theme={preferences.theme} />
              </ViewWrapper>
            } />

            <Route path="/versiculos" element={
              <ViewWrapper isFullScreen={isFullScreen} theme={preferences.theme}>
                <VersesPage theme={preferences.theme} />
              </ViewWrapper>
            } />

            <Route path="/como-ler-biblia" element={
              <ViewWrapper isFullScreen={isFullScreen} theme={preferences.theme}>
                <HowToReadBiblePage theme={preferences.theme} />
              </ViewWrapper>
            } />

            <Route path="/faq-biblia" element={
              <ViewWrapper isFullScreen={isFullScreen} theme={preferences.theme}>
                <BibleFaqPage theme={preferences.theme} />
              </ViewWrapper>
            } />

            <Route path="/privacidade" element={
              <ViewWrapper isFullScreen={isFullScreen} theme={preferences.theme}>
                <PrivacyPage theme={preferences.theme} />
              </ViewWrapper>
            } />

            <Route path="/termos" element={
              <ViewWrapper isFullScreen={isFullScreen} theme={preferences.theme}>
                <TermsPage theme={preferences.theme} />
              </ViewWrapper>
            } />

            <Route path="/contato" element={
              <ViewWrapper isFullScreen={isFullScreen} theme={preferences.theme}>
                <ContactPage theme={preferences.theme} />
              </ViewWrapper>
            } />

            <Route path="/novo-testamento" element={
              <ViewWrapper isFullScreen={isFullScreen} theme={preferences.theme}>
                <TestamentPage testament="New" language={language} t={t} theme={preferences.theme} />
              </ViewWrapper>
            } />

            <Route path="/leitura/:bookAbbrev" element={
              <ViewWrapper isFullScreen={isFullScreen} theme={preferences.theme}>
                <BookIntroPage language={language} t={t} preferences={preferences} />
              </ViewWrapper>
            } />

            <Route path="/leitura/:bookAbbrev/:chapterNum" element={
              <ViewWrapper isFullScreen={isFullScreen} theme={preferences.theme}>
                <ReadingPage
                  key={location.pathname}
                  language={language}
                  t={t}
                  preferences={preferences}
                  version={version}
                  isFullScreen={isFullScreen}
                  setIsFullScreen={setIsFullScreen}
                  addToHistory={addToHistory}
                  onUpdatePreferences={setPreferences}
                  user={user}
                  setUser={setUser}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                />
              </ViewWrapper>
            } />

            <Route path="/resumo/:bookAbbrev/:chapterNum" element={
              <ViewWrapper isFullScreen={isFullScreen} theme={preferences.theme}>
                <SummaryPage
                  language={language}
                  t={t}
                  preferences={preferences}
                  onUpdatePreferences={setPreferences}
                  isFullScreen={isFullScreen}
                  setIsFullScreen={setIsFullScreen}
                  addToHistory={addToHistory}
                />
              </ViewWrapper>
            } />

            <Route path="/busca" element={
              <ViewWrapper isFullScreen={isFullScreen} theme={preferences.theme}>
                <SearchPage language={language} t={t} preferences={preferences} />
              </ViewWrapper>
            } />

            <Route path="/devocional" element={
              <ViewWrapper isFullScreen={isFullScreen} theme={preferences.theme}>
                <DevotionalPage language={language} t={t} preferences={preferences} />
              </ViewWrapper>
            } />

            <Route path="/chat" element={
              <div className="h-full flex flex-col overflow-hidden">
                <ChatPage language={language} t={t} preferences={preferences} />
              </div>
            } />

            <Route path="/blog" element={
              <ViewWrapper isFullScreen={isFullScreen} theme={preferences.theme}>
                <BlogPage theme={preferences.theme} />
              </ViewWrapper>
            } />

            <Route path="/signup" element={
              <ViewWrapper isFullScreen={isFullScreen} theme={preferences.theme}>
                <SignUpPage theme={preferences.theme} t={translations[language]} onLoginSuccess={(u) => { setUser(u); navigate('/'); }} />
              </ViewWrapper>
            } />

            <Route path="/cadastro" element={
              <ViewWrapper isFullScreen={isFullScreen} theme={preferences.theme}>
                <SignUpPage theme={preferences.theme} t={translations[language]} onLoginSuccess={(u) => { setUser(u); navigate('/'); }} />
              </ViewWrapper>
            } />

            <Route path="/login" element={
              <ViewWrapper isFullScreen={isFullScreen} theme={preferences.theme}>
                <LoginPage theme={preferences.theme} onLoginSuccess={(u) => { setUser(u); }} />
              </ViewWrapper>
            } />


            <Route path="/blog/:slug" element={
              <ViewWrapper isFullScreen={isFullScreen} theme={preferences.theme}>
                <BlogPostPage />
              </ViewWrapper>
            } />

            <Route path="/progresso" element={
              <ViewWrapper isFullScreen={isFullScreen} theme={preferences.theme}>
                <ProgressPage user={user} theme={preferences.theme} />
              </ViewWrapper>
            } />


            <Route path="/admin" element={<AdminPage t={t} isDark={preferences.theme === 'dark'} />}>
              <Route index element={<div className="p-8 text-center text-stone-500">Selecione uma opção no menu lateral.</div>} />
              <Route path="posts" element={<BlogManager />} />
              <Route path="posts/new" element={<BlogEditor />} />
              <Route path="posts/edit/:slug" element={<BlogEditor />} />
              <Route path="categories" element={<CategoryList />} />
              <Route path="users" element={<UserManager />} />
              <Route path="settings" element={<SettingsManager />} />
              <Route path="ai-settings" element={<AISettings />} />
              <Route path="prompts" element={<PromptsManager />} />
              <Route path="media" element={<MediaManager />} />
              <Route path="bible" element={<BibleManager />} />
            </Route>

            {/* Dynamic Routes - MUST BE LAST */}
            <Route path="/:category" element={
              <ViewWrapper onOpenPrivacy={() => navigate('/privacidade')} onOpenTerms={() => navigate('/termos')} isFullScreen={isFullScreen} theme={preferences.theme}>
                <CategoryPage />
              </ViewWrapper>
            } />

            <Route path="/:category/:slug" element={
              <ViewWrapper onOpenPrivacy={() => navigate('/privacidade')} onOpenTerms={() => navigate('/termos')} isFullScreen={isFullScreen} theme={preferences.theme}>
                <BlogPostPage />
              </ViewWrapper>
            } />
          </Routes>
        </React.Suspense>

        {/* Floating Controls */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
          {isFullScreen && (
            <button
              onClick={() => setIsFullScreen(false)}
              className="p-3 bg-stone-900/50 hover:bg-stone-900 text-white rounded-full backdrop-blur-sm transition-all shadow-lg animate-fadeIn"
              title={t.exitFullScreen}
            >
              <Minimize size={24} />
            </button>
          )}

          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className={`p-3 rounded-full shadow-lg transition-all duration-300 animate-fadeIn
                ${preferences.theme === 'bw'
                  ? 'bg-black text-white hover:bg-stone-800 border border-stone-700'
                  : preferences.theme === 'sepia'
                    ? 'bg-[#5c4b37] text-[#f4ecd8] hover:bg-[#4a3b2a] border border-[#4a3b2a]'
                    : 'bg-bible-gold hover:bg-yellow-600 text-white shadow-bible-gold/30'
                }`}
              aria-label="Voltar ao topo"
            >
              <ArrowUp size={24} />
            </button>
          )}
        </div>
      </main>

      <CookieBanner onOpenPrivacy={() => navigate('/privacidade')} />
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        preferences={preferences}
        onUpdate={setPreferences}
        isFullScreen={isFullScreen}
        onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
        t={t}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(u) => setUser(u)}
        t={t}
      />
    </div >
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </HelmetProvider>
  );
}