import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, FileText, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface BlogPost {
    slug: string;
    title: string;
    category: string;
    date: string;
    status: 'published' | 'draft' | 'trash';
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    parentId?: string | null;
}

export const getCategories = async (): Promise<Category[]> => {
    try {
        const res = await fetch('/api/categories');
        if (res.ok) return await res.json();
    } catch (e) {
        console.error(e);
    }
    return [];
};

export const getCategoryName = (catId: string | undefined, categories: Category[]) => {
    if (!catId) return '';
    const cat = categories.find(c => c.id === catId || c.slug === catId);
    return cat ? cat.name : catId;
};

export const buildCategoryTree = (cats: Category[], parentId: string | null = null, level = 0): { category: Category, level: number }[] => {
    const result: { category: Category, level: number }[] = [];
    const children = cats.filter(c => (c.parentId || null) === parentId);

    for (const child of children) {
        result.push({ category: child, level });
        result.push(...buildCategoryTree(cats, child.id, level + 1));
    }

    return result;
};

const BlogManager: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft' | 'trash'>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [postsRes, catsData] = await Promise.all([
                fetch('/api/blog/posts?include_drafts=true'),
                getCategories()
            ]);

            if (postsRes.ok) {
                const postsData = await postsRes.json();
                setPosts(postsData);
            }
            setCategories(catsData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (slug: string) => {
        if (!confirm('Tem certeza que deseja mover para a lixeira?')) return;
        try {
            const currentPost = posts.find(p => p.slug === slug);
            if (!currentPost) return;

            const updatedPost = { ...currentPost, status: 'trash' };

            await fetch(`/api/blog/posts/${slug}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedPost)
            });
            loadData();
        } catch (e) {
            alert('Erro ao mover para lixeira');
        }
    };

    const handleRestore = async (slug: string) => {
        try {
            const currentPost = posts.find(p => p.slug === slug);
            if (!currentPost) return;

            const updatedPost = { ...currentPost, status: 'draft' }; // Restore as draft

            await fetch(`/api/blog/posts/${slug}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedPost)
            });
            loadData();
        } catch (e) {
            alert('Erro ao restaurar');
        }
    };

    const handlePermanentDelete = async (slug: string) => {
        if (!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;
        try {
            await fetch(`/api/blog/posts/${slug}`, { method: 'DELETE' });
            loadData();
        } catch (e) {
            alert('Erro ao excluir permanentemente');
        }
    };

    const filteredPosts = posts.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all'
            ? p.status !== 'trash' // All excludes trash
            : p.status === activeTab;
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

        return matchesSearch && matchesTab && matchesCategory;
    });

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold font-serif flex items-center gap-2">
                    <FileText /> Blog & Artigos
                </h2>
                <Link
                    to="/admin/posts/new"
                    className="px-6 py-2 bg-bible-gold text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2 shadow-lg"
                >
                    <Plus size={18} /> Novo Artigo
                </Link>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg">
                    {(['all', 'published', 'draft', 'trash'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab
                                ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100'
                                : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                                }`}
                        >
                            {tab === 'all' && 'Todos'}
                            {tab === 'published' && 'Publicados'}
                            {tab === 'draft' && 'Rascunhos'}
                            {tab === 'trash' && 'Lixeira'}
                        </button>
                    ))}
                </div>

                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="p-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-sm outline-none focus:ring-2 focus:ring-bible-gold"
                >
                    <option value="all">Todas as Categorias</option>
                    {buildCategoryTree(categories).map(({ category, level }) => (
                        <option key={category.id} value={category.id}>
                            {'\u00A0'.repeat(level * 4)}{category.name}
                        </option>
                    ))}
                </select>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar artigos..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 p-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center opacity-50">Carregando...</div>
                ) : filteredPosts.length === 0 ? (
                    <div className="p-12 text-center opacity-50">
                        <p className="mb-4">Nenhum artigo encontrado nesta visualização.</p>
                        {activeTab !== 'trash' && (
                            <Link to="/admin/posts/new" className="text-bible-gold hover:underline">
                                Criar o primeiro artigo
                            </Link>
                        )}
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-stone-50 dark:bg-stone-950/50 border-b border-stone-200 dark:border-stone-800">
                            <tr>
                                <th className="p-4 font-medium opacity-70">Título</th>
                                <th className="p-4 font-medium opacity-70">Categoria</th>
                                <th className="p-4 font-medium opacity-70">Data</th>
                                <th className="p-4 font-medium opacity-70">Status</th>
                                <th className="p-4 font-medium opacity-70 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPosts.map(post => (
                                <tr key={post.slug} className="border-b border-stone-100 dark:border-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                                    <td className="p-4 font-medium">
                                        {post.title}
                                        {activeTab === 'trash' && <span className="ml-2 text-xs text-red-500 font-normal">(Na lixeira)</span>}
                                    </td>
                                    <td className="p-4 opacity-80">
                                        <span className="px-2 py-1 bg-stone-100 dark:bg-stone-800 rounded text-xs uppercase tracking-wider">
                                            {getCategoryName(post.category, categories)}
                                        </span>
                                    </td>
                                    <td className="p-4 opacity-60 text-sm">
                                        {new Date(post.date).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${post.status === 'published' ? 'bg-green-100 text-green-800' :
                                            post.status === 'trash' ? 'bg-red-100 text-red-800' :
                                                'bg-stone-200 text-stone-600'
                                            }`}>
                                            {post.status === 'published' ? 'Publicado' : post.status === 'trash' ? 'Lixeira' : 'Rascunho'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {activeTab === 'trash' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleRestore(post.slug)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Restaurar"
                                                    >
                                                        Restaurar
                                                    </button>
                                                    <button
                                                        onClick={() => handlePermanentDelete(post.slug)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Excluir Permanentemente"
                                                    >
                                                        Excluir
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            const cat = categories.find(c => c.id === post.category);
                                                            const catSlug = cat ? cat.slug : 'blog';
                                                            window.open(`/${catSlug}/${post.slug}`, '_blank');
                                                        }}
                                                        className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors"
                                                        title="Visualizar"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <Link
                                                        to={`/admin/posts/edit/${post.slug}`}
                                                        className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors text-stone-600 dark:text-stone-300"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={18} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(post.slug)}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        title="Mover para lixeira"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default BlogManager;
