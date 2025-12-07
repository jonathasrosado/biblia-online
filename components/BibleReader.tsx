import React, { useState, useRef, useEffect } from 'react';
import { Verse, ReadingPreferences } from '../types';
import { Sparkles, X, Share2, Copy, Volume2, Square, Loader2, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { explainVerse, generateAudioFromText } from '../services/geminiService';
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
  // Selection State (Multi-select)
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set(initialSelectedVerses));

  // Explanation State (Single verse focus for AI)
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  // Audio State
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingChunk, setCurrentPlayingChunk] = useState<number>(0);
  const [totalChunks, setTotalChunks] = useState<number>(0);

  // Refs for audio management
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const isPlayingRef = useRef<boolean>(false); // Ref to track status inside async callbacks
  const audioCacheRef = useRef<Map<number, AudioBuffer>>(new Map());
  const activeFetchRef = useRef<Set<number>>(new Set()); // Track what is currently being fetched

  // Sync audio state with parent
  useEffect(() => {
    onAudioStateChange?.(isPlaying, isAudioLoading);
  }, [isPlaying, isAudioLoading, onAudioStateChange]);

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

  // Sync initial selection if prop changes
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

  // Stop audio when component unmounts or book/chapter changes
  useEffect(() => {
    return () => stopAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, chapter]);

  const handleVerseClick = (verse: Verse) => {
    const newSelection = new Set(selectedVerses);
    if (newSelection.has(verse.number)) {
      newSelection.delete(verse.number);
    } else {
      newSelection.add(verse.number);
    }
    setSelectedVerses(newSelection);

    // Clear explanation if we are changing selection logic
    setExplanation(null);
  };

  const clearSelection = () => {
    setSelectedVerses(new Set());
    setExplanation(null);
  };

  const handleExplain = async () => {
    // For explanation, we prioritize the first selected verse or the lowest number
    const targetVerseNum = Array.from(selectedVerses).sort((a: number, b: number) => a - b)[0];
    if (targetVerseNum === undefined) return;

    const verseText = verses.find(v => v.number === targetVerseNum)?.text || "";

    setLoadingExplanation(true);
    try {
      const text = await explainVerse(book, chapter, targetVerseNum as number, verseText, language);
      setExplanation(text);
    } catch (error) {
      console.error("Explanation Error", error);
      setExplanation("Erro ao gerar explicação. Tente novamente.");
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleCopy = () => {
    const text = `${getSelectedText()}\n\n(${getSelectedRef()})`;
    navigator.clipboard.writeText(text);
    clearSelection();
  };

  const handleShareLink = () => {
    // The URL update is handled by the parent via onSelectionChange,
    // so we just copy the current URL
    navigator.clipboard.writeText(window.location.href);
    alert('Link copiado!');
  };

  const getSelectedText = () => {
    const sorted = Array.from(selectedVerses).sort((a: number, b: number) => a - b);
    return sorted.map(num => verses.find(v => v.number === num)?.text).join(' ');
  };

  const getSelectedRef = () => {
    const sorted = Array.from(selectedVerses).sort((a: number, b: number) => a - b);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    if (first === undefined) return ""; // No verses selected

    if (first === last) {
      return `${book} ${chapter}:${first}`;
    } else {
      return `${book} ${chapter}:${first}-${last}`;
    }
  };

  // --- AUDIO LOGIC (Robust iOS/Safari Implementation) ---

  // Use a ref to keep a single Audio instance
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = () => {
    // Stop Web Audio API Source
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      sourceNodeRef.current = null;
    }

    // Legacy Audio Element Cleanup
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setIsPlaying(false);
    setIsAudioLoading(false);
    activeFetchRef.current.clear();
    setCurrentPlayingChunk(0);
    isPlayingRef.current = false;
  };

  const playAudio = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    console.log("[🎵 BibleReader] User clicked play audio");
    setIsPlaying(true);
    setIsAudioLoading(true);
    isPlayingRef.current = true;

    // PRIME THE AUDIO ELEMENT (CRITICAL FOR IOS)
    // We create the audio element synchronously during the click event.

    // iOS UNLOCK HACK: Play silent HTML5 audio to force "Playback" category
    // This makes the iPhone treat this as "Music" (plays even with Silent Switch ON)
    const unlockAudio = new Audio();
    unlockAudio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAgZGF0YQQAAAAAAA==";
    try {
      await unlockAudio.play();
      console.log("[📱] iOS Audio Session Unlocked");
    } catch (e) {
      console.warn("[⚠️] iOS Unlock failed:", e);
    }

    // Initialize Audio Context (must be done on user gesture)
    if (!audioContextRef.current) {
      console.log("[🎵] Initializing AudioContext...");
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }

    // Resume if suspended (common in browsers)
    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
        console.log("[✅] AudioContext resumed");
      } catch (e) {
        console.error("[⚠️] Failed to resume AudioContext:", e);
      }
    }

    const chunks = verses.map(v => v.text.replace(/[*#_`\[\]]/g, ''));
    setTotalChunks(chunks.length);
    console.log(`[🎵 BibleReader] Starting queue with ${chunks.length} chunks...`);

    processAudioQueue(chunks, 0);
  };

  const processAudioQueue = async (chunks: string[], startIndex: number) => {
    let index = startIndex;

    // Recursive function to play chunks
    const playNext = async () => {
      // 1. Strict Stop Check
      if (!isPlayingRef.current) {
        console.log("[Audio] Stopped by user");
        return;
      }

      // 2. End of Queue Check
      if (index >= chunks.length) {
        stopAudio();
        return;
      }

      setCurrentPlayingChunk(index);

      // Scroll to verse
      const verseElement = document.getElementById(`v${verses[index].number}`);
      if (verseElement) {
        verseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      setIsAudioLoading(true);

      try {
        let audioBuffer: AudioBuffer | null = null;

        // 1. Check Cache
        if (audioCacheRef.current.has(index)) {
          console.log(`[⚡] Using cached buffer for ${index}`);
          audioBuffer = audioCacheRef.current.get(index)!;
        } else {
          // 2. Generate and Decode if not in cache
          console.log(`[🎵] Generating audio for chunk ${index}/${chunks.length - 1}...`);
          const base64Data = await generateAudioFromText(chunks[index], preferences.voice || 'male');

          if (!isPlayingRef.current) return;

          if (base64Data && audioContextRef.current) {
            const ctx = audioContextRef.current;
            const binaryString = atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

            audioBuffer = await ctx.decodeAudioData(bytes.buffer);
            audioCacheRef.current.set(index, audioBuffer);
          }
        }

        if (!isPlayingRef.current) return;

        if (audioBuffer && audioContextRef.current) {
          const ctx = audioContextRef.current;

          // --- PREFETCH NEXT CHUNK (GAPLESS LOGIC) ---
          const nextIndex = index + 1;
          if (nextIndex < chunks.length && !audioCacheRef.current.has(nextIndex) && !activeFetchRef.current.has(nextIndex)) {
            console.log(`[🚀] Prefetching chunk ${nextIndex}...`);
            activeFetchRef.current.add(nextIndex);

            // Fetch in background
            generateAudioFromText(chunks[nextIndex], preferences.voice || 'male')
              .then(async (data) => {
                if (data && isPlayingRef.current && audioContextRef.current) {
                  const bin = atob(data);
                  const b = new Uint8Array(bin.length);
                  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
                  const buf = await audioContextRef.current.decodeAudioData(b.buffer);
                  audioCacheRef.current.set(nextIndex, buf);
                  console.log(`[📥] Prefetched chunk ${nextIndex} ready`);
                }
              })
              .catch(e => console.warn("Prefetch failed", e))
              .finally(() => activeFetchRef.current.delete(nextIndex));
          }
          // -------------------------------------------

          console.log(`[▶️] Playing buffer ${index} (Duration: ${audioBuffer.duration.toFixed(2)}s)`);

          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          sourceNodeRef.current = source;


          source.onended = () => {
            if (isPlayingRef.current) {
              // Cleanup old cache to save memory (keep last 2)
              if (index > 2) audioCacheRef.current.delete(index - 2);

              index++;
              playNext();
            }
          };

          // iOS Safety: Ensure context is running immediately before play
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }

          source.start(0);
          setIsAudioLoading(false);

        } else {
          console.error("Audio failed or Context missing.");
          setIsAudioLoading(false);
          stopAudio();
        }

      } catch (err) {
        console.error("Audio playback error", err);
        setIsAudioLoading(false);
        stopAudio();
      }
    };

    playNext();
  };

  // Helper for Web Speech API (Fallback) - DEACTIVATED
  const speakWithWebSpeech = (text: string): Promise<void> => {
    return Promise.resolve();
  };

  // Image Generator State
  const [showImageGenerator, setShowImageGenerator] = useState(false);

  const handleOpenImageGenerator = () => {
    setShowImageGenerator(true);
  };



  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Verses List */}
      <div className="space-y-4">
        {verses.map((verse) => {
          const isSelected = selectedVerses.has(verse.number);
          const isPlayingThisVerse = isPlaying && currentPlayingChunk === verses.findIndex(v => v.number === verse.number);
          return (
            <div
              key={verse.number}
              id={`v${verse.number}`}
              onClick={() => handleVerseClick(verse)}
              className={`flex gap-3 p-2 rounded-lg transition-all cursor-pointer duration-300
                        ${isSelected
                  ? 'bg-yellow-200/50 dark:bg-yellow-900/30 ring-1 ring-yellow-400/50'
                  : isPlayingThisVerse
                    ? 'bg-bible-gold/10 ring-1 ring-bible-gold/30'
                    : 'hover:bg-stone-100 dark:hover:bg-stone-800/50'}
                    `}
            >
              <span className="text-xs font-bold text-bible-gold/70 select-none w-6 text-right pt-1.5 shrink-0">
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
                {verse.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* Floating Audio Player Indicator (visible when playing) */}
      {isPlaying && (
        <div className="fixed bottom-20 right-6 z-40 animate-slideUp">
          <div className={`p-4 rounded-full shadow-lg flex items-center gap-3 pr-6
             ${preferences.theme === 'sepia' ? 'bg-[#5c4b37] text-[#f4ecd8]' : 'bg-stone-900 text-white'}`}>
            <div className="flex gap-1 h-4 items-end">
              <span className={`w-1 bg-bible-gold ${!isAudioLoading ? 'animate-[bounce_1s_infinite]' : 'h-1'}`}></span>
              <span className={`w-1 bg-bible-gold ${!isAudioLoading ? 'animate-[bounce_1.2s_infinite]' : 'h-1'}`}></span>
              <span className={`w-1 bg-bible-gold ${!isAudioLoading ? 'animate-[bounce_0.8s_infinite]' : 'h-1'}`}></span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{t.listeningTo} {book} {chapter}</span>
              {totalChunks > 0 && (
                <span className="text-[10px] opacity-70">
                  {t.excerpt} {currentPlayingChunk + 1} / {totalChunks}
                </span>
              )}
            </div>

            <button onClick={stopAudio} className="ml-2 hover:text-red-400 transition-colors">
              <Square size={16} className="fill-current" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Menu (When verses are selected) */}
      {selectedVerses.size > 0 && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-white dark:bg-stone-900 shadow-2xl border border-stone-200 dark:border-stone-700 rounded-full px-6 py-3 flex items-center gap-4 z-50 animate-slideUp">
          <span className="text-sm font-bold text-stone-500 dark:text-stone-400 border-r border-stone-200 dark:border-stone-700 pr-4">
            {selectedVerses.size} selecionado{selectedVerses.size > 1 ? 's' : ''}
          </span>

          <button
            onClick={handleCopy}
            className="flex flex-col items-center gap-1 text-stone-600 dark:text-stone-300 hover:text-bible-gold transition-colors"
            title="Copiar Texto"
          >
            <Copy size={20} />
          </button>

          <button
            onClick={handleOpenImageGenerator}
            className="flex flex-col items-center gap-1 text-stone-600 dark:text-stone-300 hover:text-bible-gold transition-colors"
            title="Criar Imagem"
          >
            <ImageIcon size={20} />
          </button>

          <button
            onClick={handleExplain}
            className="flex flex-col items-center gap-1 text-stone-600 dark:text-stone-300 hover:text-bible-gold transition-colors"
            title="Explicar com IA"
          >
            <Sparkles size={20} />
          </button>

          <button
            onClick={clearSelection}
            className="ml-2 p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-red-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* AI Explanation Modal/Panel */}
      {explanation && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => setExplanation(null)}>
          <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-950">
              <div className="flex items-center gap-2 text-bible-gold font-bold">
                <Sparkles size={18} />
                <span>Explicação IA</span>
              </div>
              <button onClick={() => setExplanation(null)} className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                {explanation.split('\n').map((line, i) => (
                  <p key={i} className="mb-3" dangerouslySetInnerHTML={{
                    __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Generator Modal */}
      {showImageGenerator && (
        <VerseImageGenerator
          verseText={getSelectedText()}
          verseReference={getSelectedRef()}
          onClose={() => setShowImageGenerator(false)}
        />
      )}

      {/* Loading Overlay for AI */}
      {loadingExplanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4">
            <Loader2 size={32} className="animate-spin text-bible-gold" />
            <p className="font-medium animate-pulse">Gerando explicação...</p>
          </div>
        </div>
      )}
    </div>
  );
});

export default BibleReader;