import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const blogPostSchema = new mongoose.Schema({
    slug: String,
    title: String,
    coverImage: String,
    category: String
}, { strict: false });
const BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost', blogPostSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const posts = await BlogPost.find({}).limit(5);
        console.log(JSON.stringify(posts, null, 2));
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}
run();
