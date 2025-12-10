import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Book, Menu, MessageCircle, Search, Sun, Moon, X, BookOpen, Settings, ArrowUp, Minimize, ChevronLeft, ChevronRight, ChevronDown, User as UserIcon } from 'lucide-react';
import { bibleBooks, translations, findBookByNormalizedName, normalizeBookName } from './constants';

import { BibleBook, ReadingPreferences, ReadingHistoryItem, BibleVersion } from './types';
import BookSelector from './components/BookSelector';
import { AdUnit } from './components/AdUnit';
import { AppFooter, CookieBanner, LegalModal } from './components/LegalComponents';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';

// Pages
import HomePage from './components/HomePage';
import ReadingPage from './pages/ReadingPage';
import SummaryPage from './pages/SummaryPage';
import BookIntroPage from './pages/BookIntroPage';
import SearchPage from './pages/SearchPage';
import DevotionalPage from './pages/DevotionalPage';
import ChatPage from './pages/ChatPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import CategoryPage from './pages/CategoryPage';
import TestamentPage from './pages/TestamentPage';
import VersesPage from './pages/VersesPage';
import HowToReadBiblePage from './pages/HowToReadBiblePage';
import BibleFaqPage from './pages/BibleFaqPage';
import AdminPage from './pages/AdminPage';

// Admin Components
import BlogManager from './components/admin/BlogManager';
import BlogEditor from './components/admin/BlogEditor';
import CategoryList from './components/admin/CategoryList';
import UserManager from './components/admin/UserManager';
import SettingsManager from './components/admin/SettingsManager';
import AISettings from './components/admin/AISettings';
import PromptsManager from './components/admin/PromptsManager';
import MediaManager from './components/admin/MediaManager';
import BibleManager from './components/admin/BibleManager';

interface ViewWrapperProps {
  children: React.ReactNode;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  isFullScreen?: boolean;
}

