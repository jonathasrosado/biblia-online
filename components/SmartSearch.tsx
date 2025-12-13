import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, BookOpen, MessageCircle, ArrowRight, Hash, Eye, Heart, User, Sparkles, Scroll } from 'lucide-react';
import { parseSearchIntent, SearchIntent } from '../services/searchIntent';

interface SmartSearchProps {
    placeholder?: string;
    theme?: 'light' | 'dark' | 'bw' | 'sepia';
    onClose?: () => void;
}

const SmartSearch: React.FC<SmartSearchProps> = ({ placeholder = "Busque sentimentos, personagens, histórias...", theme = 'light', onClose }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [intent, setIntent] = useState<SearchIntent | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounce Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 1) {
                const result = parseSearchIntent(query);
                setIntent(result);
                setShowDropdown(true);
            } else {
                setIntent(null);
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

    const handleAction = (action: 'read' | 'explain' | 'ask' | 'pray', e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!intent) return;

        const { type, data } = intent;

        switch (action) {
            case 'read':
                if (type === 'BOOK' && data?.book) {
                    navigate(`/leitura/${data.book.name.toLowerCase()}`);
                } else if (type === 'CHAPTER' && data?.book && data?.chapter) {
                    navigate(`/leitura/${data.book.name.toLowerCase()}/${data.chapter}`);
                } else if ((type === 'VERSE' || type === 'RANGE') && data?.book && data?.chapter && data?.verse) {
                    navigate(`/leitura/${data.book.name.toLowerCase()}/${data.chapter}#v${data.verse}`);
                } else if (type === 'STORY' && data?.story) {
                    // Try to parse the ref from the story
                    // Story ref is usually "Book Chapter" or "Book Chapter:Verse"
                    // We can try to use our intent parser RECURSIVELY or just simple navigation if format is clean.
                    // Assuming Ref is clean "1 Samuel 17"
                    const storyRef = data.story.ref;
                    // Simple heuristic: split by space. Last part is chapter. Rest is book. 
                    // Better: Use the parser!
                    const parsedRef = parseSearchIntent(storyRef);
                    if (parsedRef.data?.book) {
                        const link = `/leitura/${parsedRef.data.book.name.toLowerCase()}/${parsedRef.data.chapter || 1}`;
                        navigate(link);
                    }
                } else if (type === 'EMOTION' && data?.emotion) {
                    const parsedRef = parseSearchIntent(data.emotion.ref);
                    if (parsedRef.data?.book) {
                        navigate(`/leitura/${parsedRef.data.book.name.toLowerCase()}/${parsedRef.data.chapter || 1}#v${parsedRef.data.verse || ''}`);
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
        let cardColorClass = theme === 'dark' ? 'bg-stone-800' : 'bg-white';
        let iconColorClass = theme === 'dark' ? 'bg-stone-700 text-stone-300' : 'bg-stone-100 text-stone-600';
        let labelColorClass = theme === 'dark' ? 'bg-bible-gold/20 text-bible-gold' : 'bg-bible-gold/10 text-bible-gold-dark';

        if (type === 'BOOK' && data?.book) {
            Icon = BookOpen;
            label = "Livro";
            title = data.book.name;
            subtitle = `${data.book.testament === 'Old' ? 'Velho' : 'Novo'} Testamento • ${data.book.chapters} Capítulos`;
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
            Icon = Sparkles;
            label = "Pergunta";
            title = originalQuery;
            subtitle = "Consultar a Inteligência Artificial";
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
        } else if (type === 'STORY' && data?.story) {
            Icon = Scroll;
            label = "História";
            title = data.story.title;
            subtitle = data.story.ref;
            iconColorClass = theme === 'dark' ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600';
            labelColorClass = theme === 'dark' ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700';
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
                        <h3 className={`text-lg font-serif font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
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

                {/* --- Quick Actions Row --- */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-black/5 dark:border-white/10">
                    <button
                        onClick={(e) => handleAction('read', e)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors
                            ${theme === 'dark' ? 'hover:bg-white/5 text-stone-300' : 'hover:bg-black/5 text-stone-600'}`}>
                        <BookOpen size={16} /> Ler
                    </button>

                    {type === 'EMOTION' ? (
                        <button
                            onClick={(e) => handleAction('pray', e)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors
                             ${theme === 'dark' ? 'hover:bg-white/5 text-stone-300' : 'hover:bg-black/5 text-stone-600'}`}>
                            <Sparkles size={16} /> Orar
                        </button>
                    ) : (type === 'VERSE' || type === 'CHAPTER' || type === 'BOOK') && (
                        <button
                            onClick={(e) => handleAction('explain', e)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors
                                ${theme === 'dark' ? 'hover:bg-white/5 text-stone-300' : 'hover:bg-black/5 text-stone-600'}`}>
                            <Eye size={16} /> Explicar
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
            <div className={`relative flex items-center w-full rounded-2xl transition-all duration-300 overflow-hidden
        ${isFocused
                    ? (theme === 'dark' ? 'bg-stone-800 ring-2 ring-bible-gold/50 shadow-lg' : 'bg-white ring-2 ring-bible-gold/30 shadow-lg')
                    : (theme === 'dark' ? 'bg-stone-900 border border-stone-800' : 'bg-stone-100 border border-stone-200')}
      `}>
                <div className={`pl-4 ${theme === 'dark' ? 'text-stone-500' : 'text-stone-400'}`}>
                    <Search size={20} />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    className={`w-full py-3.5 px-3 bg-transparent border-none outline-none text-base placeholder-opacity-50
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
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Results / Suggestion Dropdown */}
            {showDropdown && (isFocused || query.length > 0) && (
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
                    ) : (
                        renderSuggestions()
                    )}
                </div>
            )}
        </div>
    );
};

export default SmartSearch;
