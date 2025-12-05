import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Tag, Sparkles, Eye, ChevronRight, CornerDownRight } from 'lucide-react';
import { generateCategoryDescription } from '../../services/geminiService';

interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    parentId?: string | null;
}

const CategoryList: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editSlug, setEditSlug] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editParentId, setEditParentId] = useState<string | null>(null);

    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryParent, setNewCategoryParent] = useState<string>('');
    const [generatingAI, setGeneratingAI] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const slug = newCategoryName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-');
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newCategoryName,
                    slug,
                    description: '',
                    parentId: newCategoryParent || null
                })
            });
            if (res.ok) {
                loadCategories();
                setNewCategoryName('');
                setNewCategoryParent('');
            }
        } catch (e) {
            alert('Erro ao adicionar');
        }
    };

    const handleEdit = (cat: Category) => {
        setEditingId(cat.id);
        setEditName(cat.name);
        setEditSlug(cat.slug);
        setEditDescription(cat.description || '');
        setEditParentId(cat.parentId || '');
    };

    const handleSave = async () => {
        if (!editingId) return;

        // Prevent self-parenting
        if (editParentId === editingId) {
            alert("Uma categoria não pode ser pai de si mesma.");
            return;
        }

        try {
            const res = await fetch(`/api/categories/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName,
                    slug: editSlug,
                    description: editDescription,
                    parentId: editParentId || null
                })
            });
            if (res.ok) {
                setEditingId(null);
                loadCategories();
            }
        } catch (e) {
            alert('Erro ao salvar');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza? Isso pode afetar posts que usam esta categoria.')) return;
        try {
            await fetch(`/api/categories/${id}`, { method: 'DELETE' });
            loadCategories();
        } catch (e) {
            alert('Erro ao excluir');
        }
    };

    const handleGenerateAI = async () => {
        if (!editName) return;
        setGeneratingAI(true);
        try {
            const desc = await generateCategoryDescription(editName);
            setEditDescription(desc);
        } catch (e) {
            alert('Erro ao gerar descrição IA');
        } finally {
            setGeneratingAI(false);
        }
    };

    // Recursive function to organize categories
    const buildCategoryTree = (cats: Category[], parentId: string | null = null, level = 0): { category: Category, level: number }[] => {
        const result: { category: Category, level: number }[] = [];
        const children = cats.filter(c => (c.parentId || null) === parentId);

        for (const child of children) {
            result.push({ category: child, level });
            result.push(...buildCategoryTree(cats, child.id, level + 1));
        }

        return result;
    };

    const sortedCategories = buildCategoryTree(categories);

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-serif flex items-center gap-2">
                    <Tag /> Gerenciar Categorias
                </h2>
            </div>

            {/* Add New */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex flex-col md:flex-row gap-2">
                <input
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="Nome da nova categoria..."
                    className="flex-1 p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-transparent outline-none focus:border-bible-gold"
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />

                <select
                    value={newCategoryParent}
                    onChange={e => setNewCategoryParent(e.target.value)}
                    className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-transparent outline-none focus:border-bible-gold text-sm min-w-[200px]"
                >
                    <option value="">Sem categoria pai (Raiz)</option>
                    {sortedCategories.map(({ category, level }) => (
                        <option key={category.id} value={category.id}>
                            {'\u00A0'.repeat(level * 4)}{category.name}
                        </option>
                    ))}
                </select>

                <button
                    onClick={handleAdd}
                    disabled={!newCategoryName.trim()}
                    className="px-4 py-2 bg-bible-gold text-white rounded-lg font-bold hover:bg-yellow-600 disabled:opacity-50"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-stone-50 dark:bg-stone-950/50 border-b border-stone-200 dark:border-stone-800">
                        <tr>
                            <th className="p-4 font-medium opacity-70 w-1/3">Nome</th>
                            <th className="p-4 font-medium opacity-70 w-1/4">Slug</th>
                            <th className="p-4 font-medium opacity-70 w-1/3">Descrição (SEO)</th>
                            <th className="p-4 font-medium opacity-70 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedCategories.map(({ category: cat, level }) => (
                            <tr key={cat.id} className="border-b border-stone-100 dark:border-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800/50 align-top">
                                {editingId === cat.id ? (
                                    <>
                                        <td className="p-4">
                                            <div className="space-y-2">
                                                <input
                                                    value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    className="w-full p-2 border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-800"
                                                    placeholder="Nome"
                                                />
                                                <select
                                                    value={editParentId || ''}
                                                    onChange={e => setEditParentId(e.target.value)}
                                                    className="w-full p-2 border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-800 text-sm"
                                                >
                                                    <option value="">Sem categoria pai (Raiz)</option>
                                                    {sortedCategories.filter(c => c.category.id !== cat.id).map(({ category: c, level: l }) => (
                                                        <option key={c.id} value={c.id}>
                                                            {'\u00A0'.repeat(l * 4)}{c.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <input
                                                value={editSlug}
                                                onChange={e => setEditSlug(e.target.value)}
                                                className="w-full p-2 border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-800 font-mono text-sm"
                                                placeholder="slug"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-2">
                                                <textarea
                                                    value={editDescription}
                                                    onChange={e => setEditDescription(e.target.value)}
                                                    className="w-full p-2 border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-800 text-sm h-24 resize-none"
                                                    placeholder="Descrição para SEO..."
                                                />
                                                <button
                                                    onClick={handleGenerateAI}
                                                    disabled={generatingAI}
                                                    className="text-xs flex items-center gap-1 text-bible-gold hover:text-yellow-600 font-medium disabled:opacity-50"
                                                >
                                                    <Sparkles size={12} />
                                                    {generatingAI ? 'Gerando...' : 'Gerar com IA'}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={handleSave} className="p-2 text-bible-gold hover:bg-yellow-50 rounded" title="Salvar"><Save size={18} /></button>
                                                <button onClick={() => setEditingId(null)} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Cancelar"><X size={18} /></button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
                                                {level > 0 && <CornerDownRight size={14} className="opacity-30" />}
                                                <span className="font-medium">{cat.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 opacity-60 font-mono text-sm">{cat.slug}</td>
                                        <td className="p-4 text-sm opacity-70 line-clamp-2">{cat.description || <span className="italic opacity-50">Sem descrição</span>}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => window.open(`/blog?category=${cat.slug}`, '_blank')} className="p-2 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 rounded" title="Visualizar"><Eye size={18} /></button>
                                                <button onClick={() => handleEdit(cat)} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded"><Edit2 size={18} /></button>
                                                <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        {categories.length === 0 && !loading && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center opacity-50">Nenhuma categoria encontrada.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CategoryList;
