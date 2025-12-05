import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Book, Menu, MessageCircle, Search, Sun, Moon, X, BookOpen, Settings, ArrowUp, Minimize, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';
import { bibleBooks, translations, findBookByNormalizedName, normalizeBookName } from './constants';

import { BibleBook, ReadingPreferences, ReadingHistoryItem } from './types';
import BookSelector from './components/BookSelector';
import { AdUnit } from './components/AdUnit';
import { AppFooter, CookieBanner, LegalModal } from './components/LegalComponents';
import SettingsModal from './components/SettingsModal';
import LoginModal from './components/LoginModal';
import LoginButton from './components/LoginButton';

// Pages
import HomePage from './components/HomePage'; // We'll use the component as the home page
import ReadingPage from './pages/ReadingPage';
import SearchPage from './pages/SearchPage';
import DevotionalPage from './pages/DevotionalPage';
import ChatPage from './pages/ChatPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import CategoryPage from './pages/CategoryPage';

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

import AdminPage from './pages/AdminPage';
import BlogManager from './components/admin/BlogManager';
import BlogEditor from './components/admin/BlogEditor';
import CategoryList from './components/admin/CategoryList';
import UserManager from './components/admin/UserManager';
import SettingsManager from './components/admin/SettingsManager';
import AISettings from './components/admin/AISettings';
import PromptsManager from './components/admin/PromptsManager';
import MediaManager from './components/admin/MediaManager';

