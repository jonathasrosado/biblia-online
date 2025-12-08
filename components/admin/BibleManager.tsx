import React, { useState, useEffect } from 'react';
import { bibleBooks, normalizeBookName } from '../../constants';
import { Book, CheckCircle, Circle, RefreshCw, Sparkles, Filter, Edit3, Search } from 'lucide-react';
import MassGenerationModal from './MassGenerationModal';
import FluidEditorModal from './FluidEditorModal';

interface BibleManagerProps { }

const BibleManager: React.FC<BibleManagerProps> = () => {
    // Filter State
    const [testamentFilter, setTestamentFilter] = useState<'All' | 'Old' | 'New'>('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Selection State
    const [selectedBook, setSelectedBook] = useState<string>(bibleBooks[0].name);

    // Data State
    const [chaptersStatus, setChaptersStatus] = useState<Record<number, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);

    // Mass Generation State
    const [isMassModalOpen, setIsMassModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, generated: 0, skipped: 0, errors: 0 });
    const [logs, setLogs] = useState<string[]>([]);

    // Editor State
    const [editingChapter, setEditingChapter] = useState<{ book: string, chapter: number } | null>(null);

    const abortControllerRef = React.useRef<AbortController | null>(null);

    // Derived Data: Filter books by Testament AND Search Query
    const filteredBooks = bibleBooks.filter(b => {
        const matchesTestament = testamentFilter === 'All' || b.testament === testamentFilter;
        const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            normalizeBookName(b.name).includes(normalizeBookName(searchQuery));
        return matchesTestament && matchesSearch;
    });

    // Ensure selected book is valid when filter changes
    useEffect(() => {
        // Only change selection if the current book is no longer visible
        const isCurrentBookVisible = filteredBooks.some(b => b.name === selectedBook);

        if (!isCurrentBookVisible) {
            if (filteredBooks.length > 0) {
                setSelectedBook(filteredBooks[0].name);
            } else {
                // Keep selected book even if hidden, or handle "no results" UI
                // For now, let's just keep it to avoid null errors, unless user explicitly changes it
            }
        }
    }, [testamentFilter, searchQuery, filteredBooks, selectedBook]);

    const currentBook = bibleBooks.find(b => b.name === selectedBook) || bibleBooks[0];

    // Check status of chapters for selected book
    useEffect(() => {
        checkChaptersStatus();
    }, [selectedBook]);

    // Refresh status when editor closes (in case of saves)
    useEffect(() => {
        if (!editingChapter) {
            checkChaptersStatus();
        }
    }, [editingChapter]);

    const checkChaptersStatus = async () => {
        setIsLoading(true);
        const status: Record<number, boolean> = {};

        try {
            const response = await fetch('/api/admin/files');
            if (response.ok) {
                const files: string[] = await response.json();
                const normalizedBook = normalizeBookName(selectedBook);

                // Expected format: pt_book-name_chapter.json
                const regex = new RegExp(`pt_${normalizedBook}_(\\d+).json`);

                files.forEach(file => {
                    const match = file.match(regex);
                    if (match) {
                        const chapter = parseInt(match[1]);
                        status[chapter] = true;
                    }
                });
            }
        } catch (error) {
            console.error("Error checking status", error);
        }

        setChaptersStatus(status);
        setIsLoading(false);
    };

    const handleMassGeneration = async () => {
        setIsGenerating(true);
        setLogs([]);
        setProgress({ current: 0, total: currentBook.chapters, generated: 0, skipped: 0, errors: 0 });
        abortControllerRef.current = new AbortController();

        const addLog = (msg: string) => setLogs(prev => [...prev, msg]);
        addLog(`Iniciando geração para ${currentBook.name} (${currentBook.chapters} capítulos)`);

        for (let i = 1; i <= currentBook.chapters; i++) {
            if (abortControllerRef.current?.signal.aborted) {
                addLog("Operação cancelada pelo usuário.");
                break;
            }

            if (chaptersStatus[i]) {
                addLog(`Capítulo ${i}: Já existe. Pulando.`);
                setProgress(prev => ({ ...prev, current: i, skipped: prev.skipped + 1 }));
                continue;
            }

            addLog(`Capítulo ${i}: Gerando contéudo fluido...`);

            try {
                const response = await fetch('/api/ai/fluid-gen', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ book: currentBook.name, chapter: i, language: 'pt' }),
                    signal: abortControllerRef.current.signal
                });

                if (response.ok) {
                    const data = await response.json();
                    let content = data.text;

                    if (typeof content === 'string') {
                        try { content = JSON.parse(content); } catch { }
                    }

                    const saveResponse = await fetch('/api/fluid', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ lang: 'pt', book: currentBook.name, chapter: i, content })
                    });

                    if (saveResponse.ok) {
                        addLog(`Capítulo ${i}: Sucesso!`);
                        setProgress(prev => ({ ...prev, current: i, generated: prev.generated + 1 }));
                        setChaptersStatus(prev => ({ ...prev, [i]: true }));
                    } else {
                        throw new Error("Falha ao salvar");
                    }

                } else {
                    throw new Error(`Erro na API (${response.status})`);
                }

                await new Promise(r => setTimeout(r, 1000));

            } catch (error: any) {
                if (error.name === 'AbortError') break;
                addLog(`Capítulo ${i}: Erro - ${error.message}`);
                setProgress(prev => ({ ...prev, current: i, errors: prev.errors + 1 }));
            }
        }

        setIsGenerating(false);
        addLog("Concluído.");
    };

    const stopGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    return (
        <div className="max-w-6xl mx-auto animate-fadeIn pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-stone-800 dark:text-stone-100 mb-2">
                        Gerenciador de Conteúdo
                    </h1>
                    <p className="text-stone-500">Gerencie as versões fluidas e textos de cada capítulo.</p>
                </div>

                <button
                    onClick={() => setIsMassModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-3 bg-bible-gold text-white rounded-xl font-bold hover:bg-yellow-600 transition-colors shadow-lg"
                >
                    <Sparkles size={18} />
                    Gerar {currentBook.name} em Massa
                </button>
            </div>

            {/* Controls Bar */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 mb-8 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Testament Filter */}
                    <div>
                        <label className="block text-xs font-bold text-stone-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                            <Filter size={12} /> Filtro
                        </label>
                        <div className="flex bg-stone-100 dark:bg-stone-950 p-1 rounded-xl">
                            {(['All', 'Old', 'New'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setTestamentFilter(type)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all
                                        ${testamentFilter === type
                                            ? 'bg-white dark:bg-stone-800 text-bible-gold shadow-sm'
                                            : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'}`}
                                >
                                    {type === 'All' ? 'Todos' : type === 'Old' ? 'Antigo' : 'Novo'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Book Filter Search */}
                    <div>
                        <label className="block text-xs font-bold text-stone-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                            <Search size={12} /> Buscar Livro
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Ex: João, Rute..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl outline-none focus:ring-2 focus:ring-bible-gold text-sm font-bold"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                        </div>
                    </div>

                    {/* Book Selector (Filtered) */}
                    <div>
                        <label className="block text-xs font-bold text-stone-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                            <Book size={12} /> Livro Selecionado
                        </label>
                        <div className="relative">
                            <select
                                value={selectedBook}
                                onChange={(e) => setSelectedBook(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-bible-gold font-serif font-bold text-lg"
                                disabled={filteredBooks.length === 0}
                            >
                                {filteredBooks.length > 0 ? (
                                    filteredBooks.map(b => (
                                        <option key={b.name} value={b.name}>{b.name}</option>
                                    ))
                                ) : (
                                    <option>Nenhum livro encontrado</option>
                                )}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                ▼
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats/Info */}
            <div className="mb-6 flex items-center gap-4 text-sm opacity-60">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Gerado (Clique para editar)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-stone-300"></div>
                    <span>Pendente</span>
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="text-center py-20 animate-pulse">
                    <RefreshCw className="animate-spin mx-auto text-bible-gold mb-4" size={32} />
                    <p className="opacity-50">Verificando arquivos...</p>
                </div>
            ) : filteredBooks.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                    <p>Nenhum livro corresponde aos filtros.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map(chap => {
                        const hasContent = chaptersStatus[chap];
                        return (
                            <div
                                key={chap}
                                onClick={() => hasContent && setEditingChapter({ book: currentBook.name, chapter: chap })}
                                className={`
                                    p-4 rounded-xl border transition-all relative group cursor-pointer
                                    ${hasContent
                                        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30 hover:border-green-400 hover:shadow-md'
                                        : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 opacity-60 cursor-not-allowed'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-lg">{chap}</span>
                                    {hasContent
                                        ? <CheckCircle size={16} className="text-green-500" />
                                        : <Circle size={16} className="text-stone-300" />}
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                                        {hasContent ? 'Gerado' : 'Pendente'}
                                    </div>
                                    {hasContent && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-bible-gold">
                                            <Edit3 size={14} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            <MassGenerationModal
                isOpen={isMassModalOpen}
                onClose={() => setIsMassModalOpen(false)}
                onStart={handleMassGeneration}
                onStop={stopGeneration}
                isGenerating={isGenerating}
                bookName={currentBook.name}
                progress={progress}
                logs={logs}
            />

            {editingChapter && (
                <FluidEditorModal
                    isOpen={!!editingChapter}
                    onClose={() => setEditingChapter(null)}
                    book={editingChapter.book}
                    chapter={editingChapter.chapter}
                />
            )}
        </div>
    );
};

export default BibleManager;
