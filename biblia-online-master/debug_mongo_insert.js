import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

console.log("Starting Debug Insert...");

const blogPostSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: String,
    date: { type: Date, default: Date.now },
    status: { type: String, default: 'draft' }
});

// Use a slightly different model name to avoid compiling issues if mixing imports
const BlogPostDebug = mongoose.model('BlogPostDebug', blogPostSchema, 'blogposts');
// Note: 'blogposts' forces collection name to match what we expect the real model to use

async function run() {
    try {
        console.log("Connecting to Mongo...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        console.log("Checking count...");
        const count = await BlogPostDebug.countDocuments({});
        console.log(`Current count: ${count}`);

        console.log("Attempting insert...");
        const newPost = await BlogPostDebug.create({
            slug: `debug-post-${Date.now()}`,
            title: "Debug Post",
            content: "This is a test.",
            status: "published"
        });
        console.log("Insert successful:", newPost._id);

        console.log("Checking count again...");
        const countAfter = await BlogPostDebug.countDocuments({});
        console.log(`New count: ${countAfter}`);

        process.exit(0);
    } catch (e) {
        console.error("FATAL ERROR:", e);
        process.exit(1);
    }
}

run();
