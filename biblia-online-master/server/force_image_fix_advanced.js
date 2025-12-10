import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads dir exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Schema
const blogPostSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    title: String,
    coverImage: String,
    image: String, // legacy
    status: String
}, { strict: false });
const BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost', blogPostSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for ADVANCED FIX");

        const BLOG_DIR = path.join(process.cwd(), 'src', 'data', 'blog_posts');
        const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.json'));
        const allUploads = fs.readdirSync(UPLOADS_DIR);

        for (const file of files) {
            const data = JSON.parse(fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8'));
            if (!data.slug || !data.image) continue;

            const post = await BlogPost.findOne({ slug: data.slug });
            if (!post) continue;

            // Advanced Matching Logic
            const legacyPath = data.image; // e.g. "../../public/uploads/Foo Bar%20Baz.jpg"
            const basename = path.basename(legacyPath);
            const decodedName = decodeURIComponent(basename); // "Foo Bar Baz.jpg"
            const normalizedName = decodedName.replace(/\s+/g, '_').toLowerCase(); // "foo_bar_baz.jpg"
            const rootName = normalizedName.split('.')[0]; // "foo_bar_baz" (no extension)

            // Try to find a match in uploads
            // Priority:
            // 1. Exact match of normalized name
            // 2. Upload file contains the root name (e.g. "1764...foo_bar_baz.jpg")

            let match = allUploads.find(u => {
                const uLower = u.toLowerCase();
                return uLower === normalizedName ||
                    uLower.includes(normalizedName) ||
                    uLower.includes(rootName)
            });

            if (match) {
                const finalPath = `/api/uploads/${match}`;
                if (post.coverImage !== finalPath) {
                    console.log(`[FIXED] ${post.slug}: MATCHED '${match}'`);
                    await BlogPost.updateOne({ _id: post._id }, {
                        $set: {
                            coverImage: finalPath,
                            image: finalPath
                        }
                    });
                } else {
                    // console.log(`[OK] ${post.slug}`);
                }
            } else {
                console.log(`[FAILED] ${post.slug}: COULD NOT MATCH '${basename}' (Normalized: ${normalizedName})`);
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
