import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// Schemas
const blogPostSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: String,
    coverImage: String,
    image: String, // Legacy field
    status: String
}, { strict: false });
const BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost', blogPostSchema);

async function run() {
    try {
        if (!process.env.MONGO_URI) throw new Error("No MONGO_URI");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to Mongo for FIX.");

        // 1. Load Categories Map
        const CAT_FILE = path.join(process.cwd(), 'src', 'data', 'categories.json');
        let catMap = {}; // ID -> Slug (or Name)
        if (fs.existsSync(CAT_FILE)) {
            const cats = JSON.parse(fs.readFileSync(CAT_FILE, 'utf-8'));
            cats.forEach(c => {
                catMap[c.id] = c.name; // Map ID to Name for display, or Slug? User asked for normalization.
                // React code shows: getCategoryName(id) finds it. 
                // BUT HomePage just prints {post.category}. So we should store the NAME or SLUG.
                // User said: "unifique em categoria". If I store 'duvidas' (slug), BlogPage works.
                // If I store 'Dúvidas' (name), BlogPage might need adjustment.
                // Let's store SLUG because BlogPage uses it for filtering URL: /blog?category=slug
                // Wait, BlogPage logic:
                // const cat = categories.find(c => c.id === catId || c.slug === catId);
                // return cat ? cat.name : '';
                // So if we store SLUG 'duvidas', getCategoryName('duvidas') works.
                // AND HomePage displays {post.category}. If we display 'duvidas', it looks lowercase.
                // If we display 'Dúvidas', it looks good.
                // HomePage.tsx: <span ...>{post.category || 'Geral'}</span>.
                // So HomePage expects a DISPLAY name.
                // CONFLICT: BlogPage filter expects SLUG in URL.
                // IF I store Name, `?category=Dúvidas` might fail if logic expects slug.
                // Let's check BlogPage logic again.
                // `return post.category === categoryFilter || (catName && catName.toLowerCase() === categoryFilter.toLowerCase());`
                // So if URL is `?category=duvidas`, and we store 'Dúvidas', catName is 'Dúvidas'. comparison: 'dúvidas' === 'duvidas'. Works (ignoring accent? No).
                // Safest bet: Store SLUG in `category` field (for filtering), 
                // AND update HomePage to lookup Name from Slug (like BlogPage does).
                // BUT user wants me to fix "Numbers in categories".
                // If I just change ID to Name 'Ensinamentos', HomePage shows 'Ensinamentos'. Perfect.
                // BlogPage filter: `post.category === 'Ensinamentos'`. URL `?category=duvidas`.
                // catName('Ensinamentos') -> undefined (unless I map Name->Name).

                // DECISION: Store NAME ('Ensinamentos') in valid BlogPost.category.
                // And ensure frontend maps standard slugs to Names if needed.
                // Actually, `categories.json` has `slug: "duvidas"`.
                // If I store "Dúvidas", the link `?category=duvidas` won't match direct field unless resolved.
                // Let's Store NAME. It looks best on UI immediately.
                catMap[c.id] = c.name;
            });
        }

        console.log("Category Map Loaded:", Object.keys(catMap).length);

        // 2. Fix Posts
        const posts = await BlogPost.find({});
        for (const p of posts) {
            let changes = false;

            // FIX 1: Category ID -> Name
            if (p.category && catMap[p.category]) {
                console.log(`Fixing Category for ${p.title}: ${p.category} -> ${catMap[p.category]}`);
                p.category = catMap[p.category];
                changes = true;
            }

            // FIX 2: Images
            // If coverImage is missing but image exists, copy it.
            if (!p.coverImage && p.image) {
                p.coverImage = p.image;
                changes = true;
            }

            // If coverImage is a local path, try to fix it?
            // Current issue: "Capas nao carregam".
            // If it is `/api/uploads/foo.jpg`, and file is missing, it fails.
            // If it is `../../public/uploads/foo.jpg`, it fails.
            // I'll check if it looks like a path and just ensure it is /api/uploads/
            if (p.coverImage && p.coverImage.includes('public/uploads')) {
                const filename = path.basename(p.coverImage);
                p.coverImage = `/api/uploads/${filename}`;
                changes = true;
            }

            if (changes) {
                await BlogPost.updateOne({ _id: p._id }, { $set: { category: p.category, coverImage: p.coverImage } });
            }
        }

        console.log("Done.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
