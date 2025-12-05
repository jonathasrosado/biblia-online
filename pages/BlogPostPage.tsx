import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Share2, Clock } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface BlogPost {
    id: string;
    slug: string;
    title: string;
    content: string;
    image?: string;
    date: string;
    author?: string;
    category?: string;
    status?: 'published' | 'draft' | 'trash';
    seoTitle?: string;
    metaDescription?: string;
}

interface Category {
    id: string;
    name: string;
    slug: string;
}

const BlogPostPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) fetchPost();
        fetchCategories();
    }, [slug]);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            if (res.ok) setCategories(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchPost = async () => {
        try {
            const res = await fetch(`/api/blog/posts/${slug}`);
            if (res.ok) {
                const data = await res.json();
                setPost(data);

                // Canonical URL Check
                const currentCategoryParam = window.location.pathname.split('/')[1]; // Get first segment

                // We need to wait for categories to be loaded to get the slug from the ID
                // But we can do a rough check or wait. 
                // Better approach: Do this check in a useEffect that depends on post and categories.
            } else {
                // Handle 404
                navigate('/blog');
            }
        } catch (error) {
            console.error("Failed to fetch post", error);
        } finally {
            setLoading(false);
        }
    };

    // Canonical Redirect Logic
    useEffect(() => {
        if (post && categories.length > 0) {
            const categoryObj = categories.find(c => c.id === post.category);
            const correctCategorySlug = categoryObj ? categoryObj.slug : 'blog';
            const currentPathCategory = window.location.pathname.split('/')[1];

            // If current path category doesn't match the correct one
            if (currentPathCategory !== correctCategorySlug) {
                // Prevent infinite loop if something is wrong, but basic logic:
                // If I am at /blog/slug and should be at /teologia/slug -> Redirect
                // If I am at /wrong/slug -> Redirect
                console.log(`Redirecting from ${currentPathCategory} to ${correctCategorySlug}`);
                navigate(`/${correctCategorySlug}/${post.slug}`, { replace: true });
            }
        }
    }, [post, categories, navigate]);

    if (loading) {
        return (
            <div className="flex justify-center py-20 min-h-screen">
                <div className="w-10 h-10 border-4 border-bible-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!post) return null;

    const isPreview = searchParams.get('preview') === 'true';
    if (post.status === 'draft' && !isPreview) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-400">
                <h1 className="text-2xl font-bold mb-2">Post não disponível</h1>
                <p>Este post está em rascunho ou não existe.</p>
                <button onClick={() => navigate('/blog')} className="mt-4 text-bible-gold hover:underline">Voltar ao Blog</button>
            </div>
        );
    }

    const categoryName = categories.find(c => c.id === post.category)?.name || post.category;

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-20">
            <Helmet>
                <title>{post.seoTitle || post.title} | Bíblia Online</title>
                <meta name="description" content={post.metaDescription || post.content.substring(0, 160).replace(/<[^>]*>/g, '')} />
                <link rel="canonical" href={`${window.location.origin}/${categories.find(c => c.id === post.category)?.slug || 'blog'}/${post.slug}`} />
            </Helmet>
            {/* Hero / Header Image */}
            <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden">
                {post.image ? (
                    <>
                        <div className="absolute inset-0 bg-black/40 z-10" />
                        <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                    </>
                ) : (
                    <div className="w-full h-full bg-stone-900 flex items-center justify-center">
                        <span className="text-6xl opacity-10 text-white font-serif">✝</span>
                    </div>
                )}

                <div className="absolute inset-0 z-20 flex flex-col justify-end pb-16 px-4">
                    <div className="max-w-4xl mx-auto w-full text-white">
                        <button
                            onClick={() => navigate('/blog')}
                            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors text-sm font-bold uppercase tracking-wider"
                        >
                            <ArrowLeft size={16} /> Voltar para o Blog
                        </button>

                        {post.category && (
                            <span className="inline-block px-3 py-1 bg-bible-gold text-white text-xs font-bold rounded-full uppercase tracking-wider mb-4">
                                {categoryName}
                            </span>
                        )}

                        <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight mb-6 shadow-black drop-shadow-lg">
                            {post.title}
                        </h1>

                        <div className="flex items-center gap-6 text-sm text-white/90 font-medium">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                {new Date(post.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                            {post.author && (
                                <div className="flex items-center gap-2">
                                    <User size={16} />
                                    {post.author}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Clock size={16} />
                                {Math.ceil(post.content.length / 1000)} min de leitura
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <article className="max-w-3xl mx-auto px-4 -mt-10 relative z-30">
                <div className="bg-white dark:bg-stone-900 p-8 md:p-12 rounded-xl shadow-xl border border-stone-200 dark:border-stone-800">
                    <div
                        className="prose dark:prose-invert max-w-none prose-lg prose-stone prose-headings:font-serif prose-headings:font-bold prose-p:leading-relaxed prose-img:rounded-xl prose-img:shadow-lg"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    <div className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-800 flex justify-between items-center">
                        <div className="text-stone-500 dark:text-stone-400 text-sm">
                            Compartilhe esta mensagem:
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors">
                                <Share2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        </div>
    );
};

export default BlogPostPage;
