import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Link as LinkIcon, RemoveFormatting, Heading1, Heading2, List, ListOrdered, Quote, Image as ImageIcon, Sparkles, AlignLeft, AlignCenter, AlignRight, ChevronDown } from 'lucide-react';

interface RichTextToolbarProps {
    onFormat: (command: string, value?: string) => void;
    activeFormats?: string[];
}

const RichTextToolbar: React.FC<RichTextToolbarProps> = ({ onFormat, activeFormats = [] }) => {
    const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const btnClass = "p-2 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-stone-600 dark:text-stone-300";
    const separatorClass = "w-px h-4 bg-stone-300 dark:bg-stone-600 mx-1";

    const isActive = (format: string) => activeFormats.includes(format);
    const getBtnClass = (format: string) => `${btnClass} ${isActive(format) ? 'bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold' : ''}`;

    const currentHeading = ['h1', 'h2', 'h3', 'h4', 'p'].find(h => isActive(h)) || 'p';
    const headingLabels: Record<string, string> = {
        'h1': 'Título 1',
        'h2': 'Título 2',
        'h3': 'Título 3',
        'h4': 'Título 4',
        'p': 'Parágrafo'
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowHeadingDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleHeadingSelect = (tag: string) => {
        onFormat('formatBlock', tag);
        setShowHeadingDropdown(false);
    };

    return (
        <div className="flex items-center flex-wrap gap-1 p-1 rounded-lg border mb-2 w-full sticky top-0 z-40 bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 shadow-sm">
            {/* Headings Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
                    className="flex items-center gap-1 px-3 py-2 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-sm font-medium text-stone-600 dark:text-stone-300"
                    title="Estilo de Texto"
                >
                    {headingLabels[currentHeading]} <ChevronDown size={14} />
                </button>

                {showHeadingDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 rounded-lg shadow-xl border overflow-hidden z-50 bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700">
                        <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleHeadingSelect('P')} className={`w-full text-left px-4 py-2 text-sm hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 ${currentHeading === 'p' ? 'bg-stone-100 dark:bg-stone-700' : ''}`}>
                            Parágrafo
                        </button>
                        <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleHeadingSelect('H1')} className={`w-full text-left px-4 py-2 text-xl font-bold hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 ${currentHeading === 'h1' ? 'bg-stone-100 dark:bg-stone-700' : ''}`}>
                            Título 1
                        </button>
                        <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleHeadingSelect('H2')} className={`w-full text-left px-4 py-2 text-lg font-bold hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 ${currentHeading === 'h2' ? 'bg-stone-100 dark:bg-stone-700' : ''}`}>
                            Título 2
                        </button>
                        <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleHeadingSelect('H3')} className={`w-full text-left px-4 py-2 text-base font-bold hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 ${currentHeading === 'h3' ? 'bg-stone-100 dark:bg-stone-700' : ''}`}>
                            Título 3
                        </button>
                        <button onMouseDown={(e) => e.preventDefault()} onClick={() => handleHeadingSelect('H4')} className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 ${currentHeading === 'h4' ? 'bg-stone-100 dark:bg-stone-700' : ''}`}>
                            Título 4
                        </button>
                    </div>
                )}
            </div>

            <div className={separatorClass}></div>

            {/* Basic Formatting */}
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat('bold')} className={getBtnClass('bold')} title="Negrito">
                <Bold size={16} />
            </button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat('italic')} className={getBtnClass('italic')} title="Itálico">
                <Italic size={16} />
            </button>

            <div className={separatorClass}></div>

            {/* Alignment */}
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat('justifyLeft')} className={getBtnClass('justifyLeft')} title="Alinhar à Esquerda">
                <AlignLeft size={16} />
            </button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat('justifyCenter')} className={getBtnClass('justifyCenter')} title="Centralizar">
                <AlignCenter size={16} />
            </button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat('justifyRight')} className={getBtnClass('justifyRight')} title="Alinhar à Direita">
                <AlignRight size={16} />
            </button>

            <div className={separatorClass}></div>

            {/* Lists */}
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat('insertUnorderedList')} className={getBtnClass('insertUnorderedList')} title="Lista com Marcadores">
                <List size={16} />
            </button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat('insertOrderedList')} className={getBtnClass('insertOrderedList')} title="Lista Numerada">
                <ListOrdered size={16} />
            </button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat('formatBlock', 'blockquote')} className={getBtnClass('blockquote')} title="Citação">
                <Quote size={16} />
            </button>

            <div className={separatorClass}></div>

            {/* Inserts */}
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat('link')} className={getBtnClass('link')} title="Link">
                <LinkIcon size={16} />
            </button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat('image')} className={btnClass} title="Imagem">
                <ImageIcon size={16} />
            </button>

            <div className="flex-1"></div>

            <button onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat('removeFormat')} className={`${btnClass} text-red-400 hover:text-red-500`} title="Limpar Formatação">
                <RemoveFormatting size={16} />
            </button>

            <div className={separatorClass}></div>

            <button onMouseDown={(e) => e.preventDefault()} onClick={() => onFormat('rewrite')} className={`${btnClass} text-purple-500 hover:text-purple-600`} title="Reescrever com IA">
                <Sparkles size={16} />
            </button>
        </div>
    );
};

export default RichTextToolbar;