// Redirect Handler Component
const RedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [links, setLinks] = useState<Record<string, string>>({});

  // Link Shortener logic removed to prevent navigation issues
  /*
  useEffect(() => {
    fetch('/api/admin/links')
      .then(res => res.json())
      .then(data => setLinks(data))
      .catch(() => { });
  }, []);

  useEffect(() => {
    // Check if current path matches a shortlink
    const path = location.pathname.slice(1); // Remove leading slash
    if (links[path]) {
      window.location.href = links[path]; // Hard redirect to ensure clean state
    }
  }, [location, links]);
  */

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

  // Initialize Language
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

  // Scroll Listener & Progress
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const mainContainer = mainScrollRef.current;
    if (!mainContainer) return;

    const handleScroll = () => {
      // Show/Hide Scroll Top Button
      if (mainContainer.scrollTop > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      // Calculate Progress
      const totalScroll = mainContainer.scrollHeight - mainContainer.clientHeight;
      if (totalScroll > 0) {
        const progress = (mainContainer.scrollTop / totalScroll) * 100;
        setScrollProgress(progress);
      }
    };

    mainContainer.addEventListener('scroll', handleScroll);
    return () => mainContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset scroll on route change
  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setSidebarOpen(false); // Close sidebar on navigation
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
    navigate(`/busca?q=${encodeURIComponent(searchQuery)}`);
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

  // Determine current book/chapter for BookSelector based on URL or default
  // This is a bit tricky since we are outside the Route. 
  // We can just pass defaults or try to parse location, but defaults are fine for the selector.
  // Determine current book/chapter for BookSelector based on URL
  const match = location.pathname.match(/\/leitura\/([^\/]+)\/(\d+)/);
  let currentBook = bibleBooks[0];
  let currentChapter = 1;

  if (match) {
    const bookName = decodeURIComponent(match[1]);
    const chapter = parseInt(match[2], 10);
    // Use normalized lookup to handle 'genesis' vs 'Gênesis'
    const foundBook = findBookByNormalizedName(bookName);
    if (foundBook) {
      currentBook = foundBook;
      currentChapter = chapter;
    }
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col md:flex-row overflow-hidden transition-colors duration-300 ${getMainBackgroundClass()}`}>
      <RedirectHandler />

      {/* Desktop Open Sidebar Button (Top Left) */}
      {!desktopSidebarOpen && !isFullScreen && (
        <button
          onClick={() => setDesktopSidebarOpen(true)}
          className="hidden md:flex fixed top-4 left-4 z-30 p-2 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-bible-gold rounded-full shadow-md transition-all duration-300 animate-fadeIn items-center justify-center border border-stone-200 dark:border-stone-700"
          title="Expandir Menu"
        >
          <Menu size={20} />
        </button>
      )}

      {/* User Login Button (Top Right - Desktop) */}
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
              onClick={() => setIsLoginModalOpen(true)}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              {user ? (
                user.picture ? <img src={user.picture} alt={user.name} className="w-5 h-5 rounded-full" /> : <UserIcon size={20} />
              ) : (
                <UserIcon size={20} />
              )}
            </button>
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <Settings size={20} />
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
              {sidebarOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      {!isFullScreen && (
        <aside className={`
          fixed inset-y-0 left-0 z-20 border-r transform transition-all duration-300 ease-in-out flex flex-col
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

            <button
              onClick={() => { setSettingsModalOpen(true); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100"
            >
              <Settings size={20} />
              {t.settings}
            </button>
          </nav>

          <div className="px-4 pb-4 space-y-4">
            {/* Removed direct LoginButton, now handled by Modal/Top Button. 
                 But we can keep a "Minha Conta" button here too if we want. 
                 Let's put a banner or something. */}
            {!user && (
              <div className="bg-bible-gold/10 p-4 rounded-xl text-center">
                <p className="text-sm font-bold text-bible-accent dark:text-bible-gold mb-2">Salve seu progresso</p>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full py-2 bg-bible-gold text-white rounded-lg text-sm font-bold hover:bg-yellow-600 transition-colors"
                >
                  Entrar / Criar Conta
                </button>
              </div>
            )}
            <AdUnit className="mt-2 scale-90 origin-bottom" label="Publicidade" />
          </div>
        </aside>
      )}

      <main
        ref={mainScrollRef}
        className={`flex-1 overflow-y-auto relative scroll-smooth ${getMainBackgroundClass()}
          ${isFullScreen ? 'h-screen' : 'h-[calc(100vh-65px)] md:h-screen'}`}
      >
        {/* Reading Progress Bar */}
        {location.pathname.includes('/leitura') && (
          <div className="fixed top-0 left-0 w-full h-1 z-50 bg-transparent">
            <div
              className="h-full bg-bible-gold shadow-[0_0_10px_rgba(212,175,55,0.5)] transition-all duration-150 ease-out"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        )}

        {/* Reading Progress Bar (Book Level) */}
        {location.pathname.includes('/leitura') && currentBook && (
          <div className="fixed bottom-0 left-0 w-full z-40 pointer-events-none">
            {/* Gradient Fade for text readability above */}
            <div className="h-24 bg-gradient-to-t from-white dark:from-stone-950 to-transparent w-full absolute bottom-0"></div>

            <div className="relative pb-safe-area">
              {/* Progress Line */}
              <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800">
                <div
                  className="h-full bg-bible-gold shadow-[0_0_10px_rgba(212,175,55,0.5)] transition-all duration-300 ease-out"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((currentChapter - 1 + (scrollProgress / 100)) / currentBook.chapters) * 100))}%`
                  }}
                />
              </div>

              {/* Text Indicator */}
              <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 py-2 px-4 text-center">
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 font-serif">
                  Você leu <span className="text-bible-gold font-bold">
                    {(((currentChapter - 1 + (scrollProgress / 100)) / currentBook.chapters) * 100).toFixed(1)}%
                  </span> do Livro de {currentBook.name}
                </p>
              </div>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/" element={
            <ViewWrapper onOpenPrivacy={() => openLegalModal('privacy')} onOpenTerms={() => openLegalModal('terms')} isFullScreen={isFullScreen}>
              <HomePage language={language} t={t} isDark={preferences.theme === 'dark'} history={history} />
            </ViewWrapper>
          } />

          <Route path="/leitura/:bookAbbrev/:chapterNum" element={
            <ViewWrapper onOpenPrivacy={() => openLegalModal('privacy')} onOpenTerms={() => openLegalModal('terms')} isFullScreen={isFullScreen}>
              <ReadingPage
                key={location.pathname}
                language={language}
                t={t}
                preferences={preferences}
                isFullScreen={isFullScreen}
                setIsFullScreen={setIsFullScreen}
                addToHistory={addToHistory}
                onUpdatePreferences={setPreferences}
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
            <div className="h-full flex flex-col">
              <ChatPage language={language} t={t} />
              {!isFullScreen && (
                <AppFooter onOpenPrivacy={() => openLegalModal('privacy')} onOpenTerms={() => openLegalModal('terms')} />
              )}
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