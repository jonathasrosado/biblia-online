import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const BlogPost = (await import('./server/models/BlogPost.js')).default;

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const total = await BlogPost.countDocuments({});
        // Use object syntax to avoid variable issues
        const withCover = await BlogPost.countDocuments({ coverImage: { $nin: [null, ""] } });
        const published = await BlogPost.countDocuments({ status: 'published' });
        const publishedWithCover = await BlogPost.countDocuments({ status: 'published', coverImage: { $nin: [null, ""] } });

        console.log("----------------RESULTS----------------");
        console.log({ total, withCover, published, publishedWithCover });

        // Also dump one published post to see its structure
        const wrongPost = await BlogPost.findOne({ status: 'published' });
        console.log("Sample Post:", JSON.stringify(wrongPost, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
