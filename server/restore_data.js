import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define Schemas INLINE to avoid import issues
const blogPostSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String },
    excerpt: String,
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['published', 'draft'], default: 'draft' },
    tags: [String],
    category: String,
    coverImage: String,
    author: String,
    seo: {
        title: String,
        description: String,
        keywords: [String]
    },
    views: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
// Use 'BlogPost' model to match the application's expected collection
const BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost', blogPostSchema);

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    parentId: { type: String, default: null }
}, { timestamps: true });
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

async function run() {
    try {
        console.log("Starting ROBUST migration...");
        if (!process.env.MONGO_URI) throw new Error("No MONGO_URI");

        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to Mongo.");

        // Paths - Use process.cwd() for reliability
        const ROOT = process.cwd();
        const POSTS_DIR = path.join(ROOT, 'src', 'data', 'blog_posts');
        const CATEGORIES_PATH = path.join(ROOT, 'src', 'data', 'categories.json');

        console.log(`Looking for posts in: ${POSTS_DIR}`);

        // 1. Categories
        if (fs.existsSync(CATEGORIES_PATH)) {
            const cats = JSON.parse(fs.readFileSync(CATEGORIES_PATH, 'utf-8'));
            console.log(`Found ${cats.length} categories.`);
            for (const c of cats) {
                try {
                    await Category.findOneAndUpdate(
                        { slug: c.slug },
                        c,
                        { upsert: true, new: true }
                    );
                } catch (e) { console.error(`Cat Error ${c.name}:`, e.message); }
            }
            console.log("Categories synced.");
        }

        // 2. Posts
        if (fs.existsSync(POSTS_DIR)) {
            const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.json'));
            console.log(`Found ${files.length} post files.`);

            let successCount = 0;
            for (const file of files) {
                try {
                    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
                    const data = JSON.parse(raw);

                    if (!data.slug || !data.title) {
                        console.warn(`Skipping invalid file: ${file}`);
                        continue;
                    }

                    // Fix status
                    if (!data.status) data.status = 'published';

                    // Insert/Update
                    await BlogPost.findOneAndUpdate(
                        { slug: data.slug },
                        data,
                        { upsert: true, new: true }
                    );
                    successCount++;
                    // console.log(`Processed: ${data.title}`);
                } catch (e) {
                    console.error(`Failed ${file}:`, e.message);
                }
            }
            console.log(`Successfully migrated ${successCount} posts.`);
        } else {
            console.error(`DIRECTORY NOT FOUND: ${POSTS_DIR}`);
        }

        const finalCount = await BlogPost.countDocuments({});
        console.log(`Final DB Count: ${finalCount}`);

        process.exit(0);

    } catch (e) {
        console.error("Migration Fatal Error:", e);
        process.exit(1);
    }
}

run();
