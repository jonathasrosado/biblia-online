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

  // --- AUDIO LOGIC (HTML5 Audio for iOS Compatibility) ---

  // --- AUDIO LOGIC (Robust iOS/Safari Implementation) ---

  // Use a ref to keep a single Audio instance
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = () => {
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
  };

  const playAudio = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    setIsPlaying(true);
    setIsAudioLoading(true);

    // PRIME THE AUDIO ELEMENT (CRITICAL FOR IOS)
    // We create the audio element synchronously during the click event.
    if (!audioRef.current) {
      const audio = new Audio();
      // audio.autoplay = true; // Don't use autoplay, use explicit play
      audioRef.current = audio;

      // Try to play silence immediately to unlock audio on iOS
      audio.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAgZGF0YQQAAAAAAA==";
      audio.play().catch(() => { });
    }

    const chunks = verses.map(v => v.text.replace(/[*#_`\[\]]/g, ''));
    setTotalChunks(chunks.length);

    processAudioQueue(chunks, 0);
  };

  const processAudioQueue = async (chunks: string[], startIndex: number) => {
    let index = startIndex;

    const playNext = async () => {
      if (index >= chunks.length || !isPlayingRef.current) {
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

        const base64Data = await generateAudioFromText(chunks[index], preferences.voice || 'male');

        if (base64Data && isPlayingRef.current && audioRef.current) {
          // Convert Base64 to Blob
          const byteCharacters = atob(base64Data.split(',')[1]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'audio/mpeg' });
          const blobUrl = URL.createObjectURL(blob);

          audioRef.current.src = blobUrl;
          audioRef.current.playbackRate = 1.0;

          audioRef.current.onended = () => {
            URL.revokeObjectURL(blobUrl);
            index++;
            playNext();
          };

          audioRef.current.onerror = (e) => {
            console.error("Audio playback error:", e);
            speakWithWebSpeech(chunks[index]).then(() => {
              index++;
              playNext();
            });
          };

          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsAudioLoading(false);
              })
              .catch(error => {
                console.error("Play prevented:", error);
                speakWithWebSpeech(chunks[index]).then(() => {
                  index++;
                  playNext();
                });
              });
          }
        } catch (err) {
          console.error("Audio generation failed", err);
          await speakWithWebSpeech(chunks[index]);
          index++;
          playNext();
        }
      };

      // Update ref for cleanup checks
      isPlayingRef.current = true;
      playNext();
    };



    // Helper for Web Speech API (Fallback)
    const speakWithWebSpeech = (text: string): Promise<void> => {
      return new Promise((resolve) => {
        if (!window.speechSynthesis) {
          resolve(); // Resolve silently if not supported
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR';
        utterance.rate = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const preferredGender = preferences.voice || 'male';
        const selectedVoice = voices.find(v =>
          v.lang.startsWith(utterance.lang.split('-')[0]) &&
          (preferredGender === 'female' ? v.name.includes('Female') || v.name.includes('Maria') : v.name.includes('Male') || v.name.includes('David'))
        ) || voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0]));

        if (selectedVoice) utterance.voice = selectedVoice;

        utterance.onend = () => {
          setIsAudioLoading(false);
          resolve();
        };

        utterance.onerror = () => {
          setIsAudioLoading(false);
          resolve();
        };

        window.speechSynthesis.speak(utterance);
        // If it hangs, we manually resolve after timeout
        setTimeout(() => {
          if (window.speechSynthesis.speaking) resolve();
        }, text.length * 100 + 2000);
      });
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