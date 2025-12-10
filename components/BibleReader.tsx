import React, { useState, useRef, useEffect } from 'react';
import { Verse, ReadingPreferences } from '../types';
import { Sparkles, X, Share2, Copy, Volume2, Square, Loader2, Link as LinkIcon, Image as ImageIcon, Play, Pause, MessageCircle, ArrowRight, MoreHorizontal } from 'lucide-react';
import { explainVerse, askVerse, generateAudioFromText } from '../services/geminiService';
import VerseImageGenerator from './VerseImageGenerator';

export interface BibleReaderRef {
  toggleAudio: () => void;
}

interface BibleReaderProps {
  book: string;
  chapter: number;
  verses: Verse[];
  preferences: ReadingPreferences;
  language: string;
  t: any;
  initialSelectedVerses?: number[];
  onSelectionChange?: (selected: number[]) => void;
  onAudioStateChange?: (isPlaying: boolean, isLoading: boolean) => void;
}

const BibleReader = React.forwardRef<BibleReaderRef, BibleReaderProps>(({
  book,
  chapter,
  verses,
  preferences,
  language,
  t,
  initialSelectedVerses = [],
  onSelectionChange,
  onAudioStateChange
}, ref) => {
  // Selection State
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set(initialSelectedVerses));

  // Action State
  const [activeAction, setActiveAction] = useState<'explain' | 'ask' | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [displayedResponse, setDisplayedResponse] = useState<string>("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [askQuery, setAskQuery] = useState('');
  const [showImageGenerator, setShowImageGenerator] = useState(false);

  // Audio State
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPlayingChunk, setCurrentPlayingChunk] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);

  // Refs for audio management
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const audioCacheRef = useRef<Map<number, AudioBuffer>>(new Map());
  const activeFetchRef = useRef<Set<number>>(new Set());

  // Refs for UI
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync audio state with parent
  useEffect(() => {
    onAudioStateChange?.(isPlaying, isAudioLoading);
  }, [isPlaying, isAudioLoading, onAudioStateChange]);

  // Typewriter Effect
  useEffect(() => {
    if (aiResponse && !isTyping && displayedResponse !== aiResponse) {
      setIsTyping(true);
      setDisplayedResponse("");
      let currentIndex = 0;

      const typeNextChar = () => {
        if (currentIndex < aiResponse.length) {
          setDisplayedResponse(aiResponse.slice(0, currentIndex + 1));
          currentIndex++;
          // Randomize typing speed slightly for realism (10ms - 30ms)
          const delay = Math.random() * 20 + 10;
          typingTimeoutRef.current = setTimeout(typeNextChar, delay);
        } else {
          setIsTyping(false);
        }
      };

      typeNextChar();
    } else if (!aiResponse) {
      setDisplayedResponse("");
      setIsTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [aiResponse]);


  // Expose toggleAudio to parent
  React.useImperativeHandle(ref, () => ({
    toggleAudio: () => {
      if (isPlaying) {
        stopAudio();
      } else {
        playAudio();
      }
    }
  }));

  // Sync initial selection
  useEffect(() => {
    if (initialSelectedVerses.length > 0) {
      setSelectedVerses(new Set(initialSelectedVerses));
    }
  }, [initialSelectedVerses]);

  // Notify parent of selection changes
  const onSelectionChangeRef = useRef(onSelectionChange);
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  useEffect(() => {
    onSelectionChangeRef.current?.(Array.from(selectedVerses).sort((a: number, b: number) => a - b));
  }, [selectedVerses]);

  // Stop audio on unmount/change
  useEffect(() => {
    return () => stopAudio();
  }, [book, chapter]);

  const handleVerseClick = (verse: Verse) => {
    const newSelection = new Set(selectedVerses);
    if (newSelection.has(verse.number)) {
      newSelection.delete(verse.number);
    } else {
      newSelection.add(verse.number);
    }
    setSelectedVerses(newSelection);

    // Reset AI state if selection changes
    if (activeAction) closeAiModal();
  };

  const clearSelection = () => {
    setSelectedVerses(new Set());
    closeAiModal();
  };

  const closeAiModal = () => {
    setActiveAction(null);
    setAiResponse(null);
    setDisplayedResponse("");
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setAskQuery('');
    setIsLoadingAi(false);
  };

  // --- ACTIONS ---

  const getSelectedText = () => {
    const sorted = Array.from(selectedVerses).sort((a: number, b: number) => a - b);
    return sorted.map(num => verses.find(v => v.number === num)?.text).join(' ');
  };

  const getSelectedRef = () => {
    const sorted = Array.from(selectedVerses).sort((a: number, b: number) => a - b);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    if (first === undefined) return "";
    if (first === last) return `${book} ${chapter}:${first}`;
    return `${book} ${chapter}:${first}-${last}`;
  };

  const getPrimaryVerseNum = () => {
    const sorted = Array.from(selectedVerses).sort((a: number, b: number) => a - b);
    return sorted[0];
  };

  const handleCopy = () => {
    const text = `${getSelectedText()}\n\n(${getSelectedRef()})`;
    navigator.clipboard.writeText(text);
    // Optional: Toast notification
    clearSelection();
  };

  const handleExplain = async () => {
    setActiveAction('explain');
    setIsLoadingAi(true);
    setAiResponse(null);

    const verseNum = getPrimaryVerseNum();
    if (!verseNum) return;

    try {
      const text = await explainVerse(book, chapter, verseNum, getSelectedText(), language);
      setAiResponse(text);
    } catch (e) {
      setAiResponse("Erro ao gerar explicação.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleAsk = () => {
    setActiveAction('ask');
    setAiResponse(null);
    setAskQuery('');
    // Focus input after render
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const submitQuestion = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!askQuery.trim()) return;

    setIsLoadingAi(true);
    const verseNum = getPrimaryVerseNum();

    try {
      const text = await askVerse(book, chapter, verseNum, getSelectedText(), askQuery, language);
      setAiResponse(text);
    } catch (e) {
      setAiResponse("Erro ao obter resposta.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  // --- AUDIO (Existing Logic) ---
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const pauseAudio = () => {
    isPlayingRef.current = false;
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) { }
      sourceNodeRef.current = null;
    }
    const globalAudio = (window as any)._activeBibleAudio;
    if (globalAudio) globalAudio.pause();
    setIsPlaying(false);
    setIsPaused(true);
    setIsAudioLoading(false);
  };

  const stopAudio = () => {
    pauseAudio();
    activeFetchRef.current.clear();
    audioCacheRef.current.clear();
    setCurrentPlayingChunk(0);
    const globalAudio = (window as any)._activeBibleAudio;
    if (globalAudio) {
      globalAudio.src = "";
      (window as any)._activeBibleAudio = null;
    }
    setIsPaused(false);
  };

  const playAudio = async () => {
    if (isPlaying) {
      pauseAudio();
      return;
    }

    setIsPlaying(true);
    setIsPaused(false);
    setIsAudioLoading(true);
    isPlayingRef.current = true;

    let startIndex = currentPlayingChunk;

    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    }

    if (audioContextRef.current.state === 'suspended') {
      try { await audioContextRef.current.resume(); } catch (e) { }
    }

    try {
      const unlockAudio = new Audio();
      unlockAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAgZGF0YQQAAAAAAA==";
      await unlockAudio.play();
    } catch (e) { }

    const chunks = verses.map(v => v.text.replace(/[*#_`\[\]]/g, ''));
    setTotalChunks(chunks.length);

    if (startIndex >= chunks.length) {
      startIndex = 0;
      setCurrentPlayingChunk(0);
    }

    processAudioQueue(chunks, startIndex);
  };

  const processAudioQueue = async (chunks: string[], startIndex: number) => {
    let index = startIndex;

    const playNext = async () => {
      if (!isPlayingRef.current) return;
      if (index >= chunks.length) {
        stopAudio();
        return;
      }

      setCurrentPlayingChunk(index);
      const verseElement = document.getElementById(`v${verses[index].number}`);
      if (verseElement) {
        verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      setIsAudioLoading(true);

      try {
        let audioBuffer: AudioBuffer | null = null;

        if (audioCacheRef.current.has(index) && audioCacheRef.current.get(index) instanceof AudioBuffer) {
          audioBuffer = audioCacheRef.current.get(index) as AudioBuffer;
        } else {
          const base64Data = await generateAudioFromText(chunks[index], preferences.voice || 'male');
          if (!isPlayingRef.current) return;

          if (base64Data && audioContextRef.current) {
            const ctx = audioContextRef.current;
            const binaryString = atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
            audioBuffer = await ctx.decodeAudioData(bytes.buffer);
            // @ts-ignore
            audioCacheRef.current.set(index, audioBuffer);
          }
        }

        if (!isPlayingRef.current) return;

        if (audioBuffer && audioContextRef.current) {
          const ctx = audioContextRef.current;
          const nextIndex = index + 1;
          if (nextIndex < chunks.length && !audioCacheRef.current.has(nextIndex) && !activeFetchRef.current.has(nextIndex)) {
            activeFetchRef.current.add(nextIndex);
            generateAudioFromText(chunks[nextIndex], preferences.voice || 'male')
              .then(async (data) => {
                if (data && isPlayingRef.current && audioContextRef.current) {
                  const bin = atob(data);
                  const b = new Uint8Array(bin.length);
                  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
                  const buf = await audioContextRef.current.decodeAudioData(b.buffer);
                  // @ts-ignore
                  audioCacheRef.current.set(nextIndex, buf);
                }
              })
              .finally(() => activeFetchRef.current.delete(nextIndex));
          }

          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          sourceNodeRef.current = source;

          source.onended = () => {
            if (isPlayingRef.current) {
              if (index > 2) audioCacheRef.current.delete(index - 2);
              index++;
              playNext();
            }
          };

          if (ctx.state === 'suspended') await ctx.resume();

          source.start(0);
          setIsAudioLoading(false);

        } else {
          index++;
          playNext();
        }
      } catch (err) {
        setIsAudioLoading(false);
        stopAudio();
      }
    };

    playNext();
  };


  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Verses List */}
      {/* Verses List */}
      <div className="space-y-4">
        {verses.map((verse) => {
          const isSelected = selectedVerses.has(verse.number);
          const isPlayingThisVerse = isPlaying && currentPlayingChunk === verses.findIndex(v => v.number === verse.number);
          const isAudioActive = verse.number === currentPlayingChunk; // Defined here

          // Determine if we should show the inline menu here
          // Logic: Show if this is the LAST selected verse
          const sortedSelection = Array.from(selectedVerses).map(n => Number(n)).sort((a, b) => a - b);
          const lastSelected = sortedSelection[sortedSelection.length - 1];
          const isLastSelected = verse.number === lastSelected;

          return (
            <React.Fragment key={verse.number}>
              <div
                onClick={() => handleVerseClick(verse)} // Click on wrapper, pass full object
                className={`flex gap-3 p-2 rounded-lg transition-all cursor-pointer duration-300
                        ${isSelected
                    ? (preferences.theme === 'bw' ? 'bg-stone-200/50 ring-1 ring-stone-300' : 'bg-yellow-200/50 dark:bg-yellow-900/30 ring-1 ring-yellow-400/50')
                    : isPlayingThisVerse
                      ? (preferences.theme === 'bw' ? 'bg-stone-100 ring-1 ring-stone-300' : 'bg-bible-gold/10 ring-1 ring-bible-gold/30')
                      : 'hover:bg-stone-100 dark:hover:bg-stone-800/50'}
                    `}
              >
                <span className={`text-xs font-bold select-none w-6 text-right pt-1.5 shrink-0
                  ${preferences.theme === 'bw' ? 'text-stone-500' : 'text-bible-gold/70'}`}>
                  {verse.number}
                </span>
                <p
                  className={`text-lg md:text-xl font-serif
                            ${preferences.fontFamily === 'sans' ? 'font-sans' : 'font-serif'}
                            ${preferences.textAlign === 'justify' ? 'text-justify' : 'text-left'}
                        `}
                  style={{
                    fontSize: `${preferences.fontSize}%`,
                    lineHeight: '1.6'
                  }}
                >
                  <span
                    id={`v${verse.number}`}
                    className={`
                        relative inline leading-loose transition-all duration-200 rounded px-1
                        ${isAudioActive && !isSelected
                        ? (preferences.theme === 'bw' ? 'bg-stone-100 ring-2 ring-stone-900/10' : 'bg-bible-gold/10 ring-2 ring-bible-gold/20')
                        : ''}
                      `}
                  >
                    <span className={isAudioActive ? (preferences.theme === 'bw' ? 'text-stone-900' : 'text-bible-accent dark:text-stone-200') : ''}>
                      {verse.text}
                    </span>
                  </span>
                </p>
              </div>

              {/* Inline Action Menu (Mobile Optimized) - Shows ONLY after the last selected verse */}
              {isLastSelected && !activeAction && (
                <div className="animate-slideDown overflow-hidden mt-2 mb-4">
                  <div className="bg-stone-50/80 dark:bg-stone-800/80 backdrop-blur-md rounded-2xl p-2 flex items-center justify-between gap-2 shadow-sm border border-stone-200 dark:border-stone-700/50 mx-2">

                    <button
                      onClick={(e) => { e.stopPropagation(); handleExplain(); }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl hover:bg-white dark:hover:bg-stone-700 transition-all active:scale-95 bg-white/50 dark:bg-stone-700/30 text-stone-700 dark:text-stone-200"
                    >
                      <span className="w-4 h-4 flex items-center justify-center rounded-full border border-bible-gold text-[10px] font-serif font-bold text-bible-gold">!</span>
                      <span className="text-xs font-medium">Explicar</span>
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleAsk(); }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl hover:bg-white dark:hover:bg-stone-700 transition-all active:scale-95 bg-white/50 dark:bg-stone-700/30 text-stone-700 dark:text-stone-200"
                    >
                      <MessageCircle size={16} className="text-bible-gold" />
                      <span className="text-xs font-medium">Perguntar</span>
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); setShowImageGenerator(true); }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl hover:bg-white dark:hover:bg-stone-700 transition-all active:scale-95 bg-white/50 dark:bg-stone-700/30 text-stone-700 dark:text-stone-200"
                    >
                      <ImageIcon size={16} className="text-bible-gold" />
                      <span className="text-xs font-medium">Imagem</span>
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                      className="flex items-center justify-center p-2 rounded-xl hover:bg-white dark:hover:bg-stone-700 transition-all active:scale-95 bg-white/50 dark:bg-stone-700/30 text-stone-500 dark:text-stone-400"
                      title="Copiar"
                    >
                      <Copy size={16} />
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); clearSelection(); }}
                      className="flex items-center justify-center p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95 text-stone-400 hover:text-red-500"
                      title="Fechar"
                    >
                      <X size={16} />
                    </button>

                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Floating Audio Player */}
      {(isPlaying || isPaused) && (
        <div className="fixed bottom-20 right-6 z-40 animate-slideUp">
          <div className={`p-4 rounded-full shadow-lg flex items-center gap-3 pr-6
             ${preferences.theme === 'sepia' ? 'bg-[#5c4b37] text-[#f4ecd8]' : 'bg-stone-900 text-white'}`}>
            <div className="flex gap-1 h-4 items-end">
              <span className={`w-1 bg-bible-gold ${(!isAudioLoading && isPlaying) ? 'animate-[bounce_1s_infinite]' : 'h-1'}`}></span>
              <span className={`w-1 bg-bible-gold ${(!isAudioLoading && isPlaying) ? 'animate-[bounce_1.2s_infinite]' : 'h-1'}`}></span>
              <span className={`w-1 bg-bible-gold ${(!isAudioLoading && isPlaying) ? 'animate-[bounce_0.8s_infinite]' : 'h-1'}`}></span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{t.listeningTo} {book} {chapter}</span>
              {totalChunks > 0 && (
                <span className="text-[10px] opacity-70">
                  Versículo {currentPlayingChunk + 1} / {totalChunks}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={playAudio}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-bible-gold/20 hover:bg-bible-gold/30 text-bible-gold transition-colors"
              >
                {isPlaying ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current" />}
              </button>
              <button
                onClick={stopAudio}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors"
              >
                <Square size={16} className="fill-current" />
              </button>
            </div>
          </div>
        </div>
      )}



      {/* AI Action Modal (Bottom Sheet - Fixed) */}
      {activeAction && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={closeAiModal}>
          <div
            ref={modalRef}
            className="w-full max-w-4xl mx-auto bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.2)] animate-slideUp overflow-hidden max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag Handle / Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-stone-100 dark:border-stone-800 shrink-0 bg-stone-50 dark:bg-stone-900 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-bible-gold/10 text-bible-gold flex items-center justify-center`}>
                  {activeAction === 'explain' ? (
                    <span className="w-5 h-5 flex items-center justify-center rounded-full border border-current text-[12px] font-serif font-bold">!</span>
                  ) : (
                    <MessageCircle size={20} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-white leading-none">
                    {activeAction === 'explain' ? 'Explicar' : 'Pergunta'}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">
                    {getSelectedRef()}
                  </p>
                </div>
              </div>
              <button onClick={closeAiModal} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                <X size={24} />
              </button>
            </div>

            {/* Dynamic Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">

              {/* 1. Prompt Bubble (User) */}
              {activeAction === 'ask' && (
                <div className="flex justify-end">
                  <div className="bg-stone-100 dark:bg-stone-800 px-5 py-3 rounded-2xl rounded-tr-sm text-[15px] text-stone-700 dark:text-stone-200 max-w-[90%] shadow-sm">
                    {askQuery || "Qual é a sua dúvida sobre este versículo?"}
                  </div>
                </div>
              )}

              {/* Answer/Input Area */}
              {activeAction === 'ask' && !aiResponse && !isLoadingAi ? (
                <form onSubmit={submitQuestion} className="w-full relative mt-4">
                  <input
                    ref={inputRef}
                    type="text"
                    value={askQuery}
                    onChange={e => setAskQuery(e.target.value)}
                    placeholder="Digite sua pergunta aqui..."
                    className="w-full bg-stone-50 dark:bg-stone-800/100 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-4 pr-12 text-base text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-bible-gold/50 transition-all font-sans"
                  />
                  <button
                    type="submit"
                    disabled={!askQuery.trim()}
                    className="absolute right-3 top-3 p-1.5 bg-bible-gold text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-600 transition-colors shadow-sm"
                  >
                    <ArrowRight size={20} />
                  </button>
                </form>
              ) : (
                /* AI Response Bubble */
                <div className="flex justify-start w-full">
                  {isLoadingAi ? (
                    <div className="flex flex-col gap-3 max-w-[90%]">
                      <div className="flex items-center gap-3 px-4 py-3 bg-stone-50 dark:bg-stone-800 rounded-2xl rounded-tl-sm w-fit">
                        <Loader2 size={18} className="animate-spin text-bible-gold" />
                        <span className="text-sm text-stone-500 dark:text-stone-400 font-medium animate-pulse">Consultando conhecimento bíblico...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative w-full">
                      <div className="bg-stone-50 dark:bg-stone-800/60 px-6 py-5 rounded-2xl rounded-tl-sm text-[16px] leading-relaxed text-stone-800 dark:text-stone-200 w-full shadow-sm border border-stone-100 dark:border-stone-700/50">
                        <div className="prose prose-stone dark:prose-invert max-w-none prose-p:my-3 prose-strong:text-bible-gold prose-a:text-bible-gold prose-headings:text-stone-900 dark:prose-headings:text-white">
                          {/* Decorative Quote Icon */}
                          <div className="absolute -top-3 -left-2 text-bible-gold/20 pointer-events-none">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" /></svg>
                          </div>

                          {displayedResponse && displayedResponse.split('\n').map((line, i) => (
                            <p key={i} dangerouslySetInnerHTML={{
                              __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            }} />
                          ))}
                          {isTyping && (
                            <span className="inline-block w-1.5 h-4 bg-bible-gold ml-1 animate-pulse align-middle"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer / Action (only if answer is present) */}
              {aiResponse && !isLoadingAi && (
                <div className="flex justify-center pt-2 pb-6">
                  <button onClick={closeAiModal} className="w-full py-3.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors shadow-sm">
                    Fechar
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {showImageGenerator && (
        <VerseImageGenerator
          verseText={getSelectedText()}
          verseReference={getSelectedRef()}
          onClose={() => setShowImageGenerator(false)}
        />
      )}

    </div>
  );
});

export default BibleReader;