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
    simpleMode?: boolean;
}

const SmartSearch: React.FC<SmartSearchProps> = ({ placeholder = "Busque sentimentos, personagens, histórias...", theme = 'light', onClose, variant = 'default', simpleMode = false }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [intent, setIntent] = useState<SearchIntent | null>(null);
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // We can remove smartSuggestions and use suggestions for everything

    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounce Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!query || query.trim().length < 2) {
                setSuggestions([]);
                // Handle empty state vs short query
                if (query.length === 0) {
                    // Keep dropdown open (or open it) to show empty state icebreakers if focused
                    setShowDropdown(true);
                } else {
                    // Too short for suggestions, but not empty. Close it.
                    setShowDropdown(false);
                }
                return;
            }

            // Always use the robust getSearchSuggestions for consistency
            const results = getSearchSuggestions(query);
            setSuggestions(results);

            if (results.length > 0) {
                setShowDropdown(true);
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputRef.current) inputRef.current.blur();

        if (variant === 'sidebar') {
            navigate(`/chat?p=${encodeURIComponent(query)}`);
            setShowDropdown(false);
            onClose?.();
            return;
        }

        navigate(`/busca?q=${encodeURIComponent(query)}`);
        setShowDropdown(false);
        onClose?.();
    };

    const handleSuggestionClick = (suggestion: SearchSuggestion) => {
        setQuery(suggestion.label);
        navigate(`/busca?q=${encodeURIComponent(suggestion.label)}`);
        setShowDropdown(false);
        onClose?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Enter is handled by form submission
    };

    const clearSearch = () => {
        setQuery('');
        setIntent(null);
        setSuggestions([]);
        inputRef.current?.focus();
        setShowDropdown(true);
    };

    const renderSimpleSuggestions = () => {
        if (!suggestions || suggestions.length === 0) return null;

        return (
            <div
                ref={dropdownRef}
                className={`
                absolute top-full left-0 right-0 mt-2 py-2 rounded-xl border shadow-xl z-50 overflow-hidden
                ${theme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}
            `}>
                <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
                    {suggestions.map((suggestion, idx) => {
                        let Icon = Search;
                        if (suggestion.type === 'BOOK') Icon = BookOpen;
                        else if (suggestion.type === 'CHARACTER') Icon = User;
                        else if (suggestion.type === 'STORY') Icon = Scroll;
                        else if (suggestion.type === 'EMOTION') Icon = Heart;
                        else if (suggestion.type === 'VERSE' || suggestion.type === 'RANGE') Icon = Hash;
                        else if (suggestion.type === 'THEME') Icon = MessageCircle;

                        return (
                            <button
                                key={idx}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className={`
                                    w-full text-left px-4 py-3 flex items-center gap-3 transition-colors
                                    ${theme === 'dark'
                                        ? 'hover:bg-stone-800 text-stone-200'
                                        : 'hover:bg-stone-50 text-stone-700'}
                                `}
                            >
                                <Icon size={16} className="opacity-50 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{suggestion.label}</div>
                                    {suggestion.subLabel && (
                                        <div className="text-xs opacity-50 truncate">{suggestion.subLabel}</div>
                                    )}
                                </div>
                                <ArrowRight size={14} className="opacity-30 -ml-2" />
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderEmptyState = () => (
        <div ref={dropdownRef} className={`absolute top-full left-0 right-0 mt-2 p-4 rounded-xl border shadow-xl z-50 
            ${theme === 'dark' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>
            <div className="opacity-50 text-xs font-bold tracking-wider uppercase mb-2 px-1">Sugestões Rápidas</div>
            <div className="grid grid-cols-1 gap-2">
                <button
                    onClick={() => {
                        navigate(`/chat?p=versiculos-para-quem-precisa-de-paz`);
                        setShowDropdown(false);
                        onClose?.();
                    }}
                    className={`text-left text-sm px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3
                        ${theme === 'dark' ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-700'}`}>
                    <span>😔</span>
                    <span>Preciso de paz</span>
                </button>

                <button
                    onClick={() => {
                        navigate('/devocional');
                        setShowDropdown(false);
                        onClose?.();
                    }}
                    className={`text-left text-sm px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3
                        ${theme === 'dark' ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-700'}`}>
                    <span>🌅</span>
                    <span>Mensagem para hoje</span>
                </button>

                <button
                    onClick={() => {
                        navigate('/como-ler-biblia');
                        setShowDropdown(false);
                        onClose?.();
                    }}
                    className={`text-left text-sm px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3
                        ${theme === 'dark' ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-700'}`}>
                    <span>📖</span>
                    <span>Começar a ler a Bíblia</span>
                </button>

                <button
                    onClick={() => {
                        navigate('/versiculos');
                        setShowDropdown(false);
                        onClose?.();
                    }}
                    className={`text-left text-sm px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3
                        ${theme === 'dark' ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-700'}`}>
                    <span>🔎</span>
                    <span>Buscar por tema</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="relative w-full z-50">
            {/* Input Field */}
            <form
                onSubmit={handleSubmit}
                className={`relative flex items-center w-full transition-all duration-300 overflow-hidden
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
                    onBlur={() => {
                        // Delay hide to allow clicks
                        setTimeout(() => {
                            if (document.activeElement !== inputRef.current) {
                                setIsFocused(false);
                                setShowDropdown(false);
                            }
                        }, 200);
                    }}
                    onKeyDown={handleKeyDown}
                />
                {query && (
                    <button type="button" onClick={clearSearch} className={`pr-4 ${theme === 'dark' ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'}`}>
                        <X size={variant === 'sidebar' ? 14 : 18} />
                    </button>
                )}
            </form>

            {/* Results / Suggestion Dropdown */}
            {showDropdown && isFocused && (
                <>
                    {(query.length > 0 && suggestions.length > 0)
                        ? renderSimpleSuggestions()
                        : (query.length === 0 && !variant.includes('sidebar')) ? renderEmptyState() : null
                    }
                </>
            )}
        </div>
    );
};

export default SmartSearch;