const ViewWrapper: React.FC<ViewWrapperProps> = ({ children, onOpenPrivacy, onOpenTerms, isFullScreen }) => (
  <div className="flex flex-col min-h-full">
    <div className="flex-1 w-full">
      {children}
    </div>
    {!isFullScreen && (
      <AppFooter
        onOpenPrivacy={onOpenPrivacy}
        onOpenTerms={onOpenTerms}
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
      const saved = localStorage.getItem('bibleVersion');
      return (['acf', 'nvi', 'ntlh'].includes(saved || '') ? saved : 'nvi') as BibleVersion;
    }
    return 'nvi';
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

  // Legal Modal State
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Apply Theme & Save Preferences
  useEffect(() => {
    if (preferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('readingPreferences', JSON.stringify(preferences));
    localStorage.setItem('theme', preferences.theme === 'dark' ? 'dark' : 'light');
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

  // Reset scroll on route change
  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setSidebarOpen(false);
  }, [location.pathname]);

  const scrollToTop = () => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTheme = () => {
    setPreferences(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  };

  const openLegalModal = (type: 'privacy' | 'terms') => {
    setLegalModalType(type);
    setLegalModalOpen(true);
  };

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
    <div className={`min-h-screen font-sans flex flex-col md:flex-row overflow-hidden transition-colors duration-300 ${getMainBackgroundClass()}`}>
      <RedirectHandler />

      {/* Desktop Open Sidebar Button */}
      {!desktopSidebarOpen && !isFullScreen && (
        <button
          onClick={() => setDesktopSidebarOpen(true)}
          className="hidden md:flex fixed top-4 left-4 z-30 p-2 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-bible-gold rounded-full shadow-md transition-all duration-300 animate-fadeIn items-center justify-center border border-stone-200 dark:border-stone-700"
          title="Expandir Menu"
        >
          <Menu size={20} />
        </button>
      )}

      {/* User Login Button */}
      {!isFullScreen && (
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="hidden md:flex fixed top-4 right-4 z-30 p-2 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-bible-gold rounded-full shadow-md transition-all duration-300 animate-fadeIn items-center justify-center border border-stone-200 dark:border-stone-700"
          title={user ? "Minha Conta" : "Entrar"}
        >
          {user ? (
            user.picture ? <img src={user.picture} alt={user.name} className="w-5 h-5 rounded-full" /> : <UserIcon size={20} />
          ) : (
            <UserIcon size={20} />
          )}
        </button>
      )}

      {/* Mobile Header */}
      {!isFullScreen && (
        <div className={`md:hidden flex items-center justify-between p-4 border-b sticky top-0 z-30 transition-colors
          ${preferences.theme === 'sepia' ? 'bg-[#f4ecd8] border-[#e6dcc6]' : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'}`}>
          <div className="flex items-center gap-2" onClick={() => navigate('/')}>
            <BookOpen className="w-6 h-6 text-bible-accent dark:text-bible-gold" />
            <span className="font-serif font-bold text-xl text-bible-accent dark:text-bible-gold">{t.appTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              {preferences.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
              {sidebarOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      {/* Mobile Backdrop */}
      {sidebarOpen && !desktopSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-fadeIn"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {!isFullScreen && (
        <aside className={`
          fixed inset-y-0 left-0 z-50 border-r transform transition-all duration-300 ease-in-out flex flex-col
          ${preferences.theme === 'sepia'
            ? 'bg-[#efebd6] border-[#e6dcc6]'
            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'}
          ${sidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-80'}
          md:relative md:translate-x-0 
          ${desktopSidebarOpen ? 'md:w-80' : 'md:w-0 md:overflow-hidden md:border-none'}
        `}>
          <div className={`p-6 border-b hidden md:flex items-center justify-between
            ${preferences.theme === 'sepia' ? 'border-[#e6dcc6]' : 'border-stone-100 dark:border-stone-800'}`}>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 rounded-full bg-bible-gold/20 flex items-center justify-center text-bible-accent dark:text-bible-gold">
                <BookOpen size={18} />
              </div>
              <h1 className="font-serif text-2xl font-bold text-bible-accent dark:text-bible-gold">{t.appTitle}</h1>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 transition-colors"
                title="Alternar Tema"
              >
                {preferences.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={() => setDesktopSidebarOpen(false)}
                className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 transition-colors"
                title="Recolher Menu"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>

          {/* Mobile Sidebar Header */}
          <div className={`p-4 border-b flex md:hidden items-center justify-between
            ${preferences.theme === 'sepia' ? 'border-[#e6dcc6]' : 'border-stone-100 dark:border-stone-800'}`}>
            <h2 className="font-serif text-xl font-bold text-bible-accent dark:text-bible-gold">{t.appTitle}</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-bible-gold/50 text-sm transition-colors
                  ${preferences.theme === 'sepia'
                    ? 'bg-white/60 border-[#d6cba6] placeholder-[#8c7b64]'
                    : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 dark:placeholder-stone-500'}
                `}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-stone-400 w-4 h-4" />
            </form>
          </div>

          <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin scrollbar-thumb-stone-200 dark:scrollbar-thumb-stone-700">
            <BookSelector
              currentBook={currentBook}
              currentChapter={currentChapter}
              history={history}
              onSelect={navigateToBook}
              onClearHistory={clearHistory}
              t={t}
            />

            <div className="h-px bg-stone-100 dark:bg-stone-800 my-2 mx-2" />



            <div className="h-px bg-stone-100 dark:bg-stone-800 my-2 mx-2" />

            <button
              onClick={() => { navigate('/'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors 
                ${location.pathname === '/'
                  ? 'bg-bible-gold/10 dark:bg-bible-gold/20 text-bible-accent dark:text-bible-gold font-medium'
                  : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100'}`}
            >
              <BookOpen size={20} />
              Início
            </button>

            <button
              onClick={() => { navigate('/devocional'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors 
                ${location.pathname === '/devocional'
                  ? 'bg-bible-gold/10 dark:bg-bible-gold/20 text-bible-accent dark:text-bible-gold font-medium'
                  : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100'}`}
            >
              <Sun size={20} />
              {t.devotional}
            </button>
            <button
              onClick={() => { navigate('/chat'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors 
                ${location.pathname === '/chat'
                  ? 'bg-bible-gold/10 dark:bg-bible-gold/20 text-bible-accent dark:text-bible-gold font-medium'
                  : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100'}`}
            >
              <MessageCircle size={20} />
              {t.chat}
            </button>

            {/* Bible Versions Dropdown */}
            <div className="w-full">
              <button
                onClick={() => setIsVersionsOpen(!isVersionsOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors
                  ${isVersionsOpen ? 'bg-black/5 dark:bg-white/5' : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100'}`}
              >
                <div className="flex items-center gap-3">
                  <Book size={20} />
                  <span>Versões da Bíblia</span>
                </div>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isVersionsOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isVersionsOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pl-11 pr-4 py-2 space-y-1">
                  <button
                    onClick={() => { setVersion('nvi'); setSidebarOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${version === 'nvi' ? 'bg-bible-gold/10 text-bible-accent dark:text-bible-gold font-medium' : 'text-stone-600 dark:text-stone-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    Nova Versão Internacional (NVI)
                  </button>
                  <button
                    onClick={() => { setVersion('acf'); setSidebarOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${version === 'acf' ? 'bg-bible-gold/10 text-bible-accent dark:text-bible-gold font-medium' : 'text-stone-600 dark:text-stone-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    Almeida Corrigida Fiel (ACF)
                  </button>
                  <button
                    onClick={() => { setVersion('ntlh'); setSidebarOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${version === 'ntlh' ? 'bg-bible-gold/10 text-bible-accent dark:text-bible-gold font-medium' : 'text-stone-600 dark:text-stone-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                  >
                    Nova Tradução na Linguagem de Hoje (NTLH)
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => { setSettingsModalOpen(true); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100"
            >
              <Settings size={20} />
              {t.settings}
            </button>
          </nav>

          <div className="px-4 pb-4 space-y-4">
            <AdUnit className="mt-2 scale-90 origin-bottom" label="Publicidade" />
          </div>
        </aside>
      )}

      <main
        ref={mainScrollRef}
        className={`flex-1 overflow-y-auto relative scroll-smooth ${getMainBackgroundClass()}
          ${isFullScreen ? 'h-screen' : 'h-[calc(100vh-65px)] md:h-screen'}`}
      >
        <Routes>
          <Route path="/" element={
            <ViewWrapper onOpenPrivacy={() => openLegalModal('privacy')} onOpenTerms={() => openLegalModal('terms')} isFullScreen={isFullScreen}>
              <HomePage language={language} t={t} isDark={preferences.theme === 'dark'} history={history} />
            </ViewWrapper>
          } />

          <Route path="/antigo-testamento" element={
            <ViewWrapper onOpenPrivacy={() => openLegalModal('privacy')} onOpenTerms={() => openLegalModal('terms')} isFullScreen={isFullScreen}>
              <TestamentPage testament="Old" language={language} t={t} />
            </ViewWrapper>
          } />

          <Route path="/versiculos" element={
            <ViewWrapper onOpenPrivacy={() => openLegalModal('privacy')} onOpenTerms={() => openLegalModal('terms')} isFullScreen={isFullScreen}>
              <VersesPage />
            </ViewWrapper>
          } />

          <Route path="/como-ler-biblia" element={
            <ViewWrapper onOpenPrivacy={() => openLegalModal('privacy')} onOpenTerms={() => openLegalModal('terms')} isFullScreen={isFullScreen}>
              <HowToReadBiblePage />
            </ViewWrapper>
          } />

          <Route path="/faq-biblia" element={
            <ViewWrapper onOpenPrivacy={() => openLegalModal('privacy')} onOpenTerms={() => openLegalModal('terms')} isFullScreen={isFullScreen}>
              <BibleFaqPage />
            </ViewWrapper>
          } />

          <Route path="/novo-testamento" element={
            <ViewWrapper onOpenPrivacy={() => openLegalModal('privacy')} onOpenTerms={() => openLegalModal('terms')} isFullScreen={isFullScreen}>
              <TestamentPage testament="New" language={language} t={t} />
            </ViewWrapper>
          } />

          <Route path="/leitura/:bookAbbrev" element={
            <ViewWrapper onOpenPrivacy={() => openLegalModal('privacy')} onOpenTerms={() => openLegalModal('terms')} isFullScreen={isFullScreen}>
              <BookIntroPage language={language} t={t} />
            </ViewWrapper>
          } />

          <Route path="/leitura/:bookAbbrev/:chapterNum" element={
            <ViewWrapper onOpenPrivacy={() => openLegalModal('privacy')} onOpenTerms={() => openLegalModal('terms')} isFullScreen={isFullScreen}>
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
              />
            </ViewWrapper>
          } />

          <Route path="/resumo/:bookAbbrev/:chapterNum" element={
            <ViewWrapper onOpenPrivacy={() => openLegalModal('privacy')} onOpenTerms={() => openLegalModal('terms')} isFullScreen={isFullScreen}>
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
            <ViewWrapper onOpenPrivacy={() => openLegalModal('privacy')} onOpenTerms={() => openLegalModal('terms')} isFullScreen={isFullScreen}>
              <SearchPage language={language} t={t} preferences={preferences} />
            </ViewWrapper>
          } />

          <Route path="/devocional" element={
            <ViewWrapper onOpenPrivacy={() => openLegalModal('privacy')} onOpenTerms={() => openLegalModal('terms')} isFullScreen={isFullScreen}>
              <DevotionalPage language={language} t={t} preferences={preferences} />
            </ViewWrapper>
          } />

          <Route path="/chat" element={
            <div className="h-full flex flex-col overflow-hidden">
              <ChatPage language={language} t={t} />
            </div>
          } />

          <Route path="/blog" element={
            <ViewWrapper onOpenPrivacy={() => openLegalModal('privacy')} onOpenTerms={() => openLegalModal('terms')} isFullScreen={isFullScreen}>
              <BlogPage />
            </ViewWrapper>
          } />

          <Route path="/blog/:slug" element={
            <ViewWrapper onOpenPrivacy={() => openLegalModal('privacy')} onOpenTerms={() => openLegalModal('terms')} isFullScreen={isFullScreen}>
              <BlogPostPage />
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
            <ViewWrapper onOpenPrivacy={() => openLegalModal('privacy')} onOpenTerms={() => openLegalModal('terms')} isFullScreen={isFullScreen}>
              <CategoryPage />
            </ViewWrapper>
          } />

          <Route path="/:category/:slug" element={
            <ViewWrapper onOpenPrivacy={() => openLegalModal('privacy')} onOpenTerms={() => openLegalModal('terms')} isFullScreen={isFullScreen}>
              <BlogPostPage />
            </ViewWrapper>
          } />
        </Routes>

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
              className="p-3 bg-bible-gold hover:bg-yellow-600 text-white rounded-full shadow-lg transition-all duration-300 animate-fadeIn"
              aria-label="Voltar ao topo"
            >
              <ArrowUp size={24} />
            </button>
          )}
        </div>
      </main>

      <CookieBanner onOpenPrivacy={() => openLegalModal('privacy')} />
      <LegalModal
        isOpen={legalModalOpen}
        type={legalModalType}
        onClose={() => setLegalModalOpen(false)}
      />
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
    </div>
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