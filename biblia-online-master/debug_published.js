import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Mimic server/api.js import
const BlogPostPath = path.resolve(process.cwd(), 'server', 'models', 'BlogPost.js');
const { default: BlogPost } = await import('file://' + BlogPostPath);

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const posts = await BlogPost.find({ status: 'published' }).sort({ date: -1 }).limit(3);

        console.log("--- PUBLISHED POSTS DEBUG ---");
        posts.forEach(p => {
            console.log(`Title: ${p.title}`);
            console.log(`Slug: ${p.slug}`);
            console.log(`Status: ${p.status}`);
            console.log(`CoverImage: '${p.coverImage}'`); // Quote to see empty strings
            console.log(`Image (Legacy): '${p.image}'`);
            console.log("-----------------------");
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
