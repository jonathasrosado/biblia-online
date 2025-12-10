import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Check, AlertCircle, FileText } from 'lucide-react';

interface Prompts {
    blog_title: string;
    blog_post: string;
    seo_metadata: string;
    chat: string;
}

const PROMPT_LABELS: Record<keyof Prompts, string> = {
    blog_title: 'Geração de Títulos',
    blog_post: 'Geração de Posts',
    seo_metadata: 'Metadados SEO',
    chat: 'Chat Teológico'
};

const PROMPT_DESCRIPTIONS: Record<keyof Prompts, string> = {
    blog_title: 'Prompt usado para gerar títulos de blog a partir de palavras-chave. Garanta que o contexto bíblico/cristão seja forte.',
    blog_post: 'Prompt usado para gerar o conteúdo completo do post. Deve incluir instruções sobre estrutura, links internos e imagens.',
    seo_metadata: 'Prompt usado para gerar metadados SEO (título, descrição, keywords). Deve focar em keywords cristãs/bíblicas.',
    chat: 'Prompt que define a personalidade e comportamento do chat teológico. Deve ser centrado em Cristo e nas Escrituras.'
};

export default function PromptsManager() {
    const [prompts, setPrompts] = useState<Prompts | null>(null);
    const [originalPrompts, setOriginalPrompts] = useState<Prompts | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchPrompts();
    }, []);

    const fetchPrompts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/prompts/config');
            if (!res.ok) throw new Error('Failed to load prompts');
            const data = await res.json();
            setPrompts(data);
            setOriginalPrompts(data);
        } catch (error: any) {
            setMessage({ type: 'error', text: `Erro ao carregar prompts: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!prompts) return;
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/prompts/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prompts)
            });

            if (!res.ok) throw new Error('Failed to save prompts');

            setOriginalPrompts(prompts);
            setMessage({ type: 'success', text: 'Prompts salvos com sucesso!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: `Erro ao salvar: ${error.message}` });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (originalPrompts) {
            setPrompts({ ...originalPrompts });
            setMessage({ type: 'success', text: 'Prompts restaurados' });
        }
    };

    const updatePrompt = (key: keyof Prompts, value: string) => {
        if (!prompts) return;
        setPrompts({ ...prompts, [key]: value });
    };

    const hasChanges = () => {
        if (!prompts || !originalPrompts) return false;
        return JSON.stringify(prompts) !== JSON.stringify(originalPrompts);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bible-gold"></div>
            </div>
        );
    }

    if (!prompts) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-200">Erro ao carregar prompts. Tente recarregar a página.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-stone-800 dark:text-stone-100 mb-2 flex items-center gap-2 font-serif">
                            <FileText className="w-6 h-6 text-bible-gold" />
                            Gerenciar Prompts de IA
                        </h2>
                        <p className="text-stone-600 dark:text-stone-400">
                            Personalize os prompts usados pela IA para garantir contexto bíblico/cristão em todo o conteúdo gerado.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleReset}
                            disabled={!hasChanges() || saving}
                            className="flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Restaurar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges() || saving}
                            className="flex items-center gap-2 px-4 py-2 bg-bible-gold text-white rounded-lg hover:bg-bible-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Salvar Alterações
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                        }`}>
                        {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </div>
                )}
            </div>

            {/* Prompts */}
            {(Object.keys(prompts) as Array<keyof Prompts>).map((key) => (
                <div key={key} className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-bible-gold mb-1">
                            {PROMPT_LABELS[key]}
                        </h3>
                        <p className="text-sm text-stone-600 dark:text-stone-400">
                            {PROMPT_DESCRIPTIONS[key]}
                        </p>
                    </div>
                    <textarea
                        value={prompts[key]}
                        onChange={(e) => updatePrompt(key, e.target.value)}
                        rows={12}
                        className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-4 text-stone-900 dark:text-stone-100 focus:border-bible-gold focus:ring-1 focus:ring-bible-gold focus:outline-none transition-all font-mono text-sm"
                        placeholder={`Prompt para ${PROMPT_LABELS[key].toLowerCase()}...`}
                    />
                    <div className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                        {prompts[key].length} caracteres
                    </div>
                </div>
            ))}
        </div>
    );
}
