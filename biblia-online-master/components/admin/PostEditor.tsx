import React, { useState, useEffect, useRef } from 'react';
import { bibleBooks, normalizeBookName } from '../../constants';
import { Save, RefreshCw, Check, Globe, Search, Link as LinkIcon, Sparkles, Eye, Code, Settings, ChevronRight, ChevronLeft, PlayCircle, StopCircle } from 'lucide-react';
import { generateFluidContent, getFluidChapterContent } from '../../services/geminiService';
import RichTextToolbar from './RichTextToolbar';
import MassGenerationModal from './MassGenerationModal';

interface PostEditorProps {
    isDark: boolean;
}

const PostEditor: React.FC<PostEditorProps> = ({ isDark }) => {
    const [selectedBook, setSelectedBook] = useState(bibleBooks[0].name);
    const [selectedChapter, setSelectedChapter] = useState(1);
    const [loading, setLoading] = useState(false);

    // Content State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState(''); // Unified content string
    const [slug, setSlug] = useState('');
    const [metaDescription, setMetaDescription] = useState('');

    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'generating'>('idle');
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const [isSettingsOpen, setIsSettingsOpen] = useState(true);

    // Book Selector State
    const [isBookSelectorOpen, setIsBookSelectorOpen] = useState(false);
    const [bookSearch, setBookSearch] = useState('');
    const [testamentFilter, setTestamentFilter] = useState<'Todos' | 'Antigo' | 'Novo'>('Todos');

    // Mass Generation State
    const [isMassGenerating, setIsMassGenerating] = useState(false);
    const [isMassModalOpen, setIsMassModalOpen] = useState(false);
    const [massProgress, setMassProgress] = useState({ current: 0, total: 0, skipped: 0, generated: 0, errors: 0 });
    const [massLogs, setMassLogs] = useState<string[]>([]);
    const massStopRef = useRef(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load content when selection changes
    useEffect(() => {
        loadContent();
    }, [selectedBook, selectedChapter]);

    const loadContent = async () => {
        setLoading(true);
        setStatus('idle');
        try {
            const normalizedBook = normalizeBookName(selectedBook);

            // 1. Fetch Content
            const res = await fetch(`/api/fluid/pt/${normalizedBook}/${selectedChapter}`);
            if (res.ok) {
                const data = await res.json();
                setTitle(data.title || `${selectedBook} ${selectedChapter}`);
                // Join paragraphs with double newline for editing
                setContent((data.paragraphs || []).join('\n\n'));
                setMetaDescription(data.metaDescription || '');
            } else {
                // Template for new content
                setTitle(`${selectedBook} ${selectedChapter}`);
                setContent('');
                setMetaDescription(`Leia ${selectedBook} ${selectedChapter} na Bíblia Online. Versão adaptada para leitura fluida.`);
            }

            // 2. Fetch Slug
            const linksRes = await fetch('/api/admin/links');
            if (linksRes.ok) {
                const links = await linksRes.json();
                const target = `/leitura/${normalizedBook}/${selectedChapter}`;
                const foundSlug = Object.keys(links).find(key => links[key] === target);
                setSlug(foundSlug || '');
            }

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setStatus('saving');
        try {
            const normalizedBook = normalizeBookName(selectedBook);
            // Split content back into paragraphs
            const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim() !== '');

            const res = await fetch('/api/fluid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lang: 'pt',
                    book: normalizedBook,
                    chapter: selectedChapter,
                    content: {
                        title,
                        paragraphs
                    },
                    slug: slug,
                    metaDescription: metaDescription
                })
            });

            if (res.ok) {
                setStatus('saved');
                setTimeout(() => setStatus('idle'), 2000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    const handleGenerateAI = async () => {
        if (!confirm('Isso substituirá o conteúdo atual. Continuar?')) return;
        setStatus('generating');
        try {
            const data = await generateFluidContent(selectedBook, selectedChapter, 'pt');
            if ('error' in data) {
                alert(data.error);
                setStatus('error');
            } else {
                setTitle(data.title);
                setContent(data.paragraphs.join('\n\n'));
                setStatus('idle');
            }
        } catch (e) {
            setStatus('error');
        }
    };

    const handleMassGenerate = async () => {
        const bookData = bibleBooks.find(b => b.name === selectedBook);
        if (!bookData) return;

        // Reset and Open Modal
        setIsMassModalOpen(true);
        setIsMassGenerating(true);
        massStopRef.current = false;
        setMassProgress({ current: 0, total: bookData.chapters, skipped: 0, generated: 0, errors: 0 });
        setMassLogs([]);

        const addLog = (msg: string) => setMassLogs(prev => [...prev, msg]);

        addLog(`Iniciando geração para ${selectedBook} (${bookData.chapters} capítulos)...`);

        for (let i = 1; i <= bookData.chapters; i++) {
            if (massStopRef.current) {
                addLog('Processo interrompido pelo usuário.');
                break;
            }

            setMassProgress(prev => ({ ...prev, current: i }));

            try {
                const normalizedBook = normalizeBookName(selectedBook);

                // 1. Check if exists on server
                const checkRes = await fetch(`/api/fluid/pt/${normalizedBook}/${i}`);

                if (checkRes.ok) {
                    addLog(`Capítulo ${i}: Já existe. Pulando.`);
                    setMassProgress(prev => ({ ...prev, skipped: prev.skipped + 1 }));
                } else {
                    addLog(`Capítulo ${i}: Gerando conteúdo...`);

                    let attempts = 0;
                    let success = false;
                    let delay = 2000; // Start with 2s delay

                    while (!success && attempts < 5 && !massStopRef.current) {
                        // 2. Generate
                        const data = await getFluidChapterContent(selectedBook, i, 'pt');

                        if ('error' in data) {
                            const errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);

                            // Check for Rate Limit (429 or Quota)
                            if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
                                attempts++;
                                const waitTime = delay * Math.pow(2, attempts - 1); // Exponential backoff: 2s, 4s, 8s, 16s...
                                addLog(`⚠️ Cota excedida (Cap ${i}). Aguardando ${waitTime / 1000}s para tentar novamente (${attempts}/5)...`);
                                await new Promise(r => setTimeout(r, waitTime));
                            } else {
                                // Fatal error
                                addLog(`ERRO no Capítulo ${i}: ${errorMsg}`);
                                setMassProgress(prev => ({ ...prev, errors: prev.errors + 1 }));
                                break; // Exit retry loop
                            }
                        } else {
                            // Success! Save to server
                            await fetch('/api/fluid', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    lang: 'pt',
                                    book: normalizedBook,
                                    chapter: i,
                                    content: data
                                })
                            });
                            addLog(`Capítulo ${i}: Gerado e salvo com sucesso!`);
                            setMassProgress(prev => ({ ...prev, generated: prev.generated + 1 }));
                            success = true;
                        }
                    }

                    if (!success && attempts >= 5) {
                        addLog(`ERRO CRÍTICO no Capítulo ${i}: Falha após várias tentativas.`);
                        setMassProgress(prev => ({ ...prev, errors: prev.errors + 1 }));
                    }

                    // Standard delay between chapters to be nice to the API
                    await new Promise(r => setTimeout(r, 2000));
                }

            } catch (e) {
                console.error(e);
                addLog(`ERRO CRÍTICO no Capítulo ${i}: ${e}`);
                setMassProgress(prev => ({ ...prev, errors: prev.errors + 1 }));
            }
        }

        setIsMassGenerating(false);
        addLog('Processo finalizado.');
    };

    const handleFormat = (format: 'bold' | 'italic' | 'link' | 'clear') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);

        let newText = content;
        let newCursorPos = end;

        if (format === 'bold') {
            newText = content.substring(0, start) + `**${selectedText}**` + content.substring(end);
            newCursorPos = end + 4;
        } else if (format === 'italic') {
            newText = content.substring(0, start) + `*${selectedText}*` + content.substring(end);
            newCursorPos = end + 2;
        } else if (format === 'link') {
            newText = content.substring(0, start) + `[${selectedText || 'texto'}](url)` + content.substring(end);
            newCursorPos = end + (selectedText ? 3 : 8);
        } else if (format === 'clear') {
            newText = content.substring(0, start) + selectedText.replace(/[\*\[\]\(\)]/g, '') + content.substring(end);
        }

        setContent(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    // Simple Markdown Renderer for Preview
    const renderMarkdown = (text: string) => {
        return text.split(/\n\s*\n/).map((paragraph, i) => {
            // Very basic parsing for bold, italic, link
            let html = paragraph
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-500 underline" target="_blank">$1</a>');

            return <p key={i} className="mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
        });
    };

    // Filter books
    const filteredBooks = bibleBooks.filter(b => {
        const matchesSearch = b.name.toLowerCase().includes(bookSearch.toLowerCase());
        const matchesTestament = testamentFilter === 'Todos' || b.testament === (testamentFilter === 'Antigo' ? 'Old' : 'New');
        return matchesSearch && matchesTestament;
    });

    return (
        <div className="flex h-full gap-6">
            <MassGenerationModal
                isOpen={isMassModalOpen}
                onClose={() => setIsMassModalOpen(false)}
                onStop={() => massStopRef.current = true}
                isGenerating={isMassGenerating}
                bookName={selectedBook}
                progress={massProgress}
                logs={massLogs}
            />

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">

                {/* Header / Toolbar */}
                <div className="flex items-center justify-between bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                    <div className="flex items-center gap-4">
                        {/* Book Selector Trigger */}
                        <div className="relative">
                            <button
                                onClick={() => setIsBookSelectorOpen(!isBookSelectorOpen)}
                                className="flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-stone-800 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors font-serif font-bold text-lg min-w-[180px] justify-between"
                            >
                                {selectedBook}
                                <ChevronRight size={16} className={`transform transition-transform ${isBookSelectorOpen ? 'rotate-90' : ''}`} />
                            </button>

                            {/* Dropdown Popover */}
                            {isBookSelectorOpen && (
                                <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-200 dark:border-stone-800 z-50 overflow-hidden animate-fadeIn">
                                    {/* Search & Filter Header */}
                                    <div className="p-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
                                        <div className="relative mb-3">
                                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                                            <input
                                                type="text"
                                                placeholder="Buscar livro..."
                                                value={bookSearch}
                                                onChange={(e) => setBookSearch(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm focus:ring-2 focus:ring-bible-gold/50 outline-none"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="flex gap-1 p-1 bg-stone-200 dark:bg-stone-800 rounded-lg">
                                            {['Todos', 'Antigo', 'Novo'].map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setTestamentFilter(t as any)}
                                                    className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${testamentFilter === t ? 'bg-white dark:bg-stone-700 shadow-sm text-bible-gold' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Book List */}
                                    <div className="max-h-64 overflow-y-auto p-2">
                                        {filteredBooks.map(book => (
                                            <button
                                                key={book.name}
                                                onClick={() => {
                                                    setSelectedBook(book.name);
                                                    setSelectedChapter(1);
                                                    setIsBookSelectorOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between group ${selectedBook === book.name ? 'bg-bible-gold/10 text-bible-gold' : 'hover:bg-stone-100 dark:hover:bg-stone-800'}`}
                                            >
                                                <span>{book.name}</span>
                                                {selectedBook === book.name && <Check size={14} />}
                                            </button>
                                        ))}
                                        {filteredBooks.length === 0 && (
                                            <div className="p-4 text-center text-sm opacity-50">Nenhum livro encontrado</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Chapter Selector */}
                        <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 rounded-lg px-2">
                            <span className="text-xs font-bold uppercase tracking-wider opacity-50 pl-2">Cap</span>
                            <select
                                value={selectedChapter}
                                onChange={(e) => setSelectedChapter(parseInt(e.target.value))}
                                className="bg-transparent py-2 pr-8 pl-1 font-bold outline-none cursor-pointer appearance-none"
                                style={{ backgroundImage: 'none' }}
                            >
                                {Array.from({ length: bibleBooks.find(b => b.name === selectedBook)?.chapters || 50 }, (_, i) => i + 1).map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <ChevronRight size={14} className="opacity-50 pr-2" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Mass Generation Button */}
                        <button
                            onClick={handleMassGenerate}
                            className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400"
                        >
                            <Sparkles size={18} />
                            Gerar Livro Completo
                        </button>

                        <button
                            onClick={handleGenerateAI}
                            disabled={status === 'generating' || isMassGenerating}
                            className="px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                            title="Gerar com IA (apenas este capítulo)"
                        >
                            <Sparkles size={18} className={status === 'generating' ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">Gerar IA</span>
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={status === 'saving' || isMassGenerating}
                            className="px-6 py-2 bg-bible-gold text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2 shadow-sm shadow-yellow-500/20 transition-all disabled:opacity-50"
                        >
                            {status === 'saving' ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                            <span>{status === 'saved' ? 'Salvo!' : 'Salvar'}</span>
                        </button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden flex flex-col relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 dark:bg-stone-900/80 z-10 flex items-center justify-center backdrop-blur-sm">
                            <RefreshCw className="animate-spin text-bible-gold" size={32} />
                        </div>
                    )}

                    {/* Meta Fields */}
                    <div className="p-4 border-b border-stone-100 dark:border-stone-800 grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50/50 dark:bg-stone-900/50">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-wider opacity-50 flex items-center gap-1">
                                <Globe size={12} /> Slug (URL)
                            </label>
                            <div className="flex items-center gap-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2">
                                <span className="text-stone-400 text-sm select-none">/leitura/</span>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder={`${normalizeBookName(selectedBook)}/${selectedChapter}`}
                                    className="flex-1 bg-transparent outline-none text-sm font-mono text-stone-600 dark:text-stone-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-wider opacity-50 flex items-center gap-1">
                                <Search size={12} /> Meta Descrição (SEO)
                            </label>
                            <input
                                type="text"
                                value={metaDescription}
                                onChange={(e) => setMetaDescription(e.target.value)}
                                placeholder="Resumo para o Google..."
                                className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-bible-gold transition-colors"
                            />
                        </div>
                    </div>

                    {/* Title Input */}
                    <div className="p-6 pb-2">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Título do Capítulo"
                            className="w-full text-3xl font-serif font-bold bg-transparent outline-none placeholder:opacity-30"
                        />
                    </div>

                    {/* Editor Tabs */}
                    <div className="flex items-center gap-1 mb-2 border-b border-stone-200 dark:border-stone-800 px-6">
                        <button
                            onClick={() => setViewMode('edit')}
                            className={`px-4 py-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors
                                ${viewMode === 'edit' ? 'border-bible-gold text-bible-gold' : 'border-transparent opacity-50 hover:opacity-100'}
                            `}
                        >
                            <Code size={14} /> Texto (HTML)
                        </button>
                        <button
                            onClick={() => setViewMode('preview')}
                            className={`px-4 py-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors
                                ${viewMode === 'preview' ? 'border-bible-gold text-bible-gold' : 'border-transparent opacity-50 hover:opacity-100'}
                            `}
                        >
                            <Eye size={14} /> Visual
                        </button>
                    </div>

                    {/* Toolbar (Only in Edit Mode) */}
                    {viewMode === 'edit' && (
                        <div className="sticky top-0 z-10 bg-white/80 dark:bg-stone-950/80 backdrop-blur-sm py-2 px-6">
                            <RichTextToolbar onFormat={handleFormat} isDark={isDark} />
                        </div>
                    )}

                    {/* Editor / Preview */}
                    <div className="flex-1 relative">
                        {viewMode === 'edit' ? (
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Escreva ou gere o conteúdo aqui..."
                                className="flex-1 w-full p-6 resize-none outline-none font-serif text-lg leading-relaxed bg-transparent h-full"
                            />
                        ) : (
                            <div className={`w-full h-full p-6 overflow-y-auto prose dark:prose-invert max-w-none
                                    ${isDark ? 'bg-stone-900' : 'bg-white'}
                            `}>
                                {renderMarkdown(content)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar (Settings) - Optional, can be toggled */}
            {isSettingsOpen && (
                <div className="w-80 bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 hidden xl:flex flex-col">
                    <div className="p-4 border-b border-stone-200 dark:border-stone-800 font-bold flex items-center gap-2">
                        <Settings size={18} /> Detalhes
                    </div>
                    <div className="p-4 space-y-6 overflow-y-auto flex-1">
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold opacity-70">Status</h4>
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${status === 'saved' ? 'bg-green-100 text-green-700' :
                                    status === 'error' ? 'bg-red-100 text-red-700' :
                                        'bg-stone-100 text-stone-600'
                                }`}>
                                <div className={`w-2 h-2 rounded-full ${status === 'saved' ? 'bg-green-500' :
                                        status === 'error' ? 'bg-red-500' :
                                            'bg-stone-400'
                                    }`} />
                                {status === 'idle' ? 'Pronto' :
                                    status === 'saving' ? 'Salvando...' :
                                        status === 'saved' ? 'Salvo' :
                                            status === 'error' ? 'Erro' : 'Gerando...'}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-sm font-bold opacity-70">Dicas de SEO</h4>
                            <ul className="text-sm space-y-2 text-stone-600 dark:text-stone-400">
                                <li className="flex gap-2">
                                    {title.length > 10 ? <Check size={16} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border border-stone-300" />}
                                    Título descritivo
                                </li>
                                <li className="flex gap-2">
                                    {metaDescription.length > 50 ? <Check size={16} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border border-stone-300" />}
                                    Meta descrição completa
                                </li>
                                <li className="flex gap-2">
                                    {content.length > 500 ? <Check size={16} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border border-stone-300" />}
                                    Conteúdo rico ({content.length} chars)
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostEditor;
