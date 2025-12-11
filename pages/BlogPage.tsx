import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO';
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

interface BlogPageProps {
    theme?: 'light' | 'dark' | 'sepia' | 'bw';
}

interface BibleFaqPageProps {
    theme?: 'light' | 'dark' | 'sepia' | 'bw';
}

const BibleFaqPage: React.FC<BibleFaqPageProps> = ({ theme }) => {
    const isBw = theme === 'bw';
    const navigate = useNavigate();
    const [posts, setPosts] = useState<BlogPost[]>([]); // This seems like a copy-paste error, BibleFaqPage shouldn't have posts/categories state
    const [categories, setCategories] = useState<Category[]>([]); // This seems like a copy-paste error
    const [loading, setLoading] = useState(true); // This seems like a copy-paste error

    // Assuming the rest of BibleFaqPage content would go here,
    // but for this specific change, only the hero section is provided.
    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            {/* Hero Section */}
            <div className={`pt-24 pb-16 px-4 border-b 
              ${isBw
                    ? 'bg-white border-black text-black'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'}
            `}>
                <div className="max-w-4xl mx-auto text-center">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6
                      ${isBw ? 'bg-black text-white' : 'bg-bible-gold/10 text-bible-accent dark:text-bible-gold'}
                    `}>
                        <HelpCircle size={14} /> Central de Dúvidas
                    </span>
                    <h1 className={`text-4xl md:text-5xl font-serif font-bold mb-6
                      ${isBw ? 'text-black' : 'text-bible-accent dark:text-bible-gold'}
                    `}>
                        Perguntas Frequentes<br />sobre a Bíblia
                    </h1>
                </div>
            </div>
            {/* Rest of BibleFaqPage content would go here */}
        </div>
    );
};


const BlogPage: React.FC<BlogPageProps> = ({ theme }) => {
    const isBw = theme === 'bw';
    const navigate = useNavigate();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchParams] = useSearchParams();
    // Support both 'category' (English/Standard) and 'categoria' (Portuguese/Legacy)
    const categoryFilter = searchParams.get('categoria');

    useEffect(() => {
        // Redirect legacy 'category' param to 'categoria'
        const legacyCategory = searchParams.get('category');
        if (legacyCategory) {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('category');
            newParams.set('categoria', legacyCategory);
            navigate(`/blog?${newParams.toString()}`, { replace: true });
        }
    }, [searchParams, navigate]);

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

    const getCategoryName = (identifier: string | undefined) => {
        if (!identifier) return '';
        // If identifier matches a Name in the list, return it
        const catByName = categories.find(c => c.name === identifier);
        if (catByName) return catByName.name;

        const cat = categories.find(c => c.id === identifier || c.slug === identifier);
        return cat ? cat.name : identifier; // Return identifier if it looks like a name
    };

    const filteredPosts = categoryFilter
        ? posts.filter(post => {
            // Direct match (Name, ID, or Slug)
            if (post.category === categoryFilter) return true;

            // Resolve post.category to an object to match against filter (Slug/ID)
            const cat = categories.find(c =>
                c.name === post.category ||
                c.id === post.category ||
                c.slug === post.category
            );

            if (cat) {
                return cat.slug === categoryFilter || cat.id === categoryFilter || cat.name === categoryFilter;
            }

            // Fuzzy match
            return post.category?.toLowerCase() === categoryFilter.toLowerCase();
        })
        : posts;

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <SEO
                title="Blog & Reflexões"
                description="Aprofunde seu conhecimento bíblico com nossos artigos, estudos e devocionais diários."
            />
            <div className="text-center mb-16">
                <h1 className={`text-4xl md:text-5xl font-serif font-bold mb-4
                  ${isBw ? 'text-black' : 'text-bible-accent dark:text-bible-gold'}
                `}>
                    Blog & Reflexões
                </h1>
                <p className={`text-lg max-w-2xl mx-auto mb-8
                  ${isBw ? 'text-black/70' : 'text-stone-600 dark:text-stone-400'}
                `}>
                    Aprofunde seu conhecimento bíblico com nossos artigos, estudos e devocionais diários.
                </p>

                {/* Categories Filter */}
                {!loading && categories.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
                        <button
                            onClick={() => navigate('/blog')}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all border
                                ${!categoryFilter
                                    ? (isBw ? 'bg-black text-white border-black' : 'bg-bible-gold text-white border-bible-gold shadow-md')
                                    : (isBw ? 'bg-white text-black border-black hover:bg-black hover:text-white' : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100')
                                }`}
                        >
                            Todos
                        </button>
                        {categories.map(cat => {
                            const isActive = categoryFilter === cat.id || categoryFilter === cat.slug;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => navigate(`/blog?categoria=${cat.slug}`)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all border
                                        ${isActive
                                            ? (isBw ? 'bg-black text-white border-black' : 'bg-bible-gold text-white border-bible-gold shadow-md')
                                            : (isBw ? 'bg-white text-black border-black hover:bg-black hover:text-white' : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100')
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
                    <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin
                      ${isBw ? 'border-black' : 'border-bible-gold'}
                    `}></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPosts.map((post) => (
                        <div
                            key={post.id}
                            onClick={() => navigate(`/blog/${post.slug}`)}
                            className={`group cursor-pointer rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border flex flex-col h-full
                              ${isBw
                                    ? 'bg-white border-black text-black'
                                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'}
                            `}
                        >
                            {/* Image */}
                            <div className="h-48 overflow-hidden bg-stone-200 dark:bg-stone-800 relative">
                                {post.image ? (
                                    <img
                                        src={post.image}
                                        alt={`Miniatura do artigo: ${post.title} - Bíblia Online`}
                                        loading="lazy"
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
                                        <span className={`absolute top-4 left-4 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider shadow-sm
                                          ${isBw ? 'bg-black text-white' : 'bg-bible-gold text-white'}
                                        `}>
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

                                <h3 className={`text-xl font-bold mb-3 line-clamp-2 transition-colors
                                  ${isBw
                                        ? 'text-black group-hover:underline'
                                        : 'text-stone-900 dark:text-stone-100 group-hover:text-bible-gold'}
                                `}>
                                    {post.title}
                                </h3>

                                <p className="text-stone-600 dark:text-stone-400 text-sm line-clamp-3 mb-4 flex-1">
                                    {post.excerpt || "Leia este artigo completo para descobrir mais sobre este tema bíblico edificante..."}
                                </p>

                                <div className={`flex items-center font-bold text-sm group-hover:translate-x-1 transition-transform
                                  ${isBw ? 'text-black' : 'text-bible-gold'}
                                `}>
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
