import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, MessageCircle, Sparkles, ArrowRight, X, User, Scroll, Hash, Eye, Heart, HelpCircle } from 'lucide-react';
import { SearchIntent, parseSearchIntent, getSearchSuggestions, SearchSuggestion, SearchIntentType, normalizeStr } from '../services/searchIntent';
import { characters } from '../data/search/characters';
import { stories } from '../data/search/stories';

interface SmartSearchProps {
    placeholder?: string;
    theme?: 'light' | 'dark' | 'bw' | 'sepia';
    onClose?: () => void;
    variant?: 'default' | 'sidebar';
}

const SmartSearch: React.FC<SmartSearchProps> = ({ placeholder = "Busque sentimentos, personagens, histórias...", theme = 'light', onClose, variant = 'default' }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [intent, setIntent] = useState<SearchIntent | null>(null);
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [smartSuggestions, setSmartSuggestions] = useState<{ type: string, label: string, value: any, icon: any }[]>([]);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1); // For keyboard navigation

    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounce Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!query) {
                setIntent(null);
                setSuggestions([]);
                setSmartSuggestions([]); // Clear smart suggestions too
                return;
            }

            if (variant === 'sidebar') {
                const results = getSearchSuggestions(query);
                setSuggestions(results);
                setIntent(null); // Disable intent card in sidebar
                setSmartSuggestions([]); // Clear smart suggestions for sidebar
            } else {
                let result = parseSearchIntent(query);

                // Generate Smart Suggestions (Predictive)
                const norm = normalizeStr(query);
                const newSuggestions: { type: string, label: string, value: any, icon: any }[] = [];

                // 1. Prefix scan for Characters (Maria -> Maria Madalena, etc)
                // We prioritize characters that START with the query
                const charMatches = Object.values(characters).filter(c => {
                    const nName = normalizeStr(c.name);
                    // Match name start or alias start
                    return nName.includes(norm) || (c.searchAliases || []).some(a => normalizeStr(a).includes(norm));
                });

                // Sort: exact startsWith is better than includes
                charMatches.sort((a, b) => {
                    const aName = normalizeStr(a.name);
                    const bName = normalizeStr(b.name);
                    const aStarts = aName.startsWith(norm);
                    const bStarts = bName.startsWith(norm);
                    if (aStarts && !bStarts) return -1;
                    if (!aStarts && bStarts) return 1;
                    return 0;
                });

                // Take top 3 char matches
                charMatches.slice(0, 3).forEach(c => {
                    newSuggestions.push({
                        type: 'CHARACTER',
                        label: c.name,
                        value: c,
                        icon: User
                    });
                });

                // 2. Contextual Stories (Davi ... -> Davi e Golias)
                // If we detected a character in the query (via intent OR simple string check), find stories
                let detectedCharName = "";
                if (result?.type === 'CHARACTER' && result.data?.character) {
                    detectedCharName = result.data.character.name;
                } else if (charMatches.length > 0) {
                    detectedCharName = charMatches[0].name; // Assume context of top match
                }

                if (detectedCharName || norm.length > 2) {
                    const storyMatches = Object.values(stories).filter(s => {
                        const nTitle = normalizeStr(s.title);
                        const nRef = normalizeStr(s.ref);
                        // Match title start, ref start OR if detecting char, match people
                        const titleStarts = nTitle.startsWith(norm);

                        if (titleStarts) return true; // High priority prefix match

                        if (detectedCharName) {
                            return s.people.some(p => normalizeStr(p) === normalizeStr(detectedCharName));
                        }
                        return nTitle.includes(norm);
                    });

                    // Sort stories: StartsWith query -> Includes query -> Character match
                    storyMatches.sort((a, b) => {
                        const aTitle = normalizeStr(a.title);
                        const bTitle = normalizeStr(b.title);
                        const aStarts = aTitle.startsWith(norm);
                        const bStarts = bTitle.startsWith(norm);
                        if (aStarts && !bStarts) return -1;
                        if (!aStarts && bStarts) return 1;
                        return 0;
                    });

                    // Take top 3 stories
                    storyMatches.slice(0, 3).forEach(s => {
                        // Check for duplicates in suggestions (already added?)
                        if (newSuggestions.some(ns => ns.type === 'STORY' && ns.label === s.title)) return;

                        newSuggestions.push({
                            type: 'STORY',
                            label: s.title,
                            value: s,
                            icon: Scroll
                        });
                    });
                }

                // --- PREDICTIVE PROMOTION LOGIC ---
                // If the main result is weak (THEME/QUESTION with low confidence) 
                // AND we have a strong prefix match in suggestions, PROMOTE IT.
                if (result.type === 'THEME' || result.type === 'QUESTION' || result.confidence < 0.8) {
                    // Look for a suggestion that STARTS with the query (ignoring articles)
                    const bestPrediction = newSuggestions.find(s => {
                        const sLabel = normalizeStr(s.label);
                        // Check direct prefix
                        if (sLabel.startsWith(norm)) return true;

                        // Check prefix ignoring articles ("o ", "a ", "os ", "as ", "um ", "uma ")
                        const sLabelClean = sLabel.replace(/^(o |a |os |as |um |uma )/, '');
                        if (sLabelClean.startsWith(norm)) return true;

                        return false;
                    });

                    if (bestPrediction) {
                        // Override result with the prediction
                        if (bestPrediction.type === 'CHARACTER') {
                            result = {
                                type: 'CHARACTER',
                                originalQuery: query, // Keep original query text
                                data: { character: bestPrediction.value },
                                confidence: 0.95
                            };
                        } else if (bestPrediction.type === 'STORY') {
                            result = {
                                type: 'STORY',
                                originalQuery: query,
                                data: { story: bestPrediction.value },
                                confidence: 0.95
                            };
                        }
                    }
                }

                // Filter suggestions to not show what is now the MAIN result
                const finalSuggestions = newSuggestions.filter(s => {
                    if (result.type === 'CHARACTER' && result.data?.character?.name === s.label) return false;
                    if (result.type === 'STORY' && result.data?.story?.title === s.label) return false;
                    return true;
                });

                setIntent(result);
                // setShowDropdown(true); // Don't force open if closed? User typing opens it naturally 
                // Actually if typing > 0 we want to show.
                if (query.trim().length > 0) setShowDropdown(true);

                setSmartSuggestions(finalSuggestions);

            }
        }, 200);

        return () => clearTimeout(timer);
    }, [query]);

    // Click Outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current && !inputRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const extractRef = (text: string) => {
        // Simple extraction of "Book Chapter:Verse" or "Book Chapter" from a string like "Event (Book Chapter)"
        const match = text.match(/\((.*?)\)/);
        return match ? match[1] : text;
    };

    const handleAction = (action: string, e?: React.MouseEvent, overrideType?: SearchIntentType, overrideData?: any) => {
        e?.stopPropagation();

        const type = overrideType || intent?.type;
        const data = overrideData || intent?.data;

        if (!type && action !== 'ask') return;

        switch (action) {
            case 'read':
                if (type === 'BOOK' && data?.book) {
                    // Use normalizeBookName to ensure accents/spaces are handled (e.g. "1 Samuel" -> "1-samuel", "Gênesis" -> "genesis")
                    // We need to import normalizeBookName from constants or define it. 
                    // It is imported in App.tsx but maybe not here.
                    // Let's implement inline or use the one if available.
                    // Checking imports... normalizeBookName IS NOT imported in SmartSearch.tsx top lines.
                    // I will perform a safe normalization here matching constants.ts logic.
                    const normalized = data.book.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
                    navigate(`/leitura/${normalized}`);
                } else if (type === 'CHAPTER' && data?.book && data?.chapter) {
                    const normalized = data.book.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
                    navigate(`/leitura/${normalized}/${data.chapter}`);
                } else if ((type === 'VERSE' || type === 'RANGE') && data?.book && data?.chapter && data?.verse) {
                    const normalized = data.book.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
                    const verseParam = data.endVerse ? `${data.verse}-${data.endVerse}` : data.verse;
                    navigate(`/leitura/${normalized}/${data.chapter}?verses=${verseParam}`);
                } else if (type === 'STORY' && data?.story) {
                    const storyRef = data.story.ref;
                    const parsedRef = parseSearchIntent(storyRef);

                    if (parsedRef.data?.book) {
                        // Use normalized name for cleaner URLs
                        const bookName = parsedRef.data.book.name.toLowerCase().replace(/\s+/g, '-');
                        const verseParam = parsedRef.data.endVerse ? `${parsedRef.data.verse}-${parsedRef.data.endVerse}` : parsedRef.data.verse;
                        const link = `/leitura/${bookName}/${parsedRef.data.chapter || 1}${verseParam ? `?verses=${verseParam}` : ''}`;
                        navigate(link);
                    } else {
                        // Fallback parsing for refs like "1 Samuel 17" or "Gênesis 6–9" or "Gênesis 6-9"
                        // Handle en-dashes and ranges
                        const cleanedRef = storyRef.replace('–', '-');
                        const lastSpaceIndex = cleanedRef.lastIndexOf(' ');

                        if (lastSpaceIndex > 0) {
                            const bookPart = cleanedRef.substring(0, lastSpaceIndex).trim();
                            // Handle chapters that might be ranges "6-9" -> take "6"
                            const chapterPart = cleanedRef.substring(lastSpaceIndex + 1).split('-')[0].split(':')[0];
                            const chapter = parseInt(chapterPart);

                            // Find the book manually
                            // We import bibleBooks from somewhere? Or use parseSearchIntent recursively on just the book?
                            // reusing parseSearchIntent on bookPart might be safer
                            const bookSearch = parseSearchIntent(bookPart);
                            if (bookSearch.type === 'BOOK' && bookSearch.data?.book && !isNaN(chapter)) {
                                const bookName = bookSearch.data.book.name.toLowerCase().replace(/\s+/g, '-');
                                navigate(`/leitura/${bookName}/${chapter}`);
                            } else {
                                // Last resort: Navigate to search? Or Chat?
                                handleAction('ask');
                            }
                        } else {
                            handleAction('ask');
                        }
                    }
                    break;
                } else if (type === 'EMOTION' && data?.emotion) {
                    const parsedRef = parseSearchIntent(data.emotion.ref);
                    if (parsedRef.data?.book) {
                        const verseParam = parsedRef.data.endVerse ? `${parsedRef.data.verse}-${parsedRef.data.endVerse}` : parsedRef.data.verse;
                        navigate(`/leitura/${parsedRef.data.book.name.toLowerCase()}/${parsedRef.data.chapter || 1}?verses=${verseParam || ''}`);
                    }
                } else if (type === 'CHARACTER' && data?.character) {
                    // Character: Navigate to key event? OR Search specific query?
                    // Let's search for "Quem foi [Nome]" via chat for now as 'read' isn't perfect unless we have a definitive chapter.
                    // But maybe we can read the 'KeyEvent' ref.
                    const keyEventRef = extractRef(data.character.keyEvent);
                    const parsedRef = parseSearchIntent(keyEventRef);
                    if (parsedRef.data?.book) {
                        navigate(`/leitura/${parsedRef.data.book.name.toLowerCase()}/${parsedRef.data.chapter || 1}`);
                    } else {
                        // Fallback to chat
                        handleAction('ask');
                    }
                } else if (type === 'TESTAMENT' && data?.testament) {
                    navigate(data.testament === 'Old' ? '/antigo-testamento' : '/novo-testamento');
                } else {
                    handleAction('ask');
                }
                break;

            case 'explain':
                if (data?.book && data?.chapter) {
                    navigate(`/leitura/${data.book.name.toLowerCase()}/${data.chapter}`, { state: { explainVerse: data.verse } });
                } else {
                    handleAction('ask');
                }
                break;

            case 'pray':
                if (type === 'EMOTION' && data?.emotion) {
                    // Navigate to chat with the prayer pre-filled?
                    navigate(`/chat?p=${encodeURIComponent(data.emotion.prayer)}`);
                }
                break;

            case 'ask':
                let q = intent.originalQuery;
                if (type === 'QUESTION') q = intent.originalQuery;
                else if (type === 'THEME') q = `O que a Bíblia diz sobre ${intent.originalQuery}?`;
                else if (type === 'CHARACTER') q = `Quem foi ${data?.character?.name}?`;
                else if (type === 'STORY') q = `Conte-me a história: ${data?.story?.title}`;
                else if (type === 'EMOTION') q = `Me ajude com: ${data?.emotion?.title}`;

                navigate(`/chat?p=${encodeURIComponent(q)}`);
                break;

            default:
                break;
        }

        setShowDropdown(false);
        onClose?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            if (variant === 'sidebar') {
                navigate(`/chat?p=${encodeURIComponent(query)}`);
                setShowDropdown(false);
                onClose?.();
                if (inputRef.current) inputRef.current.blur();
                return;
            }

            handleAction('read');
            if (inputRef.current) inputRef.current.blur();
        }
    };

    const clearSearch = () => {
        setQuery('');
        setIntent(null);
        inputRef.current?.focus();
    };

    const renderResult = () => {
        if (!intent) return null;

        const { type, data, originalQuery } = intent;

        let Icon = Search;
        let label = "Busca";
        let title = originalQuery;
        let subtitle = "Ver resultados";
        let additionalContent: React.ReactNode = null;
        let cardColorClass = theme === 'dark' ? 'bg-stone-800' : 'bg-white';
        let iconColorClass = theme === 'dark' ? 'bg-stone-700 text-stone-300' : 'bg-stone-100 text-stone-600';
        let labelColorClass = theme === 'dark' ? 'bg-bible-gold/20 text-bible-gold' : 'bg-bible-gold/10 text-bible-gold-dark';

        // Compact Mode Tweaks via variant
        const isCompact = variant === 'sidebar';

        if (type === 'BOOK' && data?.book) {
            Icon = BookOpen;
            label = "Livro";
            title = data.book.name;
            subtitle = `${data.book.testament === 'Old' ? 'VT' : 'NT'} • ${data.book.chapters} Caps`;
        } else if (type === 'CHAPTER' && data?.book) {
            Icon = BookOpen;
            label = "Capítulo";
            title = `${data.book.name} ${data.chapter}`;
            subtitle = "Ir para leitura completa";
        } else if ((type === 'VERSE' || type === 'RANGE') && data?.book) {
            Icon = Hash;
            label = "Versículo";
            title = `${data.book.name} ${data.chapter}:${data.verse}`;
            subtitle = "Ler versículo no contexto";
        } else if (type === 'THEME') {
            Icon = MessageCircle;
            label = "Tema";
            title = `"${originalQuery}"`;
            subtitle = "Explorar tema na Bíblia";
        } else if (type === 'QUESTION') {
            Icon = HelpCircle;
            label = "Pergunta";
            title = originalQuery;
            subtitle = "Consultar";
        } else if (type === 'EMOTION' && data?.emotion) {
            Icon = Heart;
            label = "Sentimento";
            title = data.emotion.title;
            subtitle = data.emotion.ref ? `Bíblia: ${data.emotion.ref}` : "Encontre conforto";
            // Use custom color from data if available, but keep dark mode in mind
            // We can add a tint
            if (theme !== 'dark' && data.emotion.color) {
                cardColorClass = data.emotion.color; // e.g. 'bg-blue-50'
            }
            iconColorClass = theme === 'dark' ? 'bg-pink-900/30 text-pink-400' : 'bg-white text-pink-500 shadow-sm';
            labelColorClass = theme === 'dark' ? 'bg-pink-500/20 text-pink-300' : 'bg-pink-100 text-pink-700';
        } else if (type === 'CHARACTER' && data?.character) {
            Icon = User;
            label = "Personagem";
            title = data.character.name;
            subtitle = data.character.role;
            iconColorClass = theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600';
            labelColorClass = theme === 'dark' ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700';

            if (!isCompact) {
                additionalContent = (
                    <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-1">
                        <p className={`text-sm leading-relaxed line-clamp-3 ${theme === 'dark' ? 'text-stone-300' : 'text-stone-600'}`}>
                            {data.character.bio}
                        </p>

                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-xs">
                                <span className={`font-bold shrink-0 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>Chave:</span>
                                <span className={`truncate ${theme === 'dark' ? 'text-stone-300' : 'text-stone-700'}`}>{data.character.keyEvent}</span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {data.character.mainBooks?.slice(0, 3).map((b: string, i: number) => (
                                    <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border ${theme === 'dark' ? 'border-stone-700 text-stone-400' : 'border-stone-200 text-stone-500'}`}>
                                        {b}
                                    </span>
                                ))}
                                {data.character.themes?.slice(0, 3).map((t: string, i: number) => (
                                    <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border ${theme === 'dark' ? 'border-blue-500/20 text-blue-400' : 'border-blue-200 text-blue-600'}`}>
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            }
        } else if (type === 'STORY' && data?.story) {
            title = data.story.title;
            subtitle = data.story.ref;
            iconColorClass = theme === 'dark' ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600';
            labelColorClass = theme === 'dark' ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700';
        } else if (type === 'TESTAMENT' && data?.testament) {
            Icon = BookOpen; // Or maybe a Library icon?
            label = "Testamento";
            title = data.testament === 'Old' ? "Antigo Testamento" : "Novo Testamento";
            subtitle = data.testament === 'Old' ? "A Lei, Os Profetas e Os Escritos" : "Os Evangelhos e as Cartas";
            iconColorClass = theme === 'dark' ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600';
            labelColorClass = theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700';
        }

        return (
            <div
                onClick={() => handleAction('read')}
                className={`group p-4 rounded-xl border transition-all cursor-pointer shadow-sm
                    ${theme === 'dark' ? 'border-stone-700 hover:border-stone-600' : 'border-stone-100 hover:border-stone-200 hover:shadow-md'}
                    ${cardColorClass}
                `}
            >
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full shrink-0 ${iconColorClass}`}>
                        <Icon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${labelColorClass}`}>
                                {label}
                            </span>
                        </div>
                        <h3 className={`${isCompact ? 'text-base' : 'text-lg'} font-serif font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {title}
                        </h3>
                        <p className={`text-sm opacity-70 truncate ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`}>
                            {subtitle}
                        </p>
                    </div>
                    <div className={`self-center opacity-0 group-hover:opacity-100 transition-opacity ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>
                        <ArrowRight size={20} />
                    </div>
                </div>

                {/* Smart Suggestions - Horizontal Scroll (Mobile Optimized) */}
                {smartSuggestions.length > 0 && (
                    <div className="mt-3 mb-1">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mask-fade-right">
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 shrink-0">
                                Sugestões:
                            </span>
                            {smartSuggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent card click
                                        if (suggestion.type === 'CHARACTER') {
                                            setQuery(suggestion.label);
                                        } else if (suggestion.type === 'STORY') {
                                            setIntent({ type: 'STORY', originalQuery: suggestion.label, data: { story: suggestion.value }, confidence: 1 });
                                            // Don't auto-navigate, just show the card for the story? 
                                            // Or navigate? User wants to "read".
                                            // Since this is "Inside" the card, maybe we just update the intent effectively.
                                        }
                                    }}
                                    className={`
                                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors
                                        ${theme === 'dark'
                                            ? 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700 hover:border-stone-600'
                                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-300'}
                                    `}
                                >
                                    <suggestion.icon size={12} className="opacity-70" />
                                    {suggestion.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {additionalContent}

                {/* --- Quick Actions Row --- */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-black/5 dark:border-white/10">
                    <button
                        onClick={(e) => handleAction('read', e)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors
                            ${theme === 'dark' ? 'hover:bg-white/5 text-stone-300' : 'hover:bg-black/5 text-stone-600'}`}>
                        <BookOpen size={16} /> Ler
                    </button>

                    {type === 'EMOTION' && (
                        <button
                            onClick={(e) => handleAction('pray', e)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors
                             ${theme === 'dark' ? 'hover:bg-white/5 text-stone-300' : 'hover:bg-black/5 text-stone-600'}`}>
                            <Sparkles size={16} /> Orar
                        </button>
                    )}

                    <button
                        onClick={(e) => handleAction('ask', e)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors
                            ${theme === 'dark' ? 'hover:bg-white/5 text-stone-300' : 'hover:bg-black/5 text-stone-600'}`}>
                        <MessageCircle size={16} /> Perguntar
                    </button>
                </div>
            </div>
        );
    };

    const renderSuggestions = () => (
        <div className="space-y-4">
            <div className="opacity-50 text-xs font-bold tracking-wider uppercase px-2">Sugestões Rápidas</div>
            <div className="grid grid-cols-2 gap-2">
                {["Estou ansioso", "Quem foi Davi", "Menino gigante", "Salmos 23", "Fé", "Amor"].map(s => (
                    <button
                        key={s}
                        onClick={() => { setQuery(s); }}
                        className={`text-left text-sm p-3 rounded-lg transition-colors truncate
              ${theme === 'dark' ? 'bg-stone-800/50 hover:bg-stone-800 text-stone-300' : 'bg-stone-50 hover:bg-stone-100 text-stone-600'}`}>
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="relative w-full z-50">
            {/* Input Field */}
            <div className={`relative flex items-center w-full transition-all duration-300 overflow-hidden
        ${variant === 'sidebar' ? 'rounded-lg' : 'rounded-2xl'}
        ${isFocused
                    ? (theme === 'dark' ? 'bg-stone-800 ring-2 ring-bible-gold/50 shadow-lg' : 'bg-white ring-2 ring-bible-gold/30 shadow-lg')
                    : (theme === 'dark' ? 'bg-stone-900 border border-stone-800' : 'bg-stone-100 border border-stone-200')}
      `}>
                <div className={`pl-4 ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>
                    <Search size={variant === 'sidebar' ? 16 : 20} />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    className={`w-full ${variant === 'sidebar' ? 'py-2 px-2 text-sm' : 'py-3.5 px-3 text-base'} bg-transparent border-none outline-none placeholder-opacity-50
              ${theme === 'dark' ? 'text-stone-200 placeholder-stone-500' : 'text-stone-800 placeholder-stone-400'}
            `}
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { setIsFocused(true); setShowDropdown(true); }}
                    onBlur={() => { }}
                    onKeyDown={handleKeyDown}
                />
                {query && (
                    <button onClick={clearSearch} className={`pr-4 ${theme === 'dark' ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'}`}>
                        <X size={variant === 'sidebar' ? 14 : 18} />
                    </button>
                )}
            </div>

            {/* Results / Suggestion Dropdown */}
            {showDropdown && (isFocused || query.length > 0) && !(variant === 'sidebar' && query.length === 0) && (
                <div
                    ref={dropdownRef}
                    className={`absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-xl overflow-hidden p-4 animate-in fade-in slide-in-from-top-2 z-[60]
          ${theme === 'dark' ? 'bg-stone-900 border border-stone-700/50' : 'bg-white border border-stone-100'}
        `}>
                    {intent ? (
                        <div className="space-y-4">
                            {renderResult()}

                            {/* Ambiguity Handling */}
                            {intent.confidence < 0.8 && (
                                <div className={`text-xs text-center italic ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>
                                    Não encontrou o que queria? Tente ser mais específico.
                                </div>
                            )}
                        </div>
                    ) : variant === 'sidebar' && suggestions.length > 0 ? (
                        <div className="flex flex-col gap-1">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => handleAction('read', e, s.type, s.data)}
                                    className={`flex items-center justify-between text-left p-2 rounded-lg transition-colors group
                                        ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'}
                                    `}
                                >
                                    <span className={`text-sm ${theme === 'dark' ? 'text-stone-200' : 'text-stone-700'}`}>
                                        {s.label}
                                    </span>
                                    <span className={`text-[10px] uppercase font-bold tracking-wider opacity-50 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
                                        {s.subLabel}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        renderSuggestions()
                    )}
                </div>
            )}
        </div>
    );
};

export default SmartSearch;
