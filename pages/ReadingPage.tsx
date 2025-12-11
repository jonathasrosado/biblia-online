import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO';
import { ChevronRight, ChevronLeft, Volume2, Pause, Play, Share2, BookOpen, Mic, X, ChevronDown, Minimize, Maximize, List, FileText, Type, Loader2, CheckCircle } from 'lucide-react';
import { bibleBooks, normalizeBookName, findBookByNormalizedName } from '../constants';
import { chapterTitles } from '../data/chapterTitles';
import { getChapterContent } from '../services/geminiService';
import { Verse, ReadingPreferences, BibleVersion } from '../types';
import BibleReader, { BibleReaderRef } from '../components/BibleReader';
import { AdUnit } from '../components/AdUnit';

interface ReadingPageProps {
    language: string;
    t: any;
    preferences: ReadingPreferences;
    onUpdatePreferences: (newPrefs: ReadingPreferences) => void;
    version: BibleVersion;
    isFullScreen: boolean;
    setIsFullScreen: (v: boolean) => void;
    addToHistory: (book: string, chapter: number) => void;
    user?: any;
    setUser?: (user: any) => void;
}

const ReadingPage: React.FC<ReadingPageProps> = ({
    language,
    t,
    preferences,
    onUpdatePreferences,
    version,
    isFullScreen,
    setIsFullScreen,
    addToHistory,
    user,
    setUser
}) => {
    // ... existing hooks ...
    const { bookAbbrev, chapterNum } = useParams<{ bookAbbrev: string; chapterNum: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // State Declarations
    const [chapterContent, setChapterContent] = useState<Verse[]>([]);
    const [loadingContent, setLoadingContent] = useState(false);
    const [togglingRead, setTogglingRead] = useState(false);

    // Audio State
    const bibleReaderRef = React.useRef<BibleReaderRef>(null);
    const [isVerseAudioPlaying, setIsVerseAudioPlaying] = useState(false);
    const [isVerseAudioLoading, setIsVerseAudioLoading] = useState(false);

    // UI State
    const [isChapterGridOpen, setIsChapterGridOpen] = useState(false);

    // Check if chapter is completed
    const currentBook = findBookByNormalizedName(bookAbbrev || '') || bibleBooks[0];
    const currentChapter = parseInt(chapterNum || '1', 10);

    const isCompleted = useMemo(() => {
        if (!user || !user.completedChapters) return false;
        return user.completedChapters.some((c: any) => c.book === currentBook.name && c.chapter === currentChapter);
    }, [user, currentBook.name, currentChapter]);

    const handleToggleRead = async () => {
        if (!user || togglingRead) return;
        setTogglingRead(true);
        try {
            const res = await fetch('/api/user/complete-chapter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    book: currentBook.name,
                    chapter: currentChapter,
                    completed: !isCompleted // Toggle
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (setUser) setUser(data.user);
            }
        } catch (error) {
            console.error("Failed to toggle read status", error);
        } finally {
            setTogglingRead(false);
        }
    };

    // Parse selected verses from URL
    const versesParam = searchParams.get('verses');
    const initialSelectedVerses = React.useMemo(() => {
        if (!versesParam) return [];
        const verses = new Set<number>();
        versesParam.split(',').forEach(part => {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(n => parseInt(n, 10));
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = start; i <= end; i++) verses.add(i);
                }
            } else {
                const num = parseInt(part, 10);
                if (!isNaN(num)) verses.add(num);
            }
        });
        return Array.from(verses).sort((a, b) => a - b);
    }, [versesParam]);

    const handleSelectionChange = React.useCallback((selected: number[]) => {
        const newParams = new URLSearchParams(searchParams);
        if (selected.length > 0) {
            const sorted = [...selected].sort((a, b) => a - b);
            const ranges: string[] = [];
            let start = sorted[0];
            let prev = sorted[0];
            for (let i = 1; i < sorted.length; i++) {
                if (sorted[i] !== prev + 1) {
                    ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
                    start = sorted[i];
                }
                prev = sorted[i];
            }
            ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
            newParams.set('verses', ranges.join(','));
        } else {
            newParams.delete('verses');
        }
        setSearchParams(newParams, { replace: true });
    }, [searchParams, setSearchParams]);

    // Scroll to first selected verse on load
    useEffect(() => {
        if (initialSelectedVerses.length > 0 && !loadingContent) {
            const firstVerse = initialSelectedVerses[0];
            const element = document.getElementById(`v${firstVerse}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [loadingContent, initialSelectedVerses]);

    useEffect(() => {
        const loadChapter = async () => {
            setLoadingContent(true);
            try {
                addToHistory(currentBook.name, currentChapter);
                const verses = await getChapterContent(currentBook.name, currentChapter, language, version);
                setChapterContent(verses);
            } catch (error) {
                console.error("Failed to load chapter", error);
            } finally {
                setLoadingContent(false);
            }
        };

        loadChapter();
    }, [currentBook.name, currentChapter, language, version]);

    const navigateTo = (bookName: string, chapter: number) => {
        const normalizedBook = normalizeBookName(bookName);
        navigate(`/leitura/${normalizedBook}/${chapter}`);
    };

    const staticTitle = chapterTitles[currentBook.name]?.[currentChapter];

    const getNextChapter = () => {
        if (currentChapter < currentBook.chapters) {
            return { book: currentBook.name, chapter: currentChapter + 1 };
        }
        const currentBookIndex = bibleBooks.findIndex(b => b.name === currentBook.name);
        if (currentBookIndex < bibleBooks.length - 1) {
            return { book: bibleBooks[currentBookIndex + 1].name, chapter: 1 };
        }
        return null;
    };

    const getPrevChapter = () => {
        if (currentChapter > 1) {
            return { book: currentBook.name, chapter: currentChapter - 1 };
        }
        const currentBookIndex = bibleBooks.findIndex(b => b.name === currentBook.name);
        if (currentBookIndex > 0) {
            const prevBook = bibleBooks[currentBookIndex - 1];
            return { book: prevBook.name, chapter: prevBook.chapters };
        }
        return null;
    };

    const nextChapter = getNextChapter();
    const prevChapter = getPrevChapter();

    let pageTitle = "";
    if (versesParam) {
        let versePart = "";
        if (/^\d+-\d+$/.test(versesParam)) {
            const [start, end] = versesParam.split('-');
            versePart = `Versículo ${start} ao ${end}`;
        } else if (/^\d+$/.test(versesParam)) {
            versePart = `Versículo ${versesParam}`;
        } else {
            versePart = `Versículos ${versesParam}`;
        }
        pageTitle = `${currentBook.name} ${currentChapter} – ${versePart}`;
    } else {
        pageTitle = `${currentBook.name} ${currentChapter} – Versículos`;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 lg:p-12 pb-8">
            <SEO
                title={pageTitle}
                description={`Leia ${currentBook.name} ${currentChapter} na Bíblia Sagrada.`}
                url={window.location.href}
                schema={{
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "Bíblia",
                            "item": "https://bibliaonline.me"
                        },
                        {
                            "@type": "ListItem",
                            "position": 2,
                            "name": currentBook.name,
                            "item": `https://bibliaonline.me/leitura/${normalizeBookName(currentBook.name)}`
                        },
                        {
                            "@type": "ListItem",
                            "position": 3,
                            "name": `Capítulo ${currentChapter}`,
                            "item": window.location.href
                        }
                    ]
                }}
            />

            <header className={`mb-8 text-center border-b pb-8 transition-colors relative z-10
         ${preferences.theme === 'bw' ? 'border-stone-200' : preferences.theme === 'sepia' ? 'border-[#e6dcc6]' : 'border-stone-200 dark:border-stone-800'}`}>

                {/* Chapter Title & Navigation */}
                <div className="flex items-center justify-between max-w-xl mx-auto mb-8">
                    {prevChapter ? (
                        <button
                            onClick={() => navigateTo(prevChapter.book, prevChapter.chapter)}
                            className={`p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors
                                ${preferences.theme === 'bw' ? 'text-stone-400 hover:text-black' : 'text-stone-400 hover:text-bible-gold'}`}
                            title="Capítulo Anterior"
                        >
                            <ChevronRight className="rotate-180" size={24} />
                        </button>
                    ) : <div className="w-10" />}

                    <div className="text-center relative">
                        <button
                            onClick={() => setIsChapterGridOpen(!isChapterGridOpen)}
                            className="group flex flex-col items-center mx-auto"
                        >
                            <h1 className={`flex items-center gap-3 text-2xl md:text-3xl font-serif font-bold transition-colors
                                ${preferences.theme === 'bw' ? 'text-black hover:text-stone-600' : 'text-bible-accent dark:text-bible-gold hover:text-bible-gold'}`}>
                                {currentBook.name} {currentChapter}
                                <ChevronDown size={24} className={`transition-transform duration-300 ${isChapterGridOpen ? 'rotate-180' : ''}`} />
                            </h1>
                        </button>

                        {staticTitle && (
                            <p className="text-sm text-stone-500 dark:text-stone-400 font-medium italic mt-1">
                                {staticTitle}
                            </p>
                        )}

                        {/* Expandable Chapter Grid */}
                        {isChapterGridOpen && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[90vw] max-w-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl z-50 p-6 animate-slideUp">
                                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                                    {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map((chap) => (
                                        <button
                                            key={chap}
                                            onClick={() => {
                                                navigateTo(currentBook.name, chap);
                                                setIsChapterGridOpen(false);
                                            }}
                                            className={`
                                                h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all
                                                ${currentChapter === chap
                                                    ? (preferences.theme === 'bw' ? 'bg-black text-white shadow-md' : 'bg-bible-gold text-white shadow-md')
                                                    : (preferences.theme === 'bw' ? 'bg-stone-50 border border-transparent hover:border-black hover:text-black' : 'bg-stone-50 dark:bg-stone-800 border border-transparent hover:border-bible-gold hover:text-bible-gold')}
                                            `}
                                        >
                                            {chap}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {nextChapter ? (
                        <button
                            onClick={() => navigateTo(nextChapter.book, nextChapter.chapter)}
                            className={`p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors
                                ${preferences.theme === 'bw' ? 'text-stone-400 hover:text-black' : 'text-stone-400 hover:text-bible-gold'}`}
                            title="Próximo Capítulo"
                        >
                            <ChevronRight size={24} />
                        </button>
                    ) : <div className="w-10" />}
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-6 mb-2">
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <div className="bg-stone-100 dark:bg-stone-800 p-1 rounded-xl flex gap-1 shadow-inner">
                            <button
                                className={`px-6 py-2 rounded-lg text-sm font-medium shadow-sm transition-all
                                    ${preferences.theme === 'bw' ? 'bg-white text-black' : 'bg-white dark:bg-stone-700 text-bible-accent dark:text-bible-gold'}`}
                            >
                                <List size={16} className="inline mr-2 mb-0.5" />
                                Versículos
                            </button>
                            <button
                                onClick={() => navigate(`/resumo/${normalizeBookName(currentBook.name)}/${currentChapter}`)}
                                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all
                                    ${preferences.theme === 'bw' ? 'text-stone-400 hover:text-black hover:bg-white/50' : 'text-stone-400 dark:text-stone-500 hover:text-bible-gold hover:bg-white/50 dark:hover:bg-stone-600/50'}`}
                            >
                                <FileText size={16} className="inline mr-2 mb-0.5" />
                                Resumo
                            </button>
                        </div>

                        <div className="flex items-center gap-3 bg-stone-100 dark:bg-stone-800 px-4 py-2 rounded-lg shrink-0 h-10">
                            <Type size={14} className="opacity-50" />
                            <input
                                type="range"
                                min="80"
                                max="180"
                                step="5"
                                value={preferences.fontSize}
                                onChange={(e) => onUpdatePreferences({ ...preferences, fontSize: parseInt(e.target.value) })}
                                className={`w-24 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-lg appearance-none cursor-pointer
                                    ${preferences.theme === 'bw' ? 'accent-black' : 'accent-bible-gold'}`}
                            />
                            <Type size={18} className="opacity-80" />
                        </div>

                        <button
                            onClick={() => bibleReaderRef.current?.toggleAudio()}
                            disabled={isVerseAudioLoading} // Only disable if loading initial audio
                            className={`
                        h-10 px-6 rounded-lg font-bold text-sm transition-all flex items-center gap-2 active:scale-95
                        ${isVerseAudioPlaying
                                    ? (preferences.theme === 'bw' ? 'bg-white text-black border border-stone-200 shadow-inner' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 shadow-inner')
                                    : (preferences.theme === 'bw' ? 'bg-black text-white hover:bg-stone-800' : 'bg-bible-gold text-white hover:bg-yellow-600 shadow-lg shadow-bible-gold/30 hover:shadow-bible-gold/40')
                                }
                    `}
                        >
                            {isVerseAudioLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : isVerseAudioPlaying ? (
                                <Pause size={18} />
                            ) : (
                                <Volume2 size={18} />
                            )}
                            <span>{isVerseAudioPlaying ? 'Pausar' : 'Ouvir'}</span>
                        </button>
                    </div>
                </div>
            </header>

            {
                loadingContent ? (
                    <div className="space-y-4 animate-pulse max-w-2xl mx-auto">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className={`h-4 rounded w-full ${preferences.theme === 'sepia' ? 'bg-[#e6dcc6]' : 'bg-stone-200 dark:bg-stone-800'}`}></div>
                        ))}
                    </div>
                ) : (
                    <div className="transition-all duration-200">
                        <div style={{ fontSize: `${preferences.fontSize}%` }}>
                            <BibleReader
                                key={`${currentBook.name}-${currentChapter}`}
                                ref={bibleReaderRef}
                                book={currentBook.name}
                                chapter={currentChapter}
                                verses={chapterContent}
                                preferences={preferences}
                                language={language}
                                t={t}
                                initialSelectedVerses={initialSelectedVerses}
                                onSelectionChange={handleSelectionChange}
                                onAudioStateChange={(playing, loading) => {
                                    setIsVerseAudioPlaying(playing);
                                    setIsVerseAudioLoading(loading);
                                }}
                            />
                        </div>
                    </div>
                )
            }

            {/* Bottom Navigation */}
            <div className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-800 space-y-6">

                {/* MARK AS READ BUTTON */}
                {user && (
                    <button
                        onClick={handleToggleRead}
                        disabled={togglingRead}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99]
                            ${isCompleted
                                ? (preferences.theme === 'bw'
                                    ? 'bg-black text-white hover:bg-stone-800'
                                    : 'bg-green-600 text-white hover:bg-green-700 shadow-green-200 dark:shadow-none')
                                : (preferences.theme === 'bw'
                                    ? 'bg-white border-2 border-black text-black hover:bg-stone-50'
                                    : 'bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-bible-gold hover:text-bible-gold dark:hover:border-bible-gold dark:hover:text-bible-gold')
                            }`}
                    >
                        {togglingRead ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : isCompleted ? (
                            <>
                                <CheckCircle size={20} />
                                Lido
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} className="opacity-50" />
                                Marcar como lido
                            </>
                        )}
                    </button>
                )}

                <div className="flex justify-between items-center">
                    {prevChapter ? (
                        <button
                            onClick={() => navigateTo(prevChapter.book, prevChapter.chapter)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-all group text-stone-600 dark:text-stone-400 hover:text-bible-gold"
                        >
                            <ChevronRight className="rotate-180 transition-transform group-hover:-translate-x-1" size={20} />
                            <div className="text-left">
                                <span className="text-xs uppercase tracking-wider opacity-60 block mb-0.5">Anterior</span>
                                <span className="font-serif font-bold text-lg">{prevChapter.book} {prevChapter.chapter}</span>
                            </div>
                        </button>
                    ) : <div />}

                    {nextChapter && (
                        <button
                            onClick={() => navigateTo(nextChapter.book, nextChapter.chapter)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-all group text-stone-600 dark:text-stone-400 hover:text-bible-gold"
                        >
                            <div className="text-right">
                                <span className="text-xs uppercase tracking-wider opacity-60 block mb-0.5">Próximo</span>
                                <span className="font-serif font-bold text-lg">{nextChapter.book} {nextChapter.chapter}</span>
                            </div>
                            <ChevronRight className="transition-transform group-hover:translate-x-1" size={20} />
                        </button>
                    )}
                </div>
            </div>


        </div>
    );
};

export default ReadingPage;
