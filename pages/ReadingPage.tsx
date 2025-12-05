import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronRight, Minimize, Maximize, List, AlignLeft, Type, Volume2, Square, Loader2 } from 'lucide-react';
import { bibleBooks, normalizeBookName, findBookByNormalizedName } from '../constants';
import { chapterTitles } from '../data/chapterTitles';
import { getChapterContent, getFluidChapterContent, generateAudioFromText } from '../services/geminiService';
import { Verse, FluidChapterContent, ReadingPreferences } from '../types';
import BibleReader, { BibleReaderRef } from '../components/BibleReader';
import { AdUnit } from '../components/AdUnit';

interface ReadingPageProps {
    language: string;
    t: any;
    preferences: ReadingPreferences;
    onUpdatePreferences: (newPrefs: ReadingPreferences) => void;
    isFullScreen: boolean;
    setIsFullScreen: (v: boolean) => void;
    addToHistory: (book: string, chapter: number) => void;
}

const ReadingPage: React.FC<ReadingPageProps> = ({
    language,
    t,
    preferences,
    onUpdatePreferences,
    isFullScreen,
    setIsFullScreen,
    addToHistory
}) => {
    // ... existing hooks ...
    const { bookAbbrev, chapterNum } = useParams<{ bookAbbrev: string; chapterNum: string }>();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // State Declarations
    const [chapterContent, setChapterContent] = useState<Verse[]>([]);
    const [fluidContent, setFluidContent] = useState<FluidChapterContent | null>(null);
    const [fluidError, setFluidError] = useState<string | null>(null);
    const [loadingContent, setLoadingContent] = useState(false);

    // Get mode from URL, default to 'verse'
    const readingMode = (searchParams.get('mode') as 'verse' | 'fluid') || 'verse';

    // Parse selected verses from URL (e.g. ?verses=1,2,3 or 1-5)
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
            // Compress to ranges
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

    const setReadingMode = (mode: 'verse' | 'fluid') => {
        setSearchParams({ mode });
    };

    // Find book by abbreviation or name (handling URL params)
    const currentBook = findBookByNormalizedName(bookAbbrev || '') || bibleBooks[0];
    const currentChapter = parseInt(chapterNum || '1', 10);

    useEffect(() => {
        const loadChapter = async () => {
            setLoadingContent(true);
            setFluidContent(null);
            setFluidError(null);
            try {
                addToHistory(currentBook.name, currentChapter);
                const verses = await getChapterContent(currentBook.name, currentChapter, language);
                setChapterContent(verses);

                if (readingMode === 'fluid') {
                    const fluid = await getFluidChapterContent(currentBook.name, currentChapter, language);
                    if (fluid && 'error' in fluid) {
                        setFluidError(fluid.error);
                    } else if (fluid) {
                        setFluidContent(fluid as FluidChapterContent);
                    } else {
                        setFluidError("Erro desconhecido.");
                    }
                }
            } catch (error) {
                console.error("Failed to load chapter", error);
                setFluidError("Erro ao carregar conteúdo.");
            } finally {
                setLoadingContent(false);
            }
        };

        loadChapter();
    }, [currentBook.name, currentChapter, language, readingMode]); // Use primitive values for dependency array

    const navigateTo = (bookName: string, chapter: number) => {
        // Immediate feedback is handled by the router, but we can ensure no heavy lifting here
        const normalizedBook = normalizeBookName(bookName);
        navigate(`/leitura/${normalizedBook}/${chapter}?mode=${readingMode}`);
    };

    const staticTitle = chapterTitles[currentBook.name]?.[currentChapter];

    // Calculate Next/Prev Chapter
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
    if (readingMode === 'fluid') {
        const titleText = staticTitle || fluidContent?.title;
        if (titleText) {
            pageTitle = `${currentBook.name} ${currentChapter} - ${titleText} - ${t.appTitle}`;
        } else {
            pageTitle = `${currentBook.name} ${currentChapter} - Leitura - ${t.appTitle}`;
        }
    } else {
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
            pageTitle = `${currentBook.name} ${currentChapter} – ${versePart} – ${t.appTitle}`;
        } else {
            pageTitle = `${currentBook.name} ${currentChapter} – Versículos – ${t.appTitle}`;
        }
    }

    // Audio State
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPlayingChunk, setCurrentPlayingChunk] = useState<number>(0);
    const [totalChunks, setTotalChunks] = useState<number>(0);

    // Refs for audio management
    const audioContextRef = React.useRef<AudioContext | null>(null);
    const sourceNodeRef = React.useRef<AudioBufferSourceNode | null>(null);
    const isPlayingRef = React.useRef<boolean>(false);
    const audioCacheRef = React.useRef<Map<number, AudioBuffer>>(new Map());
    const activeFetchRef = React.useRef<Set<number>>(new Set());

    // Verse Mode Audio State
    const bibleReaderRef = React.useRef<BibleReaderRef>(null);
    const [isVerseAudioPlaying, setIsVerseAudioPlaying] = useState(false);
    const [isVerseAudioLoading, setIsVerseAudioLoading] = useState(false);

    // Stop audio when component unmounts or book/chapter changes
    useEffect(() => {
        return () => stopAudio();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookAbbrev, chapterNum, readingMode]);

    const initAudioContext = async () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }
    };

    const stopAudio = () => {
        isPlayingRef.current = false;
        if (sourceNodeRef.current) {
            try {
                sourceNodeRef.current.stop();
            } catch (e) { }
            sourceNodeRef.current = null;
        }
        // Ensure Web Speech also stops
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
        setIsAudioLoading(false);
        audioCacheRef.current.clear();
        activeFetchRef.current.clear();
        setCurrentPlayingChunk(0);

        if (audioContextRef.current) {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }
    };

    const playFluidAudio = async () => {
        if (isPlaying) {
            stopAudio();
            return;
        }

        if (!fluidContent?.paragraphs) return;

        // iOS requires AudioContext to be created/resumed synchronously within a user gesture
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }

        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        setIsPlaying(true);
        isPlayingRef.current = true;
        setIsAudioLoading(true);

        try {
            // await initAudioContext(); // Removed as it's now handled above
            // Strip markdown (asterisks, etc) for clean reading
            const chunks = fluidContent.paragraphs.map(p =>
                p.replace(/[*#_`\[\]]/g, '')
            );
            setTotalChunks(chunks.length);
            processAudioQueue(chunks);
        } catch (error) {
            console.error("Audio Init Error", error);
            stopAudio();
        }
    };

    const processAudioQueue = async (chunks: string[]) => {
        let chunkIndex = 0;
        const MAX_RETRIES = 2;
        const retryCounts = new Map<number, number>();
        let useWebSpeech = false;

        // Helper for Web Speech API
        const speakWithWebSpeech = (text: string): Promise<void> => {
            return new Promise((resolve, reject) => {
                if (!window.speechSynthesis) {
                    reject("Web Speech API not supported");
                    return;
                }

                window.speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR';
                utterance.rate = 1.0;

                const voices = window.speechSynthesis.getVoices();
                const preferredGender = preferences.voice || 'male';

                const selectedVoice = voices.find(v =>
                    v.lang.startsWith(utterance.lang.split('-')[0]) &&
                    (preferredGender === 'female' ? v.name.includes('Female') || v.name.includes('Maria') : v.name.includes('Male') || v.name.includes('David'))
                ) || voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0]));

                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }

                utterance.onend = () => resolve();
                utterance.onerror = (e) => reject(e);

                window.speechSynthesis.speak(utterance);
            });
        };

        const fetchChunk = async (index: number) => {
            if (useWebSpeech) return;
            if (activeFetchRef.current.has(index) || audioCacheRef.current.has(index)) return;
            if (index >= chunks.length) return;

            const currentRetries = retryCounts.get(index) || 0;
            if (currentRetries >= MAX_RETRIES) {
                console.warn(`Max retries reached for chunk ${index}. Switching to Web Speech API.`);
                useWebSpeech = true;
                return;
            }

            activeFetchRef.current.add(index);

            try {
                // generateAudioFromText returns an AudioBuffer (already decoded)
                const audioBuffer = await generateAudioFromText(chunks[index], preferences.voice || 'male');
                if (audioBuffer) {
                    audioCacheRef.current.set(index, audioBuffer);
                } else {
                    throw new Error("No audio data returned");
                }
            } catch (err) {
                console.error(`Error fetching chunk ${index}`, err);
                retryCounts.set(index, currentRetries + 1);
                if (index === 0) useWebSpeech = true;
            } finally {
                activeFetchRef.current.delete(index);
            }
        };

        // Initial pre-fetch
        fetchChunk(0);
        fetchChunk(1);

        const playNextChunk = async () => {
            if (!isPlayingRef.current) return;

            if (chunkIndex >= chunks.length) {
                stopAudio();
                return;
            }

            setCurrentPlayingChunk(chunkIndex);

            if (useWebSpeech) {
                setIsAudioLoading(false);
                try {
                    await speakWithWebSpeech(chunks[chunkIndex]);
                    chunkIndex++;
                    playNextChunk();
                } catch (e) {
                    console.error("Web Speech API failed", e);
                    stopAudio();
                }
                return;
            }

            // Ensure current chunk is ready
            let attempts = 0;
            while (!audioCacheRef.current.has(chunkIndex) && isPlayingRef.current && !useWebSpeech) {
                await new Promise(r => setTimeout(r, 200));
                attempts++;

                if (useWebSpeech) break;

                if (attempts > 30) {
                    console.warn("Timeout waiting for audio. Switching to fallback.");
                    useWebSpeech = true;
                    break;
                }

                if (!activeFetchRef.current.has(chunkIndex) && !audioCacheRef.current.has(chunkIndex)) {
                    fetchChunk(chunkIndex);
                }
            }

            if (!isPlayingRef.current) return;

            if (useWebSpeech) {
                playNextChunk();
                return;
            }

            const buffer = audioCacheRef.current.get(chunkIndex);
            if (buffer) {
                setIsAudioLoading(false);

                const source = audioContextRef.current!.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContextRef.current!.destination);
                source.onended = () => {
                    chunkIndex++;
                    playNextChunk();
                };
                sourceNodeRef.current = source;
                source.start();

                if (chunkIndex + 2 < chunks.length) fetchChunk(chunkIndex + 2);
                if (chunkIndex > 2) audioCacheRef.current.delete(chunkIndex - 2);
            }
        };

        playNextChunk();
    };


    // ... existing code ...

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 lg:p-12 pb-8">
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={`Leia ${currentBook.name} ${currentChapter} na Bíblia Sagrada. ${readingMode === 'fluid' ? 'Leitura fluida e moderna.' : 'Versículo por versículo.'}`} />
                <link rel="canonical" href={window.location.href} />
            </Helmet>

            <header className={`mb-8 text-center border-b pb-8 transition-colors relative z-10
         ${preferences.theme === 'sepia' ? 'border-[#e6dcc6]' : 'border-stone-200 dark:border-stone-800'}`}>
                {/* ... existing header content ... */}

                {/* Chapter Title & Navigation */}
                <div className="flex items-center justify-between max-w-xl mx-auto mb-8">
                    {prevChapter ? (
                        <button
                            onClick={() => navigateTo(prevChapter.book, prevChapter.chapter)}
                            className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-bible-gold transition-colors"
                            title="Capítulo Anterior"
                        >
                            <ChevronRight className="rotate-180" size={24} />
                        </button>
                    ) : <div className="w-10" />}

                    <div className="text-center">
                        <h1 className="text-2xl md:text-3xl font-serif font-bold text-bible-accent dark:text-bible-gold">
                            {currentBook.name} {currentChapter}
                        </h1>
                        {staticTitle && (
                            <p className="text-sm text-stone-500 dark:text-stone-400 font-medium italic mt-1">
                                {staticTitle}
                            </p>
                        )}
                    </div>

                    {nextChapter ? (
                        <button
                            onClick={() => navigateTo(nextChapter.book, nextChapter.chapter)}
                            className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-bible-gold transition-colors"
                            title="Próximo Capítulo"
                        >
                            <ChevronRight size={24} />
                        </button>
                    ) : <div className="w-10" />}
                </div>

                {/* Controls Row: Mode Toggle + Font Slider + Audio (Fluid Only) */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-6">
                    {/* Mode Toggle */}
                    <div className={`flex items-center p-1 rounded-lg border transition-colors
            ${preferences.theme === 'sepia' ? 'bg-[#e6dcc6]/50 border-[#d6cba6]' : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700'}`}>
                        <button
                            onClick={() => setReadingMode('verse')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2
                ${readingMode === 'verse'
                                    ? (preferences.theme === 'sepia' ? 'bg-[#f4ecd8] shadow-sm text-[#5c4b37]' : 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100')
                                    : 'opacity-50 hover:opacity-100'}`}
                        >
                            <List size={14} />
                            Versículos
                        </button>
                        <button
                            onClick={() => setReadingMode('fluid')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2
                ${readingMode === 'fluid'
                                    ? (preferences.theme === 'sepia' ? 'bg-[#f4ecd8] shadow-sm text-[#5c4b37]' : 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100')
                                    : 'opacity-50 hover:opacity-100'}`}
                        >
                            <AlignLeft size={14} />
                            Leitura Fluida
                        </button>
                    </div>

                    {/* Controls Group: Font Slider + Audio */}
                    <div className="flex flex-row items-center gap-4 overflow-x-auto max-w-full pb-2 md:pb-0 scrollbar-hide">
                        {/* Font Size Slider */}
                        <div className="flex items-center gap-3 bg-stone-100 dark:bg-stone-800 px-4 py-2 rounded-lg shrink-0">
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

                        {/* Audio Button (Fluid & Verse) */}
                        <button
                            onClick={() => {
                                if (readingMode === 'fluid') {
                                    playFluidAudio();
                                } else {
                                    bibleReaderRef.current?.toggleAudio();
                                }
                            }}
                            className={`px-4 py-2 rounded-lg transition-all shadow-sm flex items-center gap-2 shrink-0
                                ${(readingMode === 'fluid' ? isPlaying : isVerseAudioPlaying)
                                    ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-bible-gold text-white hover:bg-yellow-600'}`}
                        >
                            {(readingMode === 'fluid' ? isAudioLoading : isVerseAudioLoading) ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (readingMode === 'fluid' ? isPlaying : isVerseAudioPlaying) ? (
                                <>
                                    <Square size={16} fill="currentColor" />
                                    <span className="text-sm font-bold">Parar</span>
                                </>
                            ) : (
                                <>
                                    <Volume2 size={16} />
                                    <span className="text-sm font-bold">Ouvir</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Floating Audio Indicator for Fluid Mode */}
            {isPlaying && readingMode === 'fluid' && (
                <div className="fixed bottom-20 right-6 z-40 animate-slideUp">
                    <div className={`p-4 rounded-full shadow-lg flex items-center gap-3 pr-6
                      ${preferences.theme === 'sepia' ? 'bg-[#5c4b37] text-[#f4ecd8]' : 'bg-stone-900 text-white'}`}>
                        <div className="flex gap-1 h-4 items-end">
                            <span className={`w-1 bg-bible-gold ${!isAudioLoading ? 'animate-[bounce_1s_infinite]' : 'h-1'}`}></span>
                            <span className={`w-1 bg-bible-gold ${!isAudioLoading ? 'animate-[bounce_1.2s_infinite]' : 'h-1'}`}></span>
                            <span className={`w-1 bg-bible-gold ${!isAudioLoading ? 'animate-[bounce_0.8s_infinite]' : 'h-1'}`}></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Ouvindo {currentBook.name} {currentChapter}</span>
                            {totalChunks > 0 && (
                                <span className="text-[10px] opacity-70">
                                    Parágrafo {currentPlayingChunk + 1} / {totalChunks}
                                </span>
                            )}
                        </div>

                        <button onClick={stopAudio} className="ml-2 hover:text-red-400 transition-colors">
                            <Square size={16} className="fill-current" />
                        </button>
                    </div>
                </div>
            )}

            {loadingContent ? (
                <div className="space-y-4 animate-pulse max-w-2xl mx-auto">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className={`h-4 rounded w-full ${preferences.theme === 'sepia' ? 'bg-[#e6dcc6]' : 'bg-stone-200 dark:bg-stone-800'}`}></div>
                    ))}
                </div>
            ) : (
                <>
                    {readingMode === 'fluid' ? (
                        fluidError ? (
                            <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                                <p className="font-bold mb-2 text-lg">Limite de Leitura Atingido</p>
                                <p className="mb-4 opacity-80">
                                    {fluidError.includes('429') || fluidError.includes('Quota')
                                        ? "O sistema de IA está sobrecarregado no momento (Muitas requisições). Por favor, aguarde alguns instantes e tente novamente."
                                        : "Ocorreu um erro ao gerar a leitura fluida."}
                                </p>
                                {process.env.NODE_ENV === 'development' && (
                                    <details className="text-xs text-left bg-black/5 p-2 rounded mb-4 overflow-auto max-h-32">
                                        <summary className="cursor-pointer mb-1 font-bold">Detalhes Técnicos</summary>
                                        {fluidError}
                                    </details>
                                )}
                                <button
                                    onClick={() => setReadingMode('verse')}
                                    className="px-6 py-2 bg-red-100 dark:bg-red-900/40 rounded-lg hover:bg-red-200 transition-colors font-medium"
                                >
                                    Voltar para Versículos
                                </button>
                            </div>
                        ) : fluidContent ? (
                            <div className="animate-fadeIn">
                                <h2 className="text-2xl md:text-3xl font-serif font-bold mb-8 text-center text-bible-accent dark:text-bible-gold">
                                    {fluidContent.title}
                                </h2>
                                <div
                                    className={`prose max-w-none leading-relaxed transition-all duration-200
                                        ${preferences.theme === 'dark' ? 'prose-invert' : ''}
                                        ${preferences.theme === 'sepia' ? 'text-[#5c4b37]' : 'text-stone-800 dark:text-stone-200'}
                                        ${preferences.fontFamily === 'serif' ? 'font-serif' : 'font-sans'}
                                        ${preferences.textAlign === 'justify' ? 'text-justify' : 'text-left'}
                                    `}
                                >
                                    {fluidContent.paragraphs.map((paragraph, i) => (
                                        <p
                                            key={i}
                                            className="mb-6"
                                            style={{ fontSize: `${preferences.fontSize}%` }}
                                            dangerouslySetInnerHTML={{
                                                __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="mt-12 p-6 rounded-xl bg-bible-gold/10 border border-bible-gold/20 text-center">
                                    <p className="text-sm opacity-70 italic">
                                        * Este texto foi adaptado por Inteligência Artificial para proporcionar uma leitura mais fluida e moderna.
                                        Para estudo doutrinário preciso, recomendamos o modo "Versículos" que utiliza o texto original.
                                    </p>
                                </div>
                            </div>
                        ) : null
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
                    )}

                    {/* Bottom Navigation */}
                    <div className="flex justify-between items-center mt-12 pt-8 border-t border-stone-200 dark:border-stone-800">
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

                    <AdUnit className="mt-12" />
                </>
            )}
        </div>
    );
};

export default ReadingPage;
