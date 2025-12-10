import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Globe, Layout } from 'lucide-react';

interface Settings {
    siteTitle: string;
    siteDescription: string;
    footerLinks: { label: string; url: string }[];
    socialLinks: { facebook: string; instagram: string; youtube: string };
}

const SettingsManager: React.FC = () => {
    const [settings, setSettings] = useState<Settings>({
        siteTitle: '',
        siteDescription: '',
        footerLinks: [],
        socialLinks: { facebook: '', instagram: '', youtube: '' }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                setSettings(prev => ({ ...prev, ...data }));
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            alert('Configurações salvas!');
        } catch (e) {
            alert('Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    const addFooterLink = () => {
        setSettings(prev => ({
            ...prev,
            footerLinks: [...prev.footerLinks, { label: 'Novo Link', url: '/' }]
        }));
    };

    const removeFooterLink = (index: number) => {
        setSettings(prev => ({
            ...prev,
            footerLinks: prev.footerLinks.filter((_, i) => i !== index)
        }));
    };

    const updateFooterLink = (index: number, field: 'label' | 'url', value: string) => {
        const newLinks = [...settings.footerLinks];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setSettings(prev => ({ ...prev, footerLinks: newLinks }));
    };

    if (loading) return <div className="p-8">Carregando...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-serif flex items-center gap-2">
                    <SettingsIcon /> Configurações do Site
                </h2>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-bible-gold text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2 disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            {/* General Settings */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-lg">
                    <Globe size={20} className="text-bible-gold" /> Geral
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 opacity-70">Título do Site</label>
                        <input
                            type="text"
                            value={settings.siteTitle}
                            onChange={e => setSettings({ ...settings, siteTitle: e.target.value })}
                            className="w-full p-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 opacity-70">Descrição (SEO)</label>
                        <textarea
                            value={settings.siteDescription}
                            onChange={e => setSettings({ ...settings, siteDescription: e.target.value })}
                            className="w-full p-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-transparent h-24"
                        />
                    </div>
                </div>
            </div>

            {/* Footer Links */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center gap-2 text-lg">
                        <Layout size={20} className="text-bible-gold" /> Rodapé
                    </h3>
                    <button onClick={addFooterLink} className="text-sm text-bible-gold hover:underline flex items-center gap-1">
                        <Plus size={16} /> Adicionar Link
                    </button>
                </div>
                <div className="space-y-3">
                    {settings.footerLinks.map((link, i) => (
                        <div key={i} className="flex gap-2">
                            <input
                                type="text"
                                value={link.label}
                                onChange={e => updateFooterLink(i, 'label', e.target.value)}
                                placeholder="Nome"
                                className="flex-1 p-2 rounded border border-stone-200 dark:border-stone-700 bg-transparent"
                            />
                            <input
                                type="text"
                                value={link.url}
                                onChange={e => updateFooterLink(i, 'url', e.target.value)}
                                placeholder="URL (/exemplo)"
                                className="flex-1 p-2 rounded border border-stone-200 dark:border-stone-700 bg-transparent"
                            />
                            <button
                                onClick={() => removeFooterLink(i)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    {settings.footerLinks.length === 0 && (
                        <p className="text-center opacity-50 py-4">Nenhum link no rodapé.</p>
                    )}
                </div>
            </div>

            {/* Data Sync Section */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-lg">
                    <Globe size={20} className="text-bible-gold" /> Dados e Sincronização
                </h3>
                <div className="space-y-4">
                    <p className="text-sm opacity-70">
                        Se você gerou conteúdo que aparece apenas para você (no seu navegador), use este botão para enviá-lo ao servidor e torná-lo público.
                    </p>
                    <button
                        onClick={async () => {
                            if (!confirm("Isso enviará todos os capítulos salvos no seu navegador para o servidor. Continuar?")) return;

                            setSaving(true);
                            let count = 0;
                            let errors = 0;

                        }}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                    >
                        <Globe size={18} />
                        {saving ? 'Sincronizando...' : 'Sincronizar Cache Local para Servidor'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
);

export default SettingsManager;
