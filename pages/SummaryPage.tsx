import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { ChevronRight, ChevronLeft, Volume2, Pause, Play, Share2, BookOpen, Mic, Loader2, List, FileText, ArrowLeft, Type, ChevronDown } from 'lucide-react';
import { bibleBooks, normalizeBookName, findBookByNormalizedName } from '../constants';
import { getChapterContentLocal } from '../services/localBibleService'; // Unused but kept for reference
import { getChapterSummary, generateAudioFromText } from '../services/geminiService';
import { ChapterSummary } from '../types';

interface SummaryPageProps {
    language: string;
    t: any;
    preferences: any;
    onUpdatePreferences: (prefs: any) => void;
    isFullScreen: boolean;
    setIsFullScreen: (v: boolean) => void;
    addToHistory: (book: string, chapter: number) => void;
}

const SummaryPage: React.FC<SummaryPageProps> = ({
    language,
    t,
    preferences,
    onUpdatePreferences,
    isFullScreen,
    setIsFullScreen,
    addToHistory
}) => {
    const { bookAbbrev, chapterNum } = useParams();
    const navigate = useNavigate();

    // State
    const [content, setContent] = useState<ChapterSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isChapterGridOpen, setIsChapterGridOpen] = useState(false);

    // Audio State
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Derived State
    const currentBook = findBookByNormalizedName(bookAbbrev || '');
    const currentChapter = parseInt(chapterNum || '1', 10);

    // Update history when chapter loads
    useEffect(() => {
        if (currentBook) {
            addToHistory(currentBook.name, currentChapter);
        }
    }, [currentBook, currentChapter]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            stopAudio();
        };
    }, []);

    // Load Content
    useEffect(() => {
        if (!currentBook) return;

        const loadContent = async () => {
            setLoading(true);
            setError(null);
            // Stop any playing audio when changing content
            stopAudio();

            try {
                // Determine previous/next for navigation (TODO: Move this to a helper if reused widely)

                const data = await getChapterSummary(currentBook.name, currentChapter, language);
                if ('error' in data) {
                    setError(data.error);
                } else {
                    setContent(data);
                }
            } catch (err) {
                console.error("Failed to load summary:", err);
                setError("Erro ao carregar o resumo.");
            } finally {
                setLoading(false);
            }
        };

        loadContent();
    }, [currentBook, currentChapter, language]);

    // Audio Refs
    const audioContextRef = React.useRef<AudioContext | null>(null);
    const sourceNodeRef = React.useRef<AudioBufferSourceNode | null>(null);

    const stopAudio = () => {
        if (sourceNodeRef.current) {
            try { sourceNodeRef.current.stop(); } catch (e) { }
            sourceNodeRef.current = null;
        }
        setIsPlaying(false);
        setIsAudioLoading(false);
    };

    const handleToggleAudio = async () => {
        if (!content) return;

        // 1. Toggle Off
        if (isPlaying) {
            stopAudio();
            return;
        }

        // 2. Play
        setIsAudioLoading(true);
        try {
            // Initialize Context if needed
            if (!audioContextRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioContextClass();
            }
            // Resume if suspended
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const textToRead = `Resumo de ${content.title}. ${content.summary}. Mensagem Central: ${content.structure.centralMessage}`;
            const audioBase64 = await generateAudioFromText(textToRead);

            if (audioBase64 && audioContextRef.current) {
                const ctx = audioContextRef.current;
                // Strip data URI prefix if present to get raw base64
                const base64Data = audioBase64.replace(/^data:audio\/[a-z]+;base64,/, "");
                const binaryString = atob(base64Data);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

                const audioBuffer = await ctx.decodeAudioData(bytes.buffer);

                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                sourceNodeRef.current = source;

                source.onended = () => {
                    setIsPlaying(false);
                    sourceNodeRef.current = null;
                };

                source.start(0);
                setIsPlaying(true);
            } else {
                alert("Não foi possível gerar o áudio. Tente novamente.");
            }
        } catch (error) {
            console.error("Audio playback error:", error);
            alert("Erro ao reproduzir áudio.");
        } finally {
            setIsAudioLoading(false);
        }
    };

    if (!currentBook) {
        return <div className="p-8 text-center">Livro não encontrado.</div>;
    }

    const nextChapter = currentChapter < currentBook.chapters
        ? { book: normalizeBookName(currentBook.name), chapter: currentChapter + 1 }
        : null; // TODO: handle book transition

    const prevChapter = currentChapter > 1
        ? { book: normalizeBookName(currentBook.name), chapter: currentChapter - 1 }
        : null; // TODO: handle book transition

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 lg:p-12 pb-8">
            <SEO
                title={`Resumo de ${currentBook.name} ${currentChapter} - Estudo Bíblico`}
                description={`Leia o resumo e estudo do capítulo ${currentChapter} de ${currentBook.name}. Entenda o contexto e significado.`}
                canonical={`/resumo/${normalizeBookName(currentBook.name)}/${currentChapter}`}
            />

            <header className={`mb-8 text-center border-b pb-8 transition-colors relative z-10
                ${preferences.theme === 'sepia' ? 'border-[#e6dcc6]' : 'border-stone-200 dark:border-stone-800'}`}>

                {/* Chapter Title & Navigation */}
                <div className="grid grid-cols-[48px_1fr_48px] items-center max-w-xl mx-auto mb-8">
                    <div className="flex justify-start">
                        {prevChapter && (
                            <button
                                onClick={() => navigate(`/resumo/${prevChapter.book}/${prevChapter.chapter}`)}
                                className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-bible-gold transition-colors"
                                title="Capítulo Anterior"
                            >
                                <ChevronRight className="rotate-180" size={24} />
                            </button>
                        )}
                    </div>

                    <div className="text-center relative">
                        <button
                            onClick={() => setIsChapterGridOpen(!isChapterGridOpen)}
                            className="group flex flex-col items-center mx-auto"
                        >
                            <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-serif font-bold text-bible-accent dark:text-bible-gold transition-colors hover:text-bible-gold">
                                {currentBook.name} {currentChapter}
                                <ChevronDown size={24} className={`transition-transform duration-300 ${isChapterGridOpen ? 'rotate-180' : ''}`} />
                            </h1>
                        </button>

                        {/* Expandable Chapter Grid */}
                        {isChapterGridOpen && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[90vw] max-w-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl z-50 p-6 animate-slideUp">
                                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                                    {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map((chap) => (
                                        <button
                                            key={chap}
                                            onClick={() => {
                                                navigate(`/resumo/${normalizeBookName(currentBook.name)}/${chap}`);
                                                setIsChapterGridOpen(false);
                                            }}
                                            className={`
                                                h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all
                                                ${currentChapter === chap
                                                    ? 'bg-bible-gold text-white shadow-md'
                                                    : 'bg-stone-50 dark:bg-stone-800 border border-transparent hover:border-bible-gold hover:text-bible-gold'}
                                            `}
                                        >
                                            {chap}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end">
                        {nextChapter && (
                            <button
                                onClick={() => navigate(`/resumo/${nextChapter.book}/${nextChapter.chapter}`)}
                                className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-bible-gold transition-colors"
                                title="Próximo Capítulo"
                            >
                                <ChevronRight size={24} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-6 mb-2">
                    {/* Centered Group containing all 4 elements */}
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        {/* Tab Navigation (Verses vs Summary) */}
                        <div className="bg-stone-100 dark:bg-stone-800 p-1 rounded-xl flex gap-1 shadow-inner">
                            <button
                                onClick={() => navigate(`/leitura/${normalizeBookName(currentBook.name)}/${currentChapter}`)}
                                className="px-6 py-2 rounded-lg text-sm font-medium text-stone-400 dark:text-stone-500 hover:text-bible-gold hover:bg-white/50 dark:hover:bg-stone-600/50 transition-all"
                            >
                                <List size={16} className="inline mr-2 mb-0.5" />
                                Versículos
                            </button>
                            <button
                                className="px-6 py-2 rounded-lg text-sm font-medium bg-white dark:bg-stone-700 text-bible-accent dark:text-bible-gold shadow-sm transition-all"
                            >
                                <FileText size={16} className="inline mr-2 mb-0.5" />
                                Resumo
                            </button>
                        </div>

                        {/* Font Size Slider */}
                        <div className="flex items-center gap-3 bg-stone-100 dark:bg-stone-800 px-4 py-2 rounded-lg shrink-0 h-10">
                            <Type size={14} className="opacity-50" />
                            <input
                                type="range"
                                min="80"
                                max="180"
                                step="5"
                                value={preferences.fontSize}
                                onChange={(e) => onUpdatePreferences({ ...preferences, fontSize: parseInt(e.target.value) })}
                                className="w-24 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-lg appearance-none cursor-pointer accent-bible-gold"
                                title={`Tamanho da fonte: ${preferences.fontSize}%`}
                            />
                            <Type size={18} className="opacity-80" />
                        </div>

                        {/* Audio Button */}
                        <button
                            onClick={handleToggleAudio}
                            disabled={isAudioLoading || !content}
                            className={`px-4 py-2 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 h-10
                                ${isPlaying
                                    ? 'bg-bible-gold/20 text-bible-gold hover:bg-bible-gold/30'
                                    : 'bg-bible-gold text-white hover:bg-yellow-600'} 
                                ${isAudioLoading || !content ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            title="Ouvir Resumo"
                        >
                            {isAudioLoading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : isPlaying ? (
                                <>
                                    <Pause size={16} fill="currentColor" />
                                    <span className="text-sm font-medium">Pausar</span>
                                </>
                            ) : (
                                <>
                                    <Volume2 size={16} />
                                    <span className="text-sm font-medium">Ouvir</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Content (No longer needing the flex-1 overflow-y-auto wrapper) */}
            <div>
                {loading ? (
                    <div className="space-y-4 animate-pulse max-w-2xl mx-auto">
                        <div className="h-8 w-3/4 bg-stone-200 dark:bg-stone-800 rounded"></div>
                        <div className="h-4 w-full bg-stone-200 dark:bg-stone-800 rounded"></div>
                        <div className="h-4 w-full bg-stone-200 dark:bg-stone-800 rounded"></div>
                        <div className="h-4 w-5/6 bg-stone-200 dark:bg-stone-800 rounded"></div>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                        <p>{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                ) : content && (
                    <div className={`prose prose-lg max-w-none ${preferences.theme === 'dark' ? 'prose-invert' : ''} ${preferences.fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}>
                        <h2 className="font-serif text-3xl font-bold mb-6 text-center text-bible-accent dark:text-bible-gold">
                            {content.title}
                        </h2>

                        {/* Summary */}
                        <div className="mb-8">
                            <h3 className="text-xl font-bold mb-3 text-bible-accent dark:text-bible-gold flex items-center gap-2">
                                <FileText size={20} />
                                Resumo
                            </h3>
                            <p className="leading-relaxed" style={{ fontSize: `${preferences.fontSize}%` }}>{content.summary}</p>
                        </div>

                        {/* Structure */}
                        <div className="mb-8 p-6 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
                            <h3 className="text-xl font-bold mb-4 text-bible-accent dark:text-bible-gold">Estrutura do Capítulo</h3>
                            <p className="mb-4 italic opacity-80" style={{ fontSize: `${preferences.fontSize}%` }}>{content.structure.intro}</p>
                            <div className="space-y-3">
                                {content.structure.blocks.map((block, idx) => (
                                    <div key={idx} className="flex gap-4" style={{ fontSize: `${preferences.fontSize}%` }}>
                                        <span className="font-mono font-bold text-bible-gold shrink-0">{block.verses}</span>
                                        <span>{block.description}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 p-4 bg-bible-gold/10 rounded-lg border-l-4 border-bible-gold">
                                <span className="font-bold block mb-1 text-bible-gold">Mensagem Central:</span>
                                <p className="italic" style={{ fontSize: `${preferences.fontSize}%` }}>{content.structure.centralMessage}</p>
                            </div>
                        </div>

                        {/* Key Verses */}
                        <div className="mb-8">
                            <h3 className="text-xl font-bold mb-4 text-bible-accent dark:text-bible-gold flex items-center gap-2">
                                <BookOpen size={20} />
                                Versículos Chave
                            </h3>
                            <div className="grid gap-4">
                                {content.keyVerses.map((kv, idx) => (
                                    <div key={idx} className="p-4 rounded-lg bg-stone-50 dark:bg-stone-900/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-bold text-bible-accent dark:text-bible-gold">{kv.verses}</span>
                                            <span className="text-sm font-medium opacity-70 uppercase tracking-wider">— {kv.title}</span>
                                        </div>
                                        <p className="text-sm opacity-90" style={{ fontSize: `${preferences.fontSize}%` }}>{kv.explanation}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Historical Context */}
                        <div className="mb-8">
                            <h3 className="text-xl font-bold mb-3 text-bible-accent dark:text-bible-gold">Contexto Histórico</h3>
                            <p className="leading-relaxed" style={{ fontSize: `${preferences.fontSize}%` }}>{content.historicalContext}</p>
                        </div>

                        {/* Practical Application */}
                        <div className="mb-8 p-6 bg-bible-gold/5 rounded-xl border border-bible-gold/10">
                            <h3 className="text-xl font-bold mb-4 text-bible-accent dark:text-bible-gold">Aplicação Prática</h3>
                            <ul className="space-y-3">
                                {content.practicalApplication.map((app, idx) => (
                                    <li key={idx} className="flex gap-3" style={{ fontSize: `${preferences.fontSize}%` }}>
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-bible-gold text-white text-xs font-bold shrink-0">
                                            {idx + 1}
                                        </span>
                                        <span>{app}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Prayer */}
                        <div className="mb-8">
                            <h3 className="text-xl font-bold mb-3 text-bible-accent dark:text-bible-gold flex items-center gap-2">
                                <Mic size={20} />
                                Oração
                            </h3>
                            <div className="p-6 italic relative bg-stone-50 dark:bg-stone-900 rounded-xl" style={{ fontSize: `${preferences.fontSize}%` }}>
                                "{content.prayer}"
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Footer */}
            <div className={`p-4 border-t flex items-center justify-between mt-8
                ${preferences.theme === 'sepia' ? 'bg-[#efebd6] border-[#e6dcc6]' : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800'}`}>
                {prevChapter ? (
                    <button
                        onClick={() => navigate(`/resumo/${prevChapter.book}/${prevChapter.chapter}`)}
                        className="flex items-center gap-2 text-sm font-medium hover:text-bible-gold transition-colors"
                    >
                        <ChevronLeft size={16} />
                        Anterior
                    </button>
                ) : <div />}

                {nextChapter ? (
                    <button
                        onClick={() => navigate(`/resumo/${nextChapter.book}/${nextChapter.chapter}`)}
                        className="flex items-center gap-2 text-sm font-medium hover:text-bible-gold transition-colors"
                    >
                        Próximo
                        <ChevronRight size={16} />
                    </button>
                ) : <div />}
            </div>
        </div>
    );
};

export default SummaryPage;
