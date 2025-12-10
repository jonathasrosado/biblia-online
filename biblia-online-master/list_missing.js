import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const BlogPost = (await import('./server/models/BlogPost.js')).default;

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        // Find posts where coverImage is null, empty, or undefined.
        // Also include posts where coverImage IS set but might be wrong (optional, but keep simple)
        const posts = await BlogPost.find({
            status: 'published',
            $or: [
                { coverImage: { $exists: false } },
                { coverImage: null },
                { coverImage: "" }
            ]
        });

        console.log("--- POSTS SEM CAPA ---");
        posts.forEach(p => {
            console.log(`[ ] ${p.title} (Slug: ${p.slug})`);
            console.log(`    Legacy: ${p.image}`);
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
