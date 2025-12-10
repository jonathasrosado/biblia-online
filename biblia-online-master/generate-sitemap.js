import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Bible Books Data (Copied from constants.ts)
const bibleBooks = [
    { name: 'Gênesis', chapters: 50 },
    { name: 'Êxodo', chapters: 40 },
    { name: 'Levítico', chapters: 27 },
    { name: 'Números', chapters: 36 },
    { name: 'Deuteronômio', chapters: 34 },
    { name: 'Josué', chapters: 24 },
    { name: 'Juízes', chapters: 21 },
    { name: 'Rute', chapters: 4 },
    { name: '1 Samuel', chapters: 31 },
    { name: '2 Samuel', chapters: 24 },
    { name: '1 Reis', chapters: 22 },
    { name: '2 Reis', chapters: 25 },
    { name: '1 Crônicas', chapters: 29 },
    { name: '2 Crônicas', chapters: 36 },
    { name: 'Esdras', chapters: 10 },
    { name: 'Neemias', chapters: 13 },
    { name: 'Ester', chapters: 10 },
    { name: 'Jó', chapters: 42 },
    { name: 'Salmos', chapters: 150 },
    { name: 'Provérbios', chapters: 31 },
    { name: 'Eclesiastes', chapters: 12 },
    { name: 'Cânticos', chapters: 8 },
    { name: 'Isaías', chapters: 66 },
    { name: 'Jeremias', chapters: 52 },
    { name: 'Lamentações', chapters: 5 },
    { name: 'Ezequiel', chapters: 48 },
    { name: 'Daniel', chapters: 12 },
    { name: 'Oseias', chapters: 14 },
    { name: 'Joel', chapters: 3 },
    { name: 'Amós', chapters: 9 },
    { name: 'Obadias', chapters: 1 },
    { name: 'Jonas', chapters: 4 },
    { name: 'Miqueias', chapters: 7 },
    { name: 'Naum', chapters: 3 },
    { name: 'Habacuque', chapters: 3 },
    { name: 'Sofonias', chapters: 3 },
    { name: 'Ageu', chapters: 2 },
    { name: 'Zacarias', chapters: 14 },
    { name: 'Malaquias', chapters: 4 },
    { name: 'Mateus', chapters: 28 },
    { name: 'Marcos', chapters: 16 },
    { name: 'Lucas', chapters: 24 },
    { name: 'João', chapters: 21 },
    { name: 'Atos', chapters: 28 },
    { name: 'Romanos', chapters: 16 },
    { name: '1 Coríntios', chapters: 16 },
    { name: '2 Coríntios', chapters: 13 },
    { name: 'Gálatas', chapters: 6 },
    { name: 'Efésios', chapters: 6 },
    { name: 'Filipenses', chapters: 4 },
    { name: 'Colossenses', chapters: 4 },
    { name: '1 Tessalonicenses', chapters: 5 },
    { name: '2 Tessalonicenses', chapters: 3 },
    { name: '1 Timóteo', chapters: 6 },
    { name: '2 Timóteo', chapters: 4 },
    { name: 'Tito', chapters: 3 },
    { name: 'Filemom', chapters: 1 },
    { name: 'Hebreus', chapters: 13 },
    { name: 'Tiago', chapters: 5 },
    { name: '1 Pedro', chapters: 5 },
    { name: '2 Pedro', chapters: 3 },
    { name: '1 João', chapters: 5 },
    { name: '2 João', chapters: 1 },
    { name: '3 João', chapters: 1 },
    { name: 'Judas', chapters: 1 },
    { name: 'Apocalipse', chapters: 22 },
];

const normalizeBookName = (name) => {
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
};

const BASE_URL = 'https://bibliaonline.me';

async function generateSitemap() {
    console.log('Generating sitemap...');
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Helper to add URL
    const addUrl = (url, priority = '0.8', changefreq = 'monthly') => {
        xml += '  <url>\n';
        xml += `    <loc>${BASE_URL}${url}</loc>\n`;
        xml += `    <changefreq>${changefreq}</changefreq>\n`;
        xml += `    <priority>${priority}</priority>\n`;
        xml += '  </url>\n';
    };

    // 1. Static Pages
    addUrl('/', '1.0', 'daily');
    addUrl('/chat', '0.9', 'weekly');
    addUrl('/devocional', '0.9', 'daily');
    addUrl('/blog', '0.9', 'weekly');
    addUrl('/versiculos', '0.9', 'monthly');
    addUrl('/como-ler-biblia', '0.9', 'monthly');
    addUrl('/faq-biblia', '0.9', 'monthly');

    // 2. Bible Structure
    bibleBooks.forEach(book => {
        const bookSlug = normalizeBookName(book.name);

        // Book Intro Page
        addUrl(`/leitura/${bookSlug}`, '0.9', 'monthly');

        // Chapters
        for (let i = 1; i <= book.chapters; i++) {
            addUrl(`/leitura/${bookSlug}/${i}`, '0.8', 'monthly');
        }
    });

    // 3. Blog Posts (Read from local file since we can't fetch API easily in this script without dev server running)
    // Attempting to read blog posts from data directory if exists, otherwise skipping
    const dataDir = path.join(__dirname, 'src', 'data');
    const postsFile = path.join(dataDir, 'blog_posts.json');
    if (fs.existsSync(postsFile)) {
        try {
            const posts = JSON.parse(fs.readFileSync(postsFile, 'utf8'));
            posts.forEach(post => {
                if (post.status === 'published') {
                    // Assuming slug structure is /blog/slug or /category/slug
                    // Based on App.tsx it's /:category/:slug
                    // Need to check how categories are handled
                    const categorySlug = 'blog'; // Simplified for now since obtaining category slug map is complex
                    addUrl(`/${categorySlug}/${post.slug}`, '0.8', 'monthly');
                }
            });
            console.log(`Added ${posts.length} blog posts.`);
        } catch (e) {
            console.error('Error reading blog posts:', e);
        }
    }

    xml += '</urlset>';

    const outputPath = path.join(__dirname, 'public', 'sitemap.xml');
    fs.writeFileSync(outputPath, xml);
    console.log(`Sitemap generated at ${outputPath}`);
}

generateSitemap();
