import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Eye, Calendar, Image as ImageIcon, Sparkles, Wand2, Trash2, Link as LinkIcon, X, Loader2, CornerDownRight } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateBlogPost, generateImage, generateBlogTitle, generateSEOMetadata, generateImagePrompt, rewriteText } from '../../services/geminiService';
import { getCategories, getCategoryName, Category, buildCategoryTree } from './BlogManager';

import MediaManager from './MediaManager';
import RichTextToolbar from './RichTextToolbar';

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

const BlogEditor: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    // Post State
    const [post, setPost] = useState<BlogPost>({
        id: '',
        slug: '',
        title: '',
        content: '',
        date: new Date().toISOString(),
        status: 'draft',
        category: '',
        seoTitle: '',
        metaDescription: ''
    });
    const [originalSlug, setOriginalSlug] = useState('');

    // UI State
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [generationContext, setGenerationContext] = useState('');
    const [generationTone, setGenerationTone] = useState('Inspirador');
    const [imageCount, setImageCount] = useState(1);
    const [imageFormat, setImageFormat] = useState('landscape');
    const [activeFormats, setActiveFormats] = useState<string[]>([]);

    // Detailed Generation State
    const [generatingTitle, setGeneratingTitle] = useState(false);
    const [generatingContent, setGeneratingContent] = useState(false);
    const [generatingImage, setGeneratingImage] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeTab, setActiveTab] = useState<'visual' | 'text'>('visual');
    const visualEditorRef = useRef<HTMLDivElement>(null);

    // Title Selection Modal State
    const [titleOptions, setTitleOptions] = useState<{ title: string, seoTitle: string, metaDescription: string }[]>([]);
    const [showTitleModal, setShowTitleModal] = useState(false);

    // Image Management State
    const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
    const [showImageToolbar, setShowImageToolbar] = useState(false);
    const [imagePrompt, setImagePrompt] = useState('');
    const [imageToolbarPosition, setImageToolbarPosition] = useState({ top: 0, left: 0 });

    // Link Management State
    const [selectedLink, setSelectedLink] = useState<HTMLAnchorElement | null>(null);
    const [showLinkToolbar, setShowLinkToolbar] = useState(false);
    const [linkToolbarPosition, setLinkToolbarPosition] = useState({ top: 0, left: 0 });
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [mediaSelectionContext, setMediaSelectionContext] = useState<'editor' | 'cover'>('editor');

    // Text Selection Toolbar State
    const [showTextToolbar, setShowTextToolbar] = useState(false);
    const [textToolbarPosition, setTextToolbarPosition] = useState({ top: 0, left: 0 });

    const [selectedText, setSelectedText] = useState('');

    const [wordCount, setWordCount] = useState(0);
    const [savedRange, setSavedRange] = useState<Range | null>(null);

    // Rewrite State
    const [showRewriteModal, setShowRewriteModal] = useState(false);
    const [rewritePrompt, setRewritePrompt] = useState('');
    const [textToRewrite, setTextToRewrite] = useState('');

    // Undo/Redo State
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const saveToHistory = (content: string) => {
        // Don't save if same as current
        if (historyIndex >= 0 && history[historyIndex] === content) return;

        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(content);
        if (newHistory.length > 50) newHistory.shift(); // Limit history
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            const content = history[newIndex];
            setHistoryIndex(newIndex);
            setPost(prev => ({ ...prev, content }));
            if (visualEditorRef.current) visualEditorRef.current.innerHTML = content;
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            const content = history[newIndex];
            setHistoryIndex(newIndex);
            setPost(prev => ({ ...prev, content }));
            if (visualEditorRef.current) visualEditorRef.current.innerHTML = content;
        }
    };

    const saveSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            setSavedRange(selection.getRangeAt(0));
        }
    };

    const restoreSelection = () => {
        if (savedRange) {
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(savedRange);
            }
        }
    };

    useEffect(() => {
        if (activeTab === 'visual' && visualEditorRef.current) {
            visualEditorRef.current.innerHTML = post.content;
        }
    }, [activeTab]);

    useEffect(() => {
        loadCategories();
        if (slug && slug !== 'new') {
            fetchPost(slug);
        } else {
            // Reset for new post
            setPost({
                id: '',
                slug: '',
                title: '',
                content: '',
                date: new Date().toISOString(),
                status: 'draft',
                category: '',
                seoTitle: '',
                metaDescription: ''
            });
            setOriginalSlug('');
            setKeyword('');
            if (visualEditorRef.current) visualEditorRef.current.innerHTML = '';
        }
    }, [slug]);

    // Sync content to editor when loading finishes or tab changes
    useEffect(() => {
        if (!loading && activeTab === 'visual' && visualEditorRef.current) {
            if (visualEditorRef.current.innerHTML !== post.content) {
                visualEditorRef.current.innerHTML = post.content;
            }
            // Initialize history if empty
            if (history.length === 0 && post.content) {
                saveToHistory(post.content);
            }
            // Update word count
            setWordCount(countWords(post.content));
        }
    }, [loading, activeTab, post.id]); // Depend on post.id to re-sync on new post load

    const countWords = (html: string) => {
        const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return text ? text.split(/\s+/).length : 0;
    };

    const simulateProgress = () => {
        setGenerationProgress(0);
        const interval = setInterval(() => {
            setGenerationProgress(prev => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                // Slow down as it gets higher
                const increment = prev < 50 ? 5 : prev < 80 ? 2 : 0.5;
                return Math.min(prev + increment, 90);
            });
        }, 500);
        return interval;
    };

    const checkActiveFormats = () => {
        const formats: string[] = [];
        if (document.queryCommandState('bold')) formats.push('bold');
        if (document.queryCommandState('italic')) formats.push('italic');
        if (document.queryCommandState('underline')) formats.push('underline');
        if (document.queryCommandState('strikeThrough')) formats.push('strikeThrough');
        if (document.queryCommandState('justifyLeft')) formats.push('justifyLeft');
        if (document.queryCommandState('justifyCenter')) formats.push('justifyCenter');
        if (document.queryCommandState('justifyRight')) formats.push('justifyRight');

        // Check headings
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            let parent = selection.getRangeAt(0).commonAncestorContainer.parentElement;
            while (parent && parent !== visualEditorRef.current) {
                const tagName = parent.tagName.toLowerCase();
                if (['h1', 'h2', 'h3', 'h4', 'p'].includes(tagName)) {
                    formats.push(tagName);
                    break;
                }
                parent = parent.parentElement;
            }
        }

        setActiveFormats(formats);
    };

    const loadCategories = async () => {
        const cats = await getCategories();
        setCategories(cats);
    };

    const fetchPost = async (postId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/blog/posts/${postId}`);
            if (res.ok) {
                const data = await res.json();
                setPost(data);
                setOriginalSlug(data.slug);
            }
        } catch (error) {
            console.error("Failed to fetch post", error);
        } finally {
            setLoading(false);
        }
    };

    const sanitizeContent = (html: string) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Remove any element that looks like the toolbar
        const toolbars = doc.querySelectorAll('div.absolute.z-50.bg-white');
        toolbars.forEach(el => {
            if (el.textContent?.includes('Editar Imagem') || el.textContent?.includes('Recriar com IA')) {
                el.remove();
            }
        });

        // Also remove specific class if we add it later
        const explicitToolbars = doc.querySelectorAll('.image-toolbar-overlay');
        explicitToolbars.forEach(el => el.remove());

        return doc.body.innerHTML;
    };



    const savePost = async (postData: BlogPost, isAutoSave = false) => {
        // If we have an originalSlug, it's an update (PUT), otherwise create (POST)
        const isUpdate = !!originalSlug;
        const method = isUpdate ? 'PUT' : 'POST';
        const url = isUpdate
            ? `/api/blog/posts/${originalSlug}`
            : '/api/blog/posts';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Erro ao salvar post');
            }

            const savedPost = await res.json();

            // Update local state with saved data
            setPost(savedPost);
            if (savedPost.slug) setOriginalSlug(savedPost.slug);

            // Update URL without reloading if it's a new post or slug changed
            if (!isUpdate || savedPost.slug !== slug) {
                navigate(`/admin/posts/edit/${savedPost.slug}`, { replace: true });
            }

            if (!isAutoSave) alert('Post salvo com sucesso!');
            console.log('Post saved successfully:', savedPost);

        } catch (error: any) {
            console.error("Failed to save post", error);
            if (!isAutoSave) alert(`Erro ao salvar: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (newStatus?: 'published' | 'draft') => {
        setLoading(true);

        // Ensure slug is valid
        let finalSlug = post.slug;
        if (!finalSlug) {
            finalSlug = post.title.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }

        // Ensure content is synced from visual editor
        let finalContent = post.content;
        if (activeTab === 'visual' && visualEditorRef.current) {
            finalContent = visualEditorRef.current.innerHTML;
        }

        // Sanitize content
        finalContent = sanitizeContent(finalContent);

        const statusToUse = newStatus || (post.status === 'trash' ? 'draft' : post.status);

        const postData = {
            ...post,
            slug: finalSlug,
            content: finalContent,
            status: statusToUse,
            date: post.date || new Date().toISOString()
        };

        await savePost(postData);
    };

    const handleGenerateTitle = async () => {
        if (!keyword) return;
        setGeneratingTitle(true);
        try {
            const results = await generateBlogTitle(keyword);
            console.log("Title generation results:", results);
            if (results && results.length > 0) {
                setTitleOptions(results);
                setShowTitleModal(true);
            } else {
                alert('Nenhum título foi gerado. Tente uma palavra-chave diferente.');
            }
        } catch (error) {
            console.error("Failed to generate title", error);
            alert('Erro ao gerar título. Verifique o console.');
        } finally {
            setGeneratingTitle(false);
        }
    };

    const selectTitleOption = (option: { title: string, seoTitle: string, metaDescription: string }) => {
        const slug = option.title.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        setPost(prev => ({
            ...prev,
            title: option.title,
            seoTitle: option.seoTitle,
            metaDescription: option.metaDescription,
            slug
        }));
        setShowTitleModal(false);
        // User must manually click "Generate Content" now
    };

    const handleGenerateContent = async (titleOverride?: string) => {
        const titleToUse = typeof titleOverride === 'string' ? titleOverride : post.title;
        console.log("handleGenerateContent called. Title:", titleToUse);

        if (!titleToUse) return alert('O post precisa de um título.');

        setGeneratingContent(true);
        const interval = simulateProgress();

        try {
            const categoryName = post.category ? getCategoryName(post.category, categories) : 'Geral';

            let fullContext = `Category: ${categoryName}.`;
            if (keyword) fullContext += ` Keyword: ${keyword}.`;
            if (generationContext) fullContext += ` Briefing/Context: ${generationContext}.`;
            if (generationTone) fullContext += ` Tone of Voice: ${generationTone}.`;
            fullContext += ` Number of Images to Generate: ${imageCount}. Image Format: ${imageFormat}.`;

            console.log("Generating content with context:", fullContext);

            const content = await generateBlogPost(titleToUse, fullContext);

            setGenerationProgress(100);

            if (!content) throw new Error("Conteúdo gerado vazio.");

            setTimeout(async () => {
                const newContent = content;
                setPost(prev => ({ ...prev, content: newContent }));
                if (visualEditorRef.current) visualEditorRef.current.innerHTML = newContent;
                setGeneratingContent(false);

                // Auto-Save Logic
                const autoSaveData = {
                    ...post,
                    content: newContent,
                    status: post.status === 'trash' ? 'draft' : post.status || 'draft',
                    slug: post.slug || post.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
                };
                await savePost(autoSaveData, true); // true = isAutoSave (no alert)

            }, 500); // Small delay to show 100%

        } catch (error) {
            console.error("Failed to generate content", error);
            alert(`Erro ao gerar conteúdo: ${error.message || 'Erro desconhecido'}`);
            setGeneratingContent(false);
        } finally {
            clearInterval(interval);
        }
    };


    const handleGenerateImage = async () => {
        if (!post.title) return alert('O post precisa de um título.');
        setGeneratingImage(true);
        try {
            // 1. Generate Enriched Prompt
            const enrichedPrompt = await generateImagePrompt(post.title);
            console.log("Enriched Image Prompt:", enrichedPrompt);

            // 2. Generate Image (Try Freepik -> Fallback Pollinations)
            // Pass post.title as customFilename (slugified by backend)
            let width = 1280;
            let height = 720;

            if (imageFormat === 'portrait') {
                width = 720;
                height = 1280;
            } else if (imageFormat === 'square') {
                width = 1024;
                height = 1024;
            }

            const image = await generateImage(enrichedPrompt, { width, height }, post.title);

            if (image) {
                setPost(prev => ({ ...prev, image }));
            }
        } catch (error) {
            console.error("Failed to generate image", error);
            alert('Erro ao gerar imagem. Tente novamente.');
        } finally {
            setGeneratingImage(false);
        }
    };

    const handleRewrite = async () => {
        if (!textToRewrite || !rewritePrompt) return;

        // Close modal immediately
        setShowRewriteModal(false);
        setRewritePrompt('');

        // Insert loading placeholder
        const placeholderId = `rewrite-${Date.now()}`;
        execCmd('insertHTML', `<span id="${placeholderId}" class="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1 rounded animate-pulse">✨ Reescrevendo...</span>`);

        // Don't block UI with global generating state for this
        // setGenerating(true); 

        try {
            const rewritten = await rewriteText(textToRewrite, rewritePrompt);

            // Find placeholder and replace
            const placeholder = visualEditorRef.current?.querySelector(`#${placeholderId}`);
            if (placeholder) {
                if (rewritten) {
                    // Replace with new text
                    const span = document.createElement('span');
                    span.innerHTML = rewritten; // Use innerHTML to handle potential HTML in response? Or textContent?
                    // Usually rewrite returns text, but let's be safe. 
                    // Actually, let's just insert the text node to avoid XSS if we don't trust the output, 
                    // but we trust our AI.
                    placeholder.replaceWith(document.createTextNode(rewritten));
                } else {
                    // Revert if null
                    placeholder.replaceWith(document.createTextNode(textToRewrite));
                    alert('Não foi possível reescrever o texto.');
                }

                // Update state
                if (visualEditorRef.current) setPost(prev => ({ ...prev, content: visualEditorRef.current!.innerHTML }));
            }
        } catch (e) {
            console.error(e);
            // Revert on error
            const placeholder = visualEditorRef.current?.querySelector(`#${placeholderId}`);
            if (placeholder) {
                placeholder.replaceWith(document.createTextNode(textToRewrite));
            }
            alert('Erro ao reescrever texto.');
        } finally {
            // setGenerating(false);
        }
    };

    const openRewriteModal = () => {
        if (selectedText) {
            setTextToRewrite(selectedText);
            setShowRewriteModal(true);
            setShowTextToolbar(false);
        }
    };

    const handleGenerateSEO = async () => {
        if (!post.content && !post.title) return alert('É necessário ter conteúdo ou título para gerar SEO.');
        setGenerating(true);
        try {
            const result = await generateSEOMetadata(post.content || post.title, keyword);
            if (result) {
                setPost(prev => ({
                    ...prev,
                    seoTitle: result.seoTitle,
                    metaDescription: result.metaDescription
                }));
            }
        } catch (error) {
            console.error("Failed to generate SEO", error);
            alert('Erro ao gerar SEO.');
        } finally {
            setGenerating(false);
        }
    };

    // Editor Toolbar Actions
    const execCmd = (command: string, value: string | undefined = undefined) => {
        if (command === 'image') {
            insertImage();
            return;
        }

        if (command === 'link') {
            const url = prompt('URL do link:');
            if (url) {
                document.execCommand('createLink', false, url);
                if (visualEditorRef.current) {
                    const newContent = visualEditorRef.current.innerHTML;
                    setPost(prev => ({ ...prev, content: newContent }));
                    setWordCount(countWords(newContent));
                }
            }
            return;
        }

        document.execCommand(command, false, value);
        if (visualEditorRef.current) {
            const newContent = visualEditorRef.current.innerHTML;
            setPost(prev => ({ ...prev, content: newContent }));
            setWordCount(countWords(newContent));
        }
        checkActiveFormats();
    };

    // Image Management Functions
    const handleEditorClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;

        // Handle Image Click
        if (target.tagName === 'IMG') {
            const img = target as HTMLImageElement;
            setSelectedImage(img);

            // Calculate position for toolbar
            const rect = img.getBoundingClientRect();
            const editorRect = visualEditorRef.current?.getBoundingClientRect();

            if (editorRect) {
                setImageToolbarPosition({
                    top: rect.top - editorRect.top - 60, // Position above image
                    left: rect.left - editorRect.left
                });
                setShowImageToolbar(true);
                setShowLinkToolbar(false);
            }
            return;
        }

        // Handle Link Click
        const link = target.closest('a');
        if (link) {
            e.preventDefault(); // Prevent navigation
            setSelectedLink(link as HTMLAnchorElement);
            const rect = link.getBoundingClientRect();
            const editorRect = visualEditorRef.current?.getBoundingClientRect();

            if (editorRect) {
                setLinkToolbarPosition({
                    top: rect.bottom - editorRect.top + 10, // Position below link
                    left: rect.left - editorRect.left
                });
                setShowLinkToolbar(true);
                setShowImageToolbar(false);
            }
            return;
        }

        // Clicked elsewhere, deselect
        if (selectedImage && !showImageToolbar) {
            setSelectedImage(null);
            setShowImageToolbar(false);
        }
        if (selectedLink && !showLinkToolbar) {
            setSelectedLink(null);
            setShowLinkToolbar(false);
        }
    };

    const updateLink = (url: string) => {
        if (selectedLink) {
            selectedLink.href = url;
            if (visualEditorRef.current) {
                setPost(prev => ({ ...prev, content: visualEditorRef.current!.innerHTML }));
            }
            setShowLinkToolbar(false);
        }
    };

    const removeLink = () => {
        if (selectedLink) {
            const text = selectedLink.innerText;
            const textNode = document.createTextNode(text);
            selectedLink.parentNode?.replaceChild(textNode, selectedLink);
            if (visualEditorRef.current) {
                setPost(prev => ({ ...prev, content: visualEditorRef.current!.innerHTML }));
            }
            setShowLinkToolbar(false);
            setSelectedLink(null);
        }
    };

    const updateImage = (updates: { width?: string, src?: string }) => {
        if (selectedImage) {
            if (updates.width) selectedImage.style.width = updates.width;
            if (updates.src) selectedImage.src = updates.src;

            // Trigger content update
            if (visualEditorRef.current) {
                setPost(prev => ({ ...prev, content: visualEditorRef.current!.innerHTML }));
            }
            // Keep toolbar visible but maybe update position?
        }
    };

    const handleRegenerateSelectedImage = async () => {
        if (!selectedImage || !imagePrompt) return;
        setGenerating(true);

        // Visual feedback on the image
        const originalOpacity = selectedImage.style.opacity;
        const originalFilter = selectedImage.style.filter;

        selectedImage.style.opacity = '0.5';
        selectedImage.style.filter = 'blur(2px) grayscale(100%)';
        selectedImage.style.transition = 'all 0.3s ease';

        // Add a temporary loading overlay if possible, or just rely on the style change
        // Since we can't easily append to the image parent without messing up the editor, 
        // we'll stick to the style change which is very noticeable.

        try {
            // Enhance prompt with context
            const contextPrompt = `${imagePrompt}. Context: ${post.title} (${categorySlug}). Biblical art style, cinematic lighting, photorealistic, 8k. NO TEXT.`;
            const newUrl = await generateImage(contextPrompt);
            if (newUrl) {
                updateImage({ src: newUrl });
                setImagePrompt('');
                // alert('Imagem recriada com sucesso!'); // Removed alert to be less intrusive
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao recriar imagem.');
        } finally {
            setGenerating(false);
            // Restore styles (updateImage might have replaced the src, but the element ref is the same)
            // If the src changed, the load event will clear this, but we should reset just in case
            if (selectedImage) {
                selectedImage.style.opacity = '1';
                selectedImage.style.filter = 'none';
            }
        }
    };

    const handleTextToImage = async () => {
        if (!selectedText) return;
        setGenerating(true);
        setShowTextToolbar(false); // Hide toolbar during generation

        try {
            // Create a loading placeholder
            const placeholderId = `loading-${Date.now()}`;

            // Collapse selection to end so we don't overwrite the text
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                selection.collapseToEnd();
            }

            document.execCommand('insertHTML', false, `<br><div id="${placeholderId}" class="my-4 p-4 bg-stone-100 dark:bg-stone-800 rounded-lg text-center animate-pulse text-stone-500 text-sm">✨ Criando imagem baseada em: "${selectedText.substring(0, 30)}..."</div><br>`);

            const contextPrompt = `"${selectedText}". Context: ${post.title} (${categorySlug}). Biblical art style, cinematic lighting, photorealistic, 8k. NO TEXT.`;
            const newUrl = await generateImage(contextPrompt);

            if (newUrl) {
                // Replace placeholder with image
                const placeholder = visualEditorRef.current?.querySelector(`#${placeholderId}`);
                if (placeholder) {
                    const img = document.createElement('img');
                    img.src = newUrl;
                    img.className = "rounded-xl shadow-lg my-4 w-full";
                    img.style.width = "100%"; // Default to full width
                    placeholder.replaceWith(img);

                    // Update state
                    if (visualEditorRef.current) {
                        setPost(prev => ({ ...prev, content: visualEditorRef.current!.innerHTML }));
                    }
                }
            } else {
                // Remove placeholder if failed
                visualEditorRef.current?.querySelector(`#${placeholderId}`)?.remove();
                alert('Falha ao gerar imagem.');
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao gerar imagem.');
        } finally {
            setGenerating(false);
        }
    };

    const handleSelectionChange = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            setShowTextToolbar(false);
            return;
        }

        const range = selection.getRangeAt(0);
        const editor = visualEditorRef.current;

        // Ensure selection is inside editor
        if (editor && editor.contains(range.commonAncestorContainer)) {
            const rect = range.getBoundingClientRect();
            const editorRect = editor.getBoundingClientRect();

            // Only show if selection is not empty text
            const text = selection.toString().trim();
            if (text.length > 0) {
                setSelectedText(text);
                setTextToolbarPosition({
                    top: rect.top - editorRect.top - 50, // Position above selection
                    left: rect.left - editorRect.left + (rect.width / 2) - 100 // Center horizontally (assuming 200px width)
                });
                setShowTextToolbar(true);
            } else {
                setShowTextToolbar(false);
            }
        } else {
            setShowTextToolbar(false);
        }
    };

    // Attach selection listener
    useEffect(() => {
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, []);

    const insertImage = () => {
        saveSelection();
        setMediaSelectionContext('editor');
        setShowMediaModal(true);
    };

    const selectCoverImage = () => {
        setMediaSelectionContext('cover');
        setShowMediaModal(true);
    };

    const handleMediaSelect = (url: string) => {
        if (mediaSelectionContext === 'cover') {
            setPost(prev => ({ ...prev, image: url }));
        } else {
            restoreSelection();
            execCmd('insertImage', url);
        }
        setShowMediaModal(false);
    };

    // Auto-upload pasted images
    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault();
                const file = items[i].getAsFile();
                if (file) {
                    // Show loading placeholder
                    const placeholderId = `uploading-${Date.now()}`;
                    execCmd('insertHTML', `<div id="${placeholderId}" class="inline-block p-2 bg-stone-100 rounded text-xs text-stone-500 animate-pulse">Uploading image...</div>`);

                    const formData = new FormData();
                    formData.append('file', file);

                    try {
                        const res = await fetch('/api/media/upload', {
                            method: 'POST',
                            body: formData
                        });
                        if (res.ok) {
                            const data = await res.json();
                            // Replace placeholder
                            const placeholder = visualEditorRef.current?.querySelector(`#${placeholderId}`);
                            if (placeholder) {
                                const img = document.createElement('img');
                                img.src = data.url;
                                img.className = "rounded-xl shadow-lg my-4 w-full";
                                placeholder.replaceWith(img);
                                if (visualEditorRef.current) setPost(prev => ({ ...prev, content: visualEditorRef.current!.innerHTML }));
                            }
                        }
                    } catch (err) {
                        console.error("Paste upload failed", err);
                        visualEditorRef.current?.querySelector(`#${placeholderId}`)?.remove();
                    }
                }
            }
        }
    };

    // Auto-upload cover image URL
    const handleCoverUrlChange = async (url: string) => {
        // Update local state immediately
        setPost(prev => ({ ...prev, image: url }));

        // If it's an external URL (http/https) and not from our own uploads
        if (url.startsWith('http') && !url.includes('/uploads/')) {
            try {
                const res = await fetch('/api/media/upload-url', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                if (res.ok) {
                    const data = await res.json();
                    // Update with local URL
                    setPost(prev => ({ ...prev, image: data.url }));
                }
            } catch (err) {
                console.error("Auto-upload cover failed", err);
                // Keep original URL if upload fails
            }
        }
    };

    const selectedCategory = categories.find(c => c.id === post.category);
    const categorySlug = selectedCategory ? selectedCategory.slug : '';

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 p-6 font-sans text-stone-800 dark:text-stone-200">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/admin/posts')} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition-colors">
                            <ArrowLeft size={24} className="text-stone-600 dark:text-stone-400" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-serif font-bold text-stone-800 dark:text-stone-100">
                                {post.id ? 'Editar Post' : 'Novo Post'}
                            </h1>
                            <p className="text-sm text-stone-500 dark:text-stone-400">
                                {post.id ? 'Atualize o conteúdo do seu artigo' : 'Crie um novo artigo para o blog'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {post.slug && (
                            <a
                                href={`${categorySlug ? '/' + categorySlug : ''}/${post.slug}${post.status === 'draft' ? '?preview=true' : ''}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
                            >
                                <Eye size={18} /> Ver
                            </a>
                        )}
                        {post.status === 'published' ? (
                            <>
                                <button
                                    onClick={() => handleSave('draft')}
                                    disabled={loading}
                                    className="px-4 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors text-sm font-medium"
                                >
                                    Reverter para Rascunho
                                </button>
                                <button
                                    onClick={() => handleSave('published')}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-2 bg-bible-gold text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 shadow-sm font-bold"
                                >
                                    <Save size={18} />
                                    {loading ? 'Salvando...' : 'Atualizar Post'}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleSave('draft')}
                                    disabled={loading}
                                    className="px-4 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors text-sm font-medium"
                                >
                                    Salvar Rascunho
                                </button>
                                <button
                                    onClick={() => handleSave('published')}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm font-bold"
                                >
                                    <Save size={18} />
                                    {loading ? 'Publicando...' : 'Publicar'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Media Manager Modal */}
            {showMediaModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-950">
                            <h3 className="text-lg font-bold font-serif">Selecionar Mídia</h3>
                            <button onClick={() => setShowMediaModal(false)} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <MediaManager onSelect={(url) => {
                                // Check if we are selecting a cover image or inserting into editor
                                // For now, let's assume if the modal was opened via "Add Mídia" button in toolbar, it inserts.
                                // But we need a way to select cover image.
                                // We'll add a state to track the context of media selection if needed.
                                // But for now, let's just use handleMediaSelect which inserts.
                                // Wait, the user wants to select cover image.
                                // I should add a "Select Cover" button that sets a flag.
                                handleMediaSelect(url);
                            }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Rewrite Modal */}
            {showRewriteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Sparkles className="text-purple-500" /> Reescrever Texto
                        </h3>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-stone-500 mb-1">Texto Original</label>
                            <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-lg text-sm italic text-stone-600 dark:text-stone-400 max-h-32 overflow-y-auto">
                                "{textToRewrite}"
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-stone-500 mb-1">Instrução (Prompt)</label>
                            <input
                                type="text"
                                value={rewritePrompt}
                                onChange={(e) => setRewritePrompt(e.target.value)}
                                placeholder="Ex: Deixe mais formal, Resuma, Corrija a gramática..."
                                className="w-full p-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 outline-none focus:ring-2 focus:ring-purple-500"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowRewriteModal(false)}
                                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleRewrite}
                                disabled={generating || !rewritePrompt}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
                            >
                                {generating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                Reescrever
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Editor Area */}
                <div className="lg:col-span-2 space-y-6">

                    {/* AI Assistant Panel */}


                    {/* Title Input */}
                    <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
                        <input
                            type="text"
                            value={post.title}
                            onChange={(e) => setPost({ ...post, title: e.target.value })}
                            className="w-full text-3xl font-serif font-bold p-2 border-b-2 border-stone-100 dark:border-stone-800 focus:border-bible-gold bg-transparent outline-none placeholder-stone-300 dark:placeholder-stone-700 transition-colors"
                            placeholder="Título do Post..."
                        />
                        {post.slug && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-stone-500">
                                <LinkIcon size={12} />
                                <span>Permalink:</span>
                                <div className="flex items-center bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded border border-stone-200 dark:border-stone-700">
                                    <span className="text-stone-500 dark:text-stone-500 select-none">{categorySlug ? `/${categorySlug}/` : '/'}</span>
                                    <input
                                        type="text"
                                        value={post.slug || ''}
                                        onChange={(e) => {
                                            const newSlug = e.target.value
                                                .toLowerCase()
                                                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                                                .replace(/\s+/g, '-')
                                                .replace(/[^a-z0-9-]/g, '');
                                            setPost({ ...post, slug: newSlug });
                                        }}
                                        className="bg-transparent outline-none text-stone-600 dark:text-stone-400 font-mono min-w-[200px]"
                                        placeholder="slug-do-post"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rich Text Editor */}
                    <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 flex flex-col min-h-[600px]">
                        {/* Tab Switcher (Moved to Top) */}
                        <div className="border-b border-stone-200 dark:border-stone-800 p-2 bg-stone-50 dark:bg-stone-900 flex justify-end gap-2">
                            <button
                                onClick={() => setActiveTab('visual')}
                                className={`px-3 py-1 rounded text-xs font-bold ${activeTab === 'visual' ? 'bg-stone-200 dark:bg-stone-800' : 'text-stone-500'}`}
                            >
                                Visual
                            </button>
                            <button
                                onClick={() => setActiveTab('text')}
                                className={`px-3 py-1 rounded text-xs font-bold ${activeTab === 'text' ? 'bg-stone-200 dark:bg-stone-800' : 'text-stone-500'}`}
                            >
                                HTML
                            </button>
                        </div>

                        {/* Toolbar */}
                        <RichTextToolbar onFormat={execCmd} activeFormats={activeFormats} />

                        {/* Editor Area */}
                        <div className="flex-1 relative">
                            {activeTab === 'visual' ? (
                                <>
                                    <div
                                        ref={visualEditorRef}
                                        contentEditable
                                        suppressContentEditableWarning={true}
                                        onClick={(e) => {
                                            handleEditorClick(e);
                                            checkActiveFormats();
                                        }}
                                        onKeyDown={(e) => {
                                            // Handle Undo/Redo
                                            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                                                e.preventDefault();
                                                if (e.shiftKey) {
                                                    handleRedo();
                                                } else {
                                                    handleUndo();
                                                }
                                                return;
                                            }
                                            handleSelectionChange();
                                            checkActiveFormats();
                                        }}
                                        onPaste={handlePaste}
                                        onInput={(e) => {
                                            const newContent = e.currentTarget.innerHTML;
                                            setPost({ ...post, content: newContent });
                                            setWordCount(countWords(newContent));
                                            checkActiveFormats();

                                            // Debounce save to history
                                            if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
                                            undoTimeoutRef.current = setTimeout(() => {
                                                saveToHistory(newContent);
                                            }, 1000);
                                        }}
                                        onKeyUp={() => {
                                            handleSelectionChange();
                                            checkActiveFormats();
                                        }}
                                        onMouseUp={() => {
                                            handleSelectionChange();
                                            checkActiveFormats();
                                        }}
                                        className="w-full h-full p-8 outline-none overflow-y-auto prose dark:prose-invert max-w-none prose-lg prose-headings:font-serif prose-p:leading-relaxed prose-img:rounded-xl prose-a:text-bible-gold relative"
                                        style={{ minHeight: '500px' }}
                                    />
                                    <div className="absolute bottom-2 right-4 text-xs text-stone-400 bg-white/80 dark:bg-stone-900/80 px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                                        {wordCount} palavras
                                    </div>

                                    {/* Editor Loading Overlay */}
                                    {generatingContent && (
                                        <div className="absolute inset-0 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 animate-fadeIn">
                                            <div className="w-64 space-y-4 text-center">
                                                <div className="relative w-16 h-16 mx-auto">
                                                    <div className="absolute inset-0 border-4 border-stone-200 dark:border-stone-700 rounded-full"></div>
                                                    <div className="absolute inset-0 border-4 border-bible-gold rounded-full border-t-transparent animate-spin"></div>
                                                    <Sparkles className="absolute inset-0 m-auto text-bible-gold animate-pulse" size={24} />
                                                </div>

                                                <div>
                                                    <h3 className="text-lg font-bold text-stone-800 dark:text-stone-100 mb-1">Escrevendo seu artigo...</h3>
                                                    <p className="text-sm text-stone-500 dark:text-stone-400">A IA está criando um conteúdo único para você.</p>
                                                </div>

                                                <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-bible-gold h-full rounded-full transition-all duration-500 ease-out"
                                                        style={{ width: `${generationProgress}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs font-mono text-stone-400">{generationProgress}% concluído</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Floating Text Selection Toolbar */}
                                    {showTextToolbar && (
                                        <div
                                            className="absolute z-50 bg-stone-900 text-white shadow-xl rounded-full px-3 py-2 flex items-center gap-2 animate-fadeIn image-toolbar-overlay"
                                            style={{ top: textToolbarPosition.top, left: textToolbarPosition.left }}
                                            contentEditable={false}
                                            onMouseDown={(e) => e.preventDefault()} // Prevent losing selection
                                        >
                                            <button onClick={() => execCmd('bold')} className="hover:text-bible-gold p-1"><strong className="font-serif">B</strong></button>
                                            <button onClick={() => execCmd('italic')} className="hover:text-bible-gold p-1"><em className="font-serif">I</em></button>

                                            <div className="w-px h-4 bg-stone-700 mx-1"></div>
                                            <button onClick={() => {
                                                const url = prompt('Link URL:');
                                                if (url) execCmd('createLink', url);
                                            }} className="hover:text-bible-gold p-1" title="Adicionar Link"><LinkIcon size={14} /></button>
                                            <button onClick={() => execCmd('unlink')} className="hover:text-red-400 p-1" title="Remover Link"><LinkIcon size={14} className="line-through" /></button>
                                            <button onClick={() => execCmd('removeFormat')} className="hover:text-red-400 p-1" title="Limpar Formatação"><X size={14} /></button>

                                        </div>
                                    )}
                                    {/* Floating Image Toolbar */}
                                    {showImageToolbar && selectedImage && (
                                        <div
                                            className="absolute z-50 bg-white dark:bg-stone-800 shadow-xl rounded-lg border border-stone-200 dark:border-stone-700 p-2 flex flex-col gap-2 w-72 animate-fadeIn image-toolbar-overlay"
                                            style={{ top: imageToolbarPosition.top, left: imageToolbarPosition.left }}
                                            contentEditable={false} // Prevent editing toolbar itself
                                            onClick={(e) => e.stopPropagation()} // Prevent deselecting
                                        >
                                            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-700 pb-2 mb-1">
                                                <span className="text-xs font-bold text-stone-500">Editar Imagem</span>
                                                <button onClick={() => { setSelectedImage(null); setShowImageToolbar(false); }} className="text-stone-400 hover:text-stone-600"><X size={14} /></button>
                                            </div>

                                            {/* Resize Controls */}
                                            <div className="flex gap-1">
                                                <button onClick={() => updateImage({ width: '25%' })} className="flex-1 text-xs bg-stone-100 dark:bg-stone-700 p-1 rounded hover:bg-stone-200">P</button>
                                                <button onClick={() => updateImage({ width: '50%' })} className="flex-1 text-xs bg-stone-100 dark:bg-stone-700 p-1 rounded hover:bg-stone-200">M</button>
                                                <button onClick={() => updateImage({ width: '75%' })} className="flex-1 text-xs bg-stone-100 dark:bg-stone-700 p-1 rounded hover:bg-stone-200">G</button>
                                                <button onClick={() => updateImage({ width: '100%' })} className="flex-1 text-xs bg-stone-100 dark:bg-stone-700 p-1 rounded hover:bg-stone-200">Cheia</button>
                                            </div>

                                            {/* Replace / Remove */}
                                            <div className="flex gap-2 mt-1">
                                                <button onClick={() => {
                                                    const url = prompt('Nova URL:');
                                                    if (url) updateImage({ src: url });
                                                }} className="flex-1 flex items-center justify-center gap-1 text-xs bg-blue-50 text-blue-600 p-1.5 rounded hover:bg-blue-100">
                                                    <LinkIcon size={12} /> Trocar
                                                </button>
                                                <button onClick={() => {
                                                    selectedImage.remove();
                                                    setSelectedImage(null);
                                                    setShowImageToolbar(false);
                                                    if (visualEditorRef.current) setPost(prev => ({ ...prev, content: visualEditorRef.current!.innerHTML }));
                                                }} className="flex-1 flex items-center justify-center gap-1 text-xs bg-red-50 text-red-600 p-1.5 rounded hover:bg-red-100">
                                                    <Trash2 size={12} /> Remover
                                                </button>
                                            </div>

                                            {/* AI Regenerate */}

                                        </div>
                                    )}
                                    {/* Floating Link Toolbar */}
                                    {showLinkToolbar && selectedLink && (
                                        <div
                                            className="absolute z-50 bg-white dark:bg-stone-800 shadow-xl rounded-lg border border-stone-200 dark:border-stone-700 p-2 flex flex-col gap-2 w-72 animate-fadeIn image-toolbar-overlay"
                                            style={{ top: linkToolbarPosition.top, left: linkToolbarPosition.left }}
                                            contentEditable={false}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-700 pb-2 mb-1">
                                                <span className="text-xs font-bold text-stone-500">Editar Link</span>
                                                <button onClick={() => { setSelectedLink(null); setShowLinkToolbar(false); }} className="text-stone-400 hover:text-stone-600"><X size={14} /></button>
                                            </div>
                                            <div className="p-2 bg-stone-50 dark:bg-stone-900 rounded text-xs text-stone-600 dark:text-stone-400 mb-2 break-all">
                                                {selectedLink.href}
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => {
                                                    const url = prompt('Nova URL:', selectedLink.href);
                                                    if (url) updateLink(url);
                                                }} className="flex-1 flex items-center justify-center gap-1 text-xs bg-blue-50 text-blue-600 p-1.5 rounded hover:bg-blue-100">
                                                    <LinkIcon size={12} /> Editar
                                                </button>
                                                <button onClick={removeLink} className="flex-1 flex items-center justify-center gap-1 text-xs bg-red-50 text-red-600 p-1.5 rounded hover:bg-red-100">
                                                    <LinkIcon size={12} className="line-through" /> Remover
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <textarea
                                    value={post.content}
                                    onChange={(e) => setPost({ ...post, content: e.target.value })}
                                    className="w-full h-full p-4 resize-none outline-none font-mono text-sm bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 border-none"
                                    style={{ minHeight: '500px' }}
                                />
                            )}
                        </div>



                        {/* Loading Overlay */}
                        {generating && (
                            <div className="absolute inset-0 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                <Loader2 size={48} className="text-bible-gold animate-spin mb-4" />
                                <p className="text-stone-600 dark:text-stone-300 font-medium animate-pulse">
                                    Gerando conteúdo com IA...
                                </p>
                            </div>
                        )}
                    </div>

                    {/* AI Assistant Panel (Moved) */}
                    <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
                        <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Wand2 size={16} /> Assistente de IA
                        </h3>

                        <div className="space-y-4">
                            {/* Keyword -> Title */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-stone-500 mb-1">Palavra-chave</label>
                                    <input
                                        type="text"
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        placeholder="Ex: Fé, Amor, Salvação..."
                                        className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-bible-gold outline-none"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={handleGenerateTitle}
                                        disabled={generatingTitle || !keyword}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2 h-[42px] shadow-sm"
                                    >
                                        {generatingTitle ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                        {generatingTitle ? 'Gerando...' : 'Gerar Título'}
                                    </button>
                                </div>
                            </div>

                            <div className="h-px bg-stone-100 dark:bg-stone-800 my-2" />

                            {/* Context & Tone */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-stone-500 mb-1">Briefing / Contexto (Opcional)</label>
                                    <textarea
                                        value={generationContext}
                                        onChange={(e) => setGenerationContext(e.target.value)}
                                        placeholder="Ex: Focar na importância da oração matinal..."
                                        className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-bible-gold outline-none text-sm h-[42px] resize-none leading-tight"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-stone-500 mb-1">Tom de Voz</label>
                                    <select
                                        value={generationTone}
                                        onChange={(e) => setGenerationTone(e.target.value)}
                                        className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-bible-gold outline-none text-sm h-[42px]"
                                    >
                                        <option value="Inspirador">Inspirador</option>
                                        <option value="Teológico">Teológico</option>
                                        <option value="Explicativo">Explicativo</option>
                                        <option value="Devocional">Devocional</option>
                                        <option value="Histórico">Histórico</option>
                                    </select>
                                </div>
                            </div>

                            <div className="h-px bg-stone-100 dark:bg-stone-800 my-2" />

                            {/* Image Options */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-stone-500 mb-1">Qtd. Imagens</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        value={imageCount}
                                        onChange={(e) => setImageCount(parseInt(e.target.value))}
                                        className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-bible-gold outline-none text-sm h-[42px]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-stone-500 mb-1">Formato</label>
                                    <select
                                        value={imageFormat}
                                        onChange={(e) => setImageFormat(e.target.value)}
                                        className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-bible-gold outline-none text-sm h-[42px]"
                                    >
                                        <option value="landscape">Paisagem (16:9)</option>
                                        <option value="portrait">Retrato (9:16)</option>
                                        <option value="square">Quadrado (1:1)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="h-px bg-stone-100 dark:bg-stone-800 my-2" />

                            {/* Content & Image */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleGenerateContent}
                                    disabled={generatingContent || !post.title}
                                    className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium border border-stone-200 dark:border-stone-700"
                                >
                                    {generatingContent ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                                    {generatingContent ? 'Escrevendo...' : 'Escrever Artigo Completo'}
                                </button>

                                <button
                                    onClick={handleGenerateImage}
                                    disabled={generatingImage || !post.title}
                                    className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium border border-stone-200 dark:border-stone-700"
                                >
                                    {generatingImage ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
                                    {generatingImage ? 'Criando...' : 'Gerar Capa'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status & Date */}
                    <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
                        <h3 className="font-bold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
                            <Calendar size={18} /> Publicação
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">Status</label>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${post.status === 'published'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                                        }`}>
                                        {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Data</label>
                                <input
                                    type="datetime-local"
                                    value={post.date.slice(0, 16)}
                                    onChange={(e) => setPost({ ...post, date: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 outline-none focus:ring-2 focus:ring-bible-gold"
                                />
                            </div>
                        </div>
                    </div>




                    {/* Categories */}
                    <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-stone-800 dark:text-stone-100">Categoria</h3>
                            <button
                                onClick={() => {
                                    const name = prompt("Nome da nova categoria:");
                                    if (name) {
                                        const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-');
                                        fetch('/api/categories', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ name, slug })
                                        }).then(res => {
                                            if (res.ok) {
                                                loadCategories();
                                                return res.json();
                                            }
                                        }).then(newCat => {
                                            if (newCat) setPost(prev => ({ ...prev, category: newCat.id }));
                                        });
                                    }
                                }}
                                className="text-xs bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 px-2 py-1 rounded text-stone-600 dark:text-stone-400 transition-colors"
                            >
                                + Nova
                            </button>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {buildCategoryTree(categories).map(({ category: cat, level }) => (
                                <label key={cat.id} className="flex items-center gap-3 p-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg cursor-pointer transition-colors" style={{ paddingLeft: `${(level * 16) + 8}px` }}>
                                    {level > 0 && <CornerDownRight size={14} className="text-stone-400" />}
                                    <input
                                        type="radio"
                                        name="category"
                                        checked={post.category === cat.id || post.category === cat.slug}
                                        onChange={() => setPost({ ...post, category: cat.id })}
                                        className="w-4 h-4 text-bible-gold focus:ring-bible-gold border-stone-300"
                                    />
                                    <span className="text-stone-700 dark:text-stone-300">{cat.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Featured Image */}
                    <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
                        <h3 className="font-bold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
                            <ImageIcon size={18} /> Imagem de Capa
                        </h3>
                        {post.image ? (
                            <div className="relative group rounded-lg overflow-hidden shadow-md">
                                <img src={post.image} alt="Featured" className="w-full h-40 object-cover" />
                                <button
                                    onClick={() => setPost({ ...post, image: '' })}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="h-40 bg-stone-100 dark:bg-stone-800 rounded-lg flex flex-col items-center justify-center text-stone-400 border-2 border-dashed border-stone-300 dark:border-stone-700 gap-2">
                                <ImageIcon size={32} />
                                <span className="text-xs">Nenhuma imagem selecionada</span>
                            </div>
                        )}
                        <input
                            type="text"
                            placeholder="URL da imagem..."
                            value={post.image || ''}
                            onChange={(e) => handleCoverUrlChange(e.target.value)}
                            className="w-full mt-4 p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm outline-none focus:ring-2 focus:ring-bible-gold"
                        />
                        <button
                            onClick={selectCoverImage}
                            className="w-full mt-2 py-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                            <ImageIcon size={16} /> Selecionar da Galeria
                        </button>
                    </div>

                    {/* SEO Settings */}
                    <div className="bg-white dark:bg-stone-900 p-6 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800">
                        <h3 className="font-bold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
                            <Sparkles size={18} /> SEO & Metadados
                        </h3>

                        <div className="space-y-4">
                            {/* Google Preview */}
                            <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
                                <div className="text-xs text-stone-500 mb-2">Prévia do Google</div>
                                <div className="font-sans">
                                    <div className="text-[#1a0dab] text-xl hover:underline cursor-pointer truncate">
                                        {post.seoTitle || post.title || 'Título do Post'}
                                    </div>
                                    <div className="text-[#006621] text-sm truncate">
                                        biblia.com › {categorySlug ? categorySlug + ' › ' : ''}{post.slug || 'slug-do-post'}
                                    </div>
                                    <div className="text-[#545454] text-sm mt-1 line-clamp-2">
                                        {post.metaDescription || post.content?.substring(0, 160) || 'Descrição do post...'}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleGenerateSEO}
                                disabled={generating}
                                className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                            >
                                <Sparkles size={16} /> Otimizar SEO com IA
                            </button>

                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">SEO Title</label>
                                <input
                                    type="text"
                                    value={post.seoTitle || ''}
                                    onChange={(e) => setPost({ ...post, seoTitle: e.target.value })}
                                    placeholder="Título otimizado para busca"
                                    className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 outline-none focus:ring-2 focus:ring-bible-gold text-sm"
                                />
                                <div className="text-right text-xs text-stone-400 mt-1">
                                    {(post.seoTitle || '').length}/60
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Meta Description</label>
                                <textarea
                                    value={post.metaDescription || ''}
                                    onChange={(e) => setPost({ ...post, metaDescription: e.target.value })}
                                    placeholder="Descrição curta e atrativa..."
                                    rows={3}
                                    className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 outline-none focus:ring-2 focus:ring-bible-gold text-sm resize-none"
                                />
                                <div className="text-right text-xs text-stone-400 mt-1">
                                    {(post.metaDescription || '').length}/160
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Slug (URL)</label>
                                <input
                                    type="text"
                                    value={post.slug || ''}
                                    onChange={(e) => {
                                        const newSlug = e.target.value
                                            .toLowerCase()
                                            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                                            .replace(/\s+/g, '-')
                                            .replace(/[^a-z0-9-]/g, '');
                                        setPost({ ...post, slug: newSlug });
                                    }}
                                    placeholder="slug-do-post"
                                    className="w-full p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 outline-none focus:ring-2 focus:ring-bible-gold text-sm font-mono"
                                />


                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Title Selection Modal */}
            {showTitleModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center">
                            <h3 className="text-xl font-serif font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                                <Sparkles className="text-bible-gold" /> Escolha um Título
                            </h3>
                            <button onClick={() => setShowTitleModal(false)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
                                A IA gerou 5 opções otimizadas para SEO. Selecione a que melhor se adapta ao seu conteúdo.
                            </p>
                            {titleOptions.map((option, index) => (
                                <div
                                    key={index}
                                    onClick={() => selectTitleOption(option)}
                                    className="p-4 border border-stone-200 dark:border-stone-800 rounded-lg hover:border-bible-gold dark:hover:border-bible-gold cursor-pointer transition-all hover:bg-stone-50 dark:hover:bg-stone-800/50 group"
                                >
                                    <h4 className="font-bold text-lg text-stone-800 dark:text-stone-100 mb-1 group-hover:text-bible-gold transition-colors">
                                        {option.title}
                                    </h4>
                                    <div className="text-xs text-stone-500 space-y-1">
                                        <p><span className="font-bold">SEO Title:</span> {option.seoTitle}</p>
                                        <p><span className="font-bold">Meta:</span> {option.metaDescription}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlogEditor;


