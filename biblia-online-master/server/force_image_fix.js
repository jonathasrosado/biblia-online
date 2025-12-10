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
        console.log("Connected to MongoDB");

        const BLOG_DIR = path.join(process.cwd(), 'src', 'data', 'blog_posts');
        const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.json'));

        for (const file of files) {
            const data = JSON.parse(fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8'));
            if (!data.slug || !data.image) continue;

            const post = await BlogPost.findOne({ slug: data.slug });
            if (!post) continue;

            // Determine correct image filename
            // Legacy JSON image format: "../../public/uploads/foo.jpg" OR just "foo.jpg"
            const legacyPath = data.image;
            const basename = path.basename(legacyPath);

            // We need to find this file in 'uploads' directory
            // The migration (restore_data.js) might have renamed it with timestamp?
            // "1764774905685-lendo_biblia.jpeg"
            // Let's Search for a file in UPLOADS_DIR that ENDS WITH the basename
            // OR contains the main part of the filename.

            const allUploads = fs.readdirSync(UPLOADS_DIR);

            // Try explicit match first
            let cleanName = basename.split('?')[0]; // Remove query string if any
            let match = allUploads.find(u => u === cleanName || u.endsWith(cleanName) || u.includes(cleanName.replace(/\.[^/.]+$/, ""))); // Loose match

            if (match) {
                const finalPath = `/api/uploads/${match}`;

                if (post.coverImage !== finalPath) {
                    console.log(`Updating ${post.slug}: ${finalPath}`);
                    await BlogPost.updateOne({ _id: post._id }, {
                        $set: {
                            coverImage: finalPath,
                            image: finalPath // Ensure legacy field is also set just in case
                        }
                    });
                }
            } else {
                console.log(`Image not found for ${post.slug}: ${cleanName}`);
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
