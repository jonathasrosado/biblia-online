import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink, Save } from 'lucide-react';

interface LinkManagerProps {
    isDark: boolean;
}

const LinkManager: React.FC<LinkManagerProps> = ({ isDark }) => {
    const [links, setLinks] = useState<Record<string, string>>({});
    const [newSlug, setNewSlug] = useState('');
    const [newTarget, setNewTarget] = useState('');
    const [status, setStatus] = useState<'idle' | 'saving'>('idle');

    useEffect(() => {
        fetch('/api/admin/links')
            .then(res => res.json())
            .then(data => setLinks(data));
    }, []);

    const handleSave = async (updatedLinks: Record<string, string>) => {
        setStatus('saving');
        try {
            await fetch('/api/admin/links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedLinks)
            });
            setLinks(updatedLinks);
        } catch (error) {
            console.error(error);
        } finally {
            setStatus('idle');
        }
    };

    const addLink = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSlug || !newTarget) return;

        // Clean slug (remove leading slash)
        const cleanSlug = newSlug.startsWith('/') ? newSlug.slice(1) : newSlug;

        const updated = { ...links, [cleanSlug]: newTarget };
        handleSave(updated);
        setNewSlug('');
        setNewTarget('');
    };

    const removeLink = (slug: string) => {
        const updated = { ...links };
        delete updated[slug];
        handleSave(updated);
    };

    return (
        <div className="max-w-4xl mx-auto animate-fadeIn">
            <h2 className="text-2xl font-bold font-serif mb-8">Gerenciador de Links</h2>

            <div className={`p-6 rounded-2xl border mb-8 ${isDark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-200'}`}>
                <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-bible-gold" />
                    Novo Link
                </h3>
                <form onSubmit={addLink} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1">Link Curto (Slug)</label>
                        <div className="flex items-center">
                            <span className="opacity-50 mr-1">/</span>
                            <input
                                type="text"
                                value={newSlug}
                                onChange={(e) => setNewSlug(e.target.value)}
                                placeholder="ex: promessa"
                                className={`w-full p-3 rounded-lg border outline-none ${isDark ? 'bg-stone-900 border-stone-700' : 'bg-stone-50 border-stone-200'}`}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-1">Destino</label>
                        <input
                            type="text"
                            value={newTarget}
                            onChange={(e) => setNewTarget(e.target.value)}
                            placeholder="ex: /leitura/salmos/23"
                            className={`w-full p-3 rounded-lg border outline-none ${isDark ? 'bg-stone-900 border-stone-700' : 'bg-stone-50 border-stone-200'}`}
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={!newSlug || !newTarget || status === 'saving'}
                            className="w-full py-3 bg-bible-gold text-white font-bold rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                        >
                            {status === 'saving' ? 'Salvando...' : 'Adicionar Link'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="space-y-3">
                {Object.entries(links).map(([slug, target]) => (
                    <div key={slug} className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}`}>
                        <div className="flex items-center gap-4 overflow-hidden">
                            <div className="min-w-[120px] font-bold text-bible-gold">/{slug}</div>
                            <div className="opacity-30">→</div>
                            <div className="truncate opacity-70">{target}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <a
                                href={`/${slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors opacity-50 hover:opacity-100"
                            >
                                <ExternalLink size={18} />
                            </a>
                            <button
                                onClick={() => removeLink(slug)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                {Object.keys(links).length === 0 && (
                    <div className="text-center py-12 opacity-40 italic">
                        Nenhum link personalizado criado ainda.
                    </div>
                )}
            </div>
        </div>
    );
};

export default LinkManager;
