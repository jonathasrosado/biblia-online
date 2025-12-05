import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, User, ArrowRight } from 'lucide-react';

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

interface Category {
    id: string;
    name: string;
    slug: string;
}

const BlogPage: React.FC = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchParams] = useSearchParams();
    const categoryFilter = searchParams.get('category');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [postsRes, catsRes] = await Promise.all([
                    fetch('/api/blog/posts?status=published'),
                    fetch('/api/categories')
                ]);

                if (postsRes.ok) {
                    const data = await postsRes.json();
                    setPosts(data);
                }
                if (catsRes.ok) {
                    const catsData = await catsRes.json();
                    setCategories(catsData);
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const getCategoryName = (catId: string | undefined) => {
        if (!catId) return '';
        const cat = categories.find(c => c.id === catId || c.slug === catId);
        return cat ? cat.name : '';
    };

    const filteredPosts = categoryFilter
        ? posts.filter(post => {
            const catName = getCategoryName(post.category);
            // Filter by ID or Slug or Name match
            return post.category === categoryFilter ||
                (catName && catName.toLowerCase() === categoryFilter.toLowerCase());
        })
        : posts;

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-bible-accent dark:text-bible-gold mb-4">
                    Blog & Reflexões
                </h1>
                <p className="text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto mb-8">
                    Aprofunde seu conhecimento bíblico com nossos artigos, estudos e devocionais diários.
                </p>

                {/* Categories Filter */}
                {!loading && categories.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
                        <button
                            onClick={() => navigate('/blog')}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${!categoryFilter
                                    ? 'bg-bible-gold text-white shadow-md'
                                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                                }`}
                        >
                            Todos
                        </button>
                        {categories.map(cat => {
                            const isActive = categoryFilter === cat.id || categoryFilter === cat.slug;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => navigate(`/blog?category=${cat.slug}`)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${isActive
                                            ? 'bg-bible-gold text-white shadow-md'
                                            : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-bible-gold border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPosts.map((post) => (
                        <div
                            key={post.id}
                            onClick={() => navigate(`/blog/${post.slug}`)}
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
                                {(() => {
                                    const catName = getCategoryName(post.category);
                                    return catName ? (
                                        <span className="absolute top-4 left-4 px-3 py-1 bg-bible-gold text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-sm">
                                            {catName}
                                        </span>
                                    ) : null;
                                })()}
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
                                    {post.excerpt || "Leia este artigo completo para descobrir mais sobre este tema bíblico edificante..."}
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

export default BlogPage;
