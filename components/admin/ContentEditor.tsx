import React, { useState, useEffect } from 'react';
import { bibleBooks, normalizeBookName } from '../../constants';
import { Save, RefreshCw, Check } from 'lucide-react';

interface ContentEditorProps {
    isDark: boolean;
}

const ContentEditor: React.FC<ContentEditorProps> = ({ isDark }) => {
    const [selectedBook, setSelectedBook] = useState(bibleBooks[0].name);
    const [selectedChapter, setSelectedChapter] = useState(1);
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState<{ title: string; paragraphs: string[] } | null>(null);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Load content when selection changes
    useEffect(() => {
        loadContent();
    }, [selectedBook, selectedChapter]);

    const loadContent = async () => {
        setLoading(true);
        setContent(null);
        setStatus('idle');
        try {
            const normalizedBook = normalizeBookName(selectedBook);
            const res = await fetch(`/api/fluid/pt/${normalizedBook}/${selectedChapter}`);
            if (res.ok) {
                const data = await res.json();
                setContent(data);
            } else {
                // If not found, set empty template
                setContent({
                    title: `${selectedBook} ${selectedChapter}`,
                    paragraphs: ['']
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!content) return;
        setStatus('saving');
        try {
            const normalizedBook = normalizeBookName(selectedBook);
            const res = await fetch('/api/fluid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lang: 'pt',
                    book: normalizedBook,
                    chapter: selectedChapter,
                    content
                })
            });

            if (res.ok) {
                setStatus('saved');
                setTimeout(() => setStatus('idle'), 2000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        }
    };

    const updateParagraph = (index: number, text: string) => {
        if (!content) return;
        const newParagraphs = [...content.paragraphs];
        newParagraphs[index] = text;
        setContent({ ...content, paragraphs: newParagraphs });
    };

    const addParagraph = () => {
        if (!content) return;
        setContent({ ...content, paragraphs: [...content.paragraphs, ''] });
    };

    const removeParagraph = (index: number) => {
        if (!content) return;
        const newParagraphs = content.paragraphs.filter((_, i) => i !== index);
        setContent({ ...content, paragraphs: newParagraphs });
    };

    return (
        <div className="max-w-4xl mx-auto animate-fadeIn">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold font-serif">Editor de Leitura Fluida</h2>
                <div className="flex gap-2">
                    <select
                        value={selectedBook}
                        onChange={(e) => { setSelectedBook(e.target.value); setSelectedChapter(1); }}
                        className={`p-2 rounded-lg border ${isDark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-200'}`}
                    >
                        {bibleBooks.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                    </select>
                    <select
                        value={selectedChapter}
                        onChange={(e) => setSelectedChapter(parseInt(e.target.value))}
                        className={`p-2 rounded-lg border ${isDark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-200'}`}
                    >
                        {Array.from({ length: bibleBooks.find(b => b.name === selectedBook)?.chapters || 1 }, (_, i) => i + 1).map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 opacity-50">Carregando...</div>
            ) : content ? (
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold mb-2 opacity-70">Título do Capítulo</label>
                        <input
                            type="text"
                            value={content.title}
                            onChange={(e) => setContent({ ...content, title: e.target.value })}
                            className={`w-full p-4 rounded-xl border font-serif text-xl ${isDark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-200'}`}
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-bold opacity-70">Parágrafos</label>
                        {content.paragraphs.map((p, i) => (
                            <div key={i} className="flex gap-2">
                                <textarea
                                    value={p}
                                    onChange={(e) => updateParagraph(i, e.target.value)}
                                    rows={4}
                                    className={`w-full p-4 rounded-xl border ${isDark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-200'}`}
                                />
                                <button
                                    onClick={() => removeParagraph(i)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg h-fit"
                                    title="Remover parágrafo"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={addParagraph}
                            className={`w-full py-3 border-2 border-dashed rounded-xl font-bold opacity-50 hover:opacity-100 transition-opacity ${isDark ? 'border-stone-700' : 'border-stone-300'}`}
                        >
                            + Adicionar Parágrafo
                        </button>
                    </div>

                    <div className="sticky bottom-6 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={status === 'saving'}
                            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all
                                ${status === 'saved' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-bible-gold hover:bg-yellow-600'}
                            `}
                        >
                            {status === 'saving' ? <RefreshCw className="animate-spin" /> : status === 'saved' ? <Check /> : <Save />}
                            {status === 'saving' ? 'Salvando...' : status === 'saved' ? 'Salvo!' : status === 'error' ? 'Erro!' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default ContentEditor;
