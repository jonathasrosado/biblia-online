import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const BlogPostPath = path.resolve(process.cwd(), 'server', 'models', 'BlogPost.js');
const { default: BlogPost } = await import('file://' + BlogPostPath);

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const post = await BlogPost.findOne({ status: 'published' }).sort({ date: -1 });
        if (post) {
            console.log(`SLUG: ${post.slug}`);
            console.log(`COVER: ${post.coverImage}`);
        } else {
            console.log("NO POSTS FOUND");
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
