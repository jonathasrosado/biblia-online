import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { ChevronRight, ChevronLeft, Volume2, Pause, Play, Share2, BookOpen, Mic, Loader2, List, FileText, ArrowLeft, Type, ChevronDown, X } from 'lucide-react';
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

    // Font Menu Logic (Click Outside)
    const [isFontModalOpen, setIsFontModalOpen] = useState(false);
    const fontModalRef = useRef<HTMLDivElement>(null);
    const fontButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                isFontModalOpen &&
                fontModalRef.current &&
                !fontModalRef.current.contains(e.target as Node) &&
                fontButtonRef.current &&
                !fontButtonRef.current.contains(e.target as Node)
            ) {
                setIsFontModalOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isFontModalOpen]);

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
                ${preferences.theme === 'bw' ? 'border-stone-200' : preferences.theme === 'sepia' ? 'border-[#e6dcc6]' : 'border-stone-200 dark:border-stone-800'}`}>

                {/* Chapter Title & Navigation */}
                <div className="relative flex items-center justify-center max-w-xl mx-auto mb-8 min-h-[48px]">
                    {/* Left - Previous Chapter (Absolute) */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
                        {prevChapter && (
                            <button
                                onClick={() => navigate(`/resumo/${prevChapter.book}/${prevChapter.chapter}`)}
                                className={`p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors
                                    ${preferences.theme === 'bw' ? 'text-stone-400 hover:text-black' : 'text-stone-400 hover:text-bible-gold'}`}
                                title="Capítulo Anterior"
                            >
                                <ChevronRight className="rotate-180" size={24} />
                            </button>
                        )}
                    </div>

                    {/* Center - Title Button */}
                    <div className="relative z-10">
                        <button
                            onClick={() => setIsChapterGridOpen(!isChapterGridOpen)}
                            className="group flex flex-col items-center justify-center p-2 rounded-xl transition-all"
                        >
                            <h1 className={`flex items-center gap-2 text-2xl md:text-3xl font-serif font-bold transition-colors text-center
                                ${preferences.theme === 'bw' ? 'text-black hover:text-stone-600' : 'text-bible-accent dark:text-bible-gold hover:text-bible-gold'}`}>
                                <span>{currentBook.name} {currentChapter}</span>
                                <ChevronDown size={24} className={`transition-transform duration-300 opacity-50 group-hover:opacity-100 ${isChapterGridOpen ? 'rotate-180' : ''}`} />
                            </h1>
                        </button>
                    </div>

                    {/* Right - Next Chapter (Absolute) */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
                        {nextChapter && (
                            <button
                                onClick={() => navigate(`/resumo/${nextChapter.book}/${nextChapter.chapter}`)}
                                className={`p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors
                                    ${preferences.theme === 'bw' ? 'text-stone-400 hover:text-black' : 'text-stone-400 hover:text-bible-gold'}`}
                                title="Próximo Capítulo"
                            >
                                <ChevronRight size={24} />
                            </button>
                        )}
                    </div>

                    {/* Dropdown - Anchored to MAIN CONTAINER (Centered on Page) */}
                    {isChapterGridOpen && (
                        <>
                            {/* Backdrop to close */}
                            <div
                                className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20"
                                onClick={() => setIsChapterGridOpen(false)}
                            />

                            {/* The Menu */}
                            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-4xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl z-50 p-6 animate-fadeIn">
                                <h3 className="text-center text-sm font-bold text-stone-400 mb-4 uppercase tracking-wider">Selecione o Capítulo</h3>
                                <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-2 max-h-[60vh] overflow-y-auto p-1">
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
                                                    ? (preferences.theme === 'bw' ? 'bg-black text-white shadow-md' : 'bg-bible-gold text-white shadow-md')
                                                    : (preferences.theme === 'bw' ? 'bg-stone-50 border border-transparent hover:border-black hover:text-black' : 'bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700/50 hover:border-bible-gold hover:text-bible-gold')}
                                            `}
                                        >
                                            {chap}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Controls Bar - Single Line */}
                <div className="flex items-center justify-center gap-3 mt-6 mb-2 relative">

                    {/* 1. Verses/Summary Toggle */}
                    <div className="bg-stone-100 dark:bg-stone-800 p-1.5 rounded-xl flex gap-1 shadow-inner h-11 items-center">
                        <button
                            onClick={() => navigate(`/leitura/${normalizeBookName(currentBook.name)}/${currentChapter}`)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                                ${preferences.theme === 'bw' ? 'text-stone-400 hover:text-black hover:bg-white/50' : 'text-stone-400 dark:text-stone-500 hover:text-bible-gold hover:bg-white/50 dark:hover:bg-stone-600/50'}`}
                        >
                            <List size={16} className="mb-0.5" />
                            Versículos
                        </button>
                        <button
                            className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2
                                ${preferences.theme === 'bw' ? 'bg-white text-black' : 'bg-white dark:bg-stone-700 text-bible-accent dark:text-bible-gold'}`}
                        >
                            <FileText size={16} className="mb-0.5" />
                            Resumo
                        </button>
                    </div>

                    <div className="w-px h-6 bg-stone-200 dark:bg-stone-800 mx-1"></div>

                    {/* 2. Text Size Toggle (Icon Only) */}
                    <div className="relative font-control-dropdown">
                        <button
                            ref={fontButtonRef}
                            onClick={() => setIsFontModalOpen(!isFontModalOpen)}
                            className={`h-11 w-11 flex items-center justify-center rounded-xl transition-all
                                ${preferences.theme === 'bw'
                                    ? 'hover:bg-stone-100 text-black'
                                    : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-bible-gold'}`}
                            title="Ajustar Texto"
                        >
                            <div className="flex items-end mb-0.5 pointer-events-none gap-0.5">
                                <span className="text-sm font-bold leading-none font-serif">a</span>
                                <span className="text-xl font-bold leading-none font-serif">A</span>
                            </div>
                        </button>

                        {/* Font Control Bottom Sheet (Fixed Bottom) */}
                        <div
                            id="font-popover"
                            ref={fontModalRef}
                            className={`
                                fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 z-[100] transition-all duration-300 ease-out safe-area-bottom
                                ${isFontModalOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}
                            `}
                        >
                            <div className="max-w-xl mx-auto relative pt-2">

                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-stone-900 dark:text-white">Tamanho do Texto</h3>
                                    <button
                                        onClick={() => setIsFontModalOpen(false)}
                                        className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full text-stone-500 hover:bg-stone-200"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="relative flex items-center w-full h-12 bg-stone-100 dark:bg-stone-800 rounded-full px-4 mb-4">
                                    {/* Side Labels */}
                                    <span className="text-xs font-bold text-stone-400 mr-4 font-serif">A</span>

                                    {/* Visual Track & Ticks */}
                                    {/* Visual Track (Simple) */}
                                    <div className="relative flex-1 h-1 bg-stone-300 dark:bg-stone-600 rounded-full flex items-center px-0.5">
                                        {/* Progress Fill */}
                                        <div
                                            className={`absolute left-0 top-0 h-full rounded-full ${preferences.theme === 'bw' ? 'bg-black' : 'bg-bible-gold'}`}
                                            style={{ width: `${((preferences.fontSize - 80) / 100) * 100}%` }}
                                        />

                                        {/* Thumb (Visual only, moves with percentage) */}
                                        <div
                                            className={`absolute h-4 w-4 rounded-full shadow-md z-10 pointer-events-none transition-colors
                                                ${preferences.theme === 'bw' ? 'bg-black' : 'bg-bible-gold'}`}
                                            style={{ left: `calc(${((preferences.fontSize - 80) / 100) * 100}% - 8px)` }}
                                        />
                                    </div>

                                    {/* Range Input */}
                                    <input
                                        type="range"
                                        min="80"
                                        max="180"
                                        step="1"
                                        value={preferences.fontSize}
                                        onChange={(e) => onUpdatePreferences({ ...preferences, fontSize: parseInt(e.target.value) })}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 mx-4"
                                    />

                                    <span className="text-xl font-bold text-stone-400 ml-4 font-serif">A</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Audio Button (Icon Only) */}
                    <button
                        onClick={handleToggleAudio}
                        disabled={isAudioLoading || !content}
                        className={`
                            h-11 w-11 rounded-xl flex items-center justify-center transition-all active:scale-95
                            ${isPlaying
                                ? (preferences.theme === 'bw' ? 'bg-white text-black border border-stone-200 shadow-inner' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400')
                                : (preferences.theme === 'bw' ? 'bg-black text-white hover:bg-stone-800' : 'bg-bible-gold text-white hover:bg-yellow-600 shadow-bible-gold/30 hover:shadow-bible-gold/40')
                            }
                        `}
                        title={isPlaying ? 'Pausar Áudio' : 'Ouvir Resumo'}
                    >
                        {isAudioLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : isPlaying ? (
                            <Pause size={16} />
                        ) : (
                            <Volume2 size={16} />
                        )}
                    </button>
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
                        <h2 className={`font-serif text-3xl font-bold mb-6 text-center
                            ${preferences.theme === 'bw' ? 'text-black' : 'text-bible-accent dark:text-bible-gold'}`}>
                            {content.title}
                        </h2>

                        {/* Summary */}
                        <div className="mb-8">
                            <h3 className={`text-xl font-bold mb-3 flex items-center gap-2
                                ${preferences.theme === 'bw' ? 'text-black' : 'text-bible-accent dark:text-bible-gold'}`}>
                                <FileText size={20} />
                                Resumo
                            </h3>
                            <p className="leading-relaxed" style={{ fontSize: `${preferences.fontSize}%` }}>{content.summary}</p>
                        </div>

                        {/* Structure */}
                        <div className="mb-8 p-6 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
                            <h3 className={`text-xl font-bold mb-4
                                ${preferences.theme === 'bw' ? 'text-black' : 'text-bible-accent dark:text-bible-gold'}`}>Estrutura do Capítulo</h3>
                            <p className="mb-4 italic opacity-80" style={{ fontSize: `${preferences.fontSize}%` }}>{content.structure.intro}</p>
                            <div className="space-y-3">
                                {content.structure.blocks.map((block, idx) => (
                                    <div key={idx} className="flex gap-4" style={{ fontSize: `${preferences.fontSize}%` }}>
                                        <span className="font-mono font-bold text-bible-gold shrink-0">{block.verses}</span>
                                        <span>{block.description}</span>
                                    </div>
                                ))}
                            </div>
                            <div className={`mt-6 p-4 rounded-lg border-l-4
                                ${preferences.theme === 'bw' ? 'bg-stone-100 border-black' : 'bg-bible-gold/10 border-bible-gold'}`}>
                                <span className={`font-bold block mb-1 ${preferences.theme === 'bw' ? 'text-black' : 'text-bible-gold'}`}>Mensagem Central:</span>
                                <p className="italic" style={{ fontSize: `${preferences.fontSize}%` }}>{content.structure.centralMessage}</p>
                            </div>
                        </div>

                        {/* Key Verses */}
                        <div className="mb-8">
                            <h3 className={`text-xl font-bold mb-4 flex items-center gap-2
                                ${preferences.theme === 'bw' ? 'text-black' : 'text-bible-accent dark:text-bible-gold'}`}>
                                <BookOpen size={20} />
                                Versículos Chave
                            </h3>
                            <div className="grid gap-4">
                                {content.keyVerses.map((kv, idx) => (
                                    <div key={idx} className="p-4 rounded-lg bg-stone-50 dark:bg-stone-900/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`font-bold ${preferences.theme === 'bw' ? 'text-black' : 'text-bible-accent dark:text-bible-gold'}`}>{kv.verses}</span>
                                            <span className="text-sm font-medium opacity-70 uppercase tracking-wider">— {kv.title}</span>
                                        </div>
                                        <p className="text-sm opacity-90" style={{ fontSize: `${preferences.fontSize}%` }}>{kv.explanation}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Historical Context */}
                        <div className="mb-8">
                            <h3 className={`text-xl font-bold mb-3 ${preferences.theme === 'bw' ? 'text-black' : 'text-bible-accent dark:text-bible-gold'}`}>Contexto Histórico</h3>
                            <p className="leading-relaxed" style={{ fontSize: `${preferences.fontSize}%` }}>{content.historicalContext}</p>
                        </div>

                        {/* Practical Application */}
                        <div className={`mb-8 p-6 rounded-xl border
                            ${preferences.theme === 'bw' ? 'bg-stone-100 border-stone-300' : 'bg-bible-gold/5 border-bible-gold/10'}`}>
                            <h3 className={`text-xl font-bold mb-4 ${preferences.theme === 'bw' ? 'text-black' : 'text-bible-accent dark:text-bible-gold'}`}>Aplicação Prática</h3>
                            <ul className="space-y-3">
                                {content.practicalApplication.map((app, idx) => (
                                    <li key={idx} className="flex gap-3" style={{ fontSize: `${preferences.fontSize}%` }}>
                                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold shrink-0
                                            ${preferences.theme === 'bw' ? 'bg-black' : 'bg-bible-gold'}`}>
                                            {idx + 1}
                                        </span>
                                        <span>{app}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Prayer */}
                        <div className="mb-8">
                            <h3 className={`text-xl font-bold mb-3 flex items-center gap-2
                                ${preferences.theme === 'bw' ? 'text-black' : 'text-bible-accent dark:text-bible-gold'}`}>
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
                ${preferences.theme === 'bw' ? 'bg-stone-50 border-stone-200' : preferences.theme === 'sepia' ? 'bg-[#efebd6] border-[#e6dcc6]' : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800'}`}>
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
