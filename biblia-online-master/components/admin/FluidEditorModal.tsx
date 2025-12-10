import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw, AlertTriangle } from 'lucide-react';

interface FluidEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    book: string;
    chapter: number;
}

interface ChapterContent {
    title: string;
    paragraphs: string[];
}

const FluidEditorModal: React.FC<FluidEditorModalProps> = ({ isOpen, onClose, book, chapter }) => {
    const [content, setContent] = useState<ChapterContent | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load content when opening
    useEffect(() => {
        if (isOpen && book && chapter) {
            loadContent();
        } else {
            setContent(null);
            setError(null);
        }
    }, [isOpen, book, chapter]);

    const loadContent = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/fluid/pt/${encodeURIComponent(book)}/${chapter}`);
            if (response.ok) {
                const data = await response.json();
                setContent(data);
            } else {
                setError('Conteúdo não encontrado ou erro ao carregar.');
            }
        } catch (e) {
            setError('Erro de conexão ao carregar conteúdo.');
        }
        setIsLoading(false);
    };

    const handleSave = async () => {
        if (!content) return;
        setIsSaving(true);
        try {
            const response = await fetch('/api/fluid', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lang: 'pt',
                    book,
                    chapter,
                    content
                })
            });

            if (response.ok) {
                onClose();
            } else {
                alert('Erro ao salvar alterações.');
            }
        } catch (e) {
            alert('Erro de conexão ao salvar.');
        }
        setIsSaving(false);
    };

    const updateParagraph = (index: number, text: string) => {
        if (!content) return;
        const newParagraphs = [...content.paragraphs];
        newParagraphs[index] = text;
        setContent({ ...content, paragraphs: newParagraphs });
    };

    const addParagraph = () => {
        if (!content) return;
        setContent({ ...content, paragraphs: [...content.paragraphs, ""] });
    };

    const removeParagraph = (index: number) => {
        if (!content) return;
        const newParagraphs = content.paragraphs.filter((_, i) => i !== index);
        setContent({ ...content, paragraphs: newParagraphs });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-stone-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-stone-200 dark:border-stone-800">
                {/* Header */}
                <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-950 rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-stone-800 dark:text-stone-100">
                            Editar {book} {chapter}
                        </h2>
                        <p className="text-sm opacity-60">Edite o título e os parágrafos da leitura fluida.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <RefreshCw className="animate-spin mb-4" size={40} />
                            <p>Carregando conteúdo...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-red-500">
                            <AlertTriangle size={48} className="mb-4" />
                            <p className="text-lg font-bold">{error}</p>
                            <button onClick={loadContent} className="mt-4 px-4 py-2 bg-stone-100 dark:bg-stone-800 rounded-lg text-stone-600 dark:text-stone-300">
                                Tentar Novamente
                            </button>
                        </div>
                    ) : content ? (
                        <>
                            {/* Title Editor */}
                            <div>
                                <label className="block text-sm font-bold text-stone-500 mb-2 uppercase tracking-wider">Título do Capítulo</label>
                                <input
                                    type="text"
                                    value={content.title}
                                    onChange={(e) => setContent({ ...content, title: e.target.value })}
                                    className="w-full text-2xl font-serif font-bold p-4 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-bible-gold outline-none"
                                />
                            </div>

                            {/* Paragraphs Editor */}
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-stone-500 uppercase tracking-wider">Parágrafos</label>
                                {content.paragraphs.map((para, idx) => (
                                    <div key={idx} className="relative group">
                                        <textarea
                                            value={para}
                                            onChange={(e) => updateParagraph(idx, e.target.value)}
                                            rows={Math.max(3, Math.ceil(para.length / 100))}
                                            className="w-full p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-bible-gold outline-none leading-relaxed text-lg"
                                        />
                                        <button
                                            onClick={() => removeParagraph(idx)}
                                            className="absolute top-2 right-2 p-2 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remover parágrafo"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={addParagraph}
                                    className="w-full py-4 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-xl text-stone-400 hover:text-bible-gold hover:border-bible-gold/50 hover:bg-bible-gold/5 transition-all font-bold"
                                >
                                    + Adicionar Parágrafo
                                </button>
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 rounded-b-2xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !content}
                        className="px-6 py-3 rounded-xl font-bold text-white bg-bible-gold hover:bg-yellow-600 shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FluidEditorModal;
