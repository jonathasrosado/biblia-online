import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { getCategories, getCategoryName, Category } from '../components/admin/BlogManager';

interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt?: string;
    image?: string;
    date: string;
    author?: string;
    category?: string;
}

const CategoryPage: React.FC = () => {
    const navigate = useNavigate();
    const { category: categorySlug } = useParams<{ category: string }>();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryName, setCategoryName] = useState('');

    useEffect(() => {
        fetchData();
    }, [categorySlug]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [postsRes, catsData] = await Promise.all([
                fetch('/api/blog/posts?status=published'),
                getCategories()
            ]);

            if (postsRes.ok) {
                const allPosts: BlogPost[] = await postsRes.json();

                // Find category ID from slug
                const currentCategory = catsData.find(c => c.slug === categorySlug || c.id === categorySlug);

                if (currentCategory) {
                    setCategoryName(currentCategory.name);
                    const filtered = allPosts.filter(post => post.category === currentCategory.id);
                    setPosts(filtered);
                } else {
                    // Fallback if category not found (maybe show all or 404)
                    setCategoryName(categorySlug || 'Categoria');
                    setPosts([]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="mb-8">
                <button
                    onClick={() => navigate('/blog')}
                    className="flex items-center gap-2 text-stone-500 hover:text-bible-gold transition-colors mb-4"
                >
                    <ArrowLeft size={20} /> Voltar para o Blog
                </button>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-bible-accent dark:text-bible-gold">
                    {categoryName}
                </h1>
                <p className="text-lg text-stone-600 dark:text-stone-400 mt-2">
                    Artigos e estudos sobre {categoryName}
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-bible-gold border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-20 bg-stone-100 dark:bg-stone-900 rounded-xl">
                    <p className="text-stone-500">Nenhum artigo encontrado nesta categoria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            onClick={() => navigate(`/${categorySlug}/${post.slug}`)}
                            className="group cursor-pointer bg-white dark:bg-stone-900 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-200 dark:border-stone-800 flex flex-col h-full"
                        >
                            {/* Image */}
                            <div className="h-48 overflow-hidden bg-stone-200 dark:bg-stone-800 relative">
                                {post.image ? (
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                                        <span className="text-4xl font-serif opacity-20">✝</span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400 mb-3">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        {new Date(post.date).toLocaleDateString('pt-BR')}
                                    </div>
                                    {post.author && (
                                        <div className="flex items-center gap-1">
                                            <User size={14} />
                                            {post.author}
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-3 line-clamp-2 group-hover:text-bible-gold transition-colors">
                                    {post.title}
                                </h3>

                                <p className="text-stone-600 dark:text-stone-400 text-sm line-clamp-3 mb-4 flex-1">
                                    {post.excerpt || "Leia este artigo completo..."}
                                </p>

                                <div className="flex items-center text-bible-gold font-bold text-sm group-hover:translate-x-1 transition-transform">
                                    Ler artigo <ArrowRight size={16} className="ml-1" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CategoryPage;
