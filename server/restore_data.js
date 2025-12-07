import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DATA_DIR = path.join(__dirname, '..', 'src', 'data');
const BLOG_DIR = path.join(DATA_DIR, 'blog_posts');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

console.log("Starting Data Restoration...");

async function connectDB() {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI not defined in .env");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
}

async function run() {
    try {
        await connectDB();

        // 1. Restore Categories
        console.log("Restoring Categories...");
        if (fs.existsSync(CATEGORIES_FILE)) {
            const categoriesData = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf-8'));
            const { Category } = await import('./models/Category.js');

            for (const cat of categoriesData) {
                // Check if exists
                const exists = await Category.findOne({ slug: cat.slug });
                if (!exists) {
                    await Category.create(cat);
                    console.log(`Created Category: ${cat.name}`);
                } else {
                    console.log(`Category exists: ${cat.name}`);
                }
            }
        } else {
            console.log("No categories.json found.");
        }

        // 2. Restore Blog Posts
        console.log("Restoring Blog Posts...");
        if (fs.existsSync(BLOG_DIR)) {
            const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.json'));
            // Fix: BlogPost is default export
            const { default: BlogPost } = await import('./models/BlogPost.js');
            const { Image } = await import('./models/Image.js');

            for (const file of files) {
                try {
                    const filePath = path.join(BLOG_DIR, file);
                    const postData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                    // Check key fields
                    if (!postData.slug || !postData.title) continue;

                    // Handle Image
                    let finalImage = postData.image;

                    // If image is local path (e.g., /uploads/...)
                    if (finalImage && !finalImage.startsWith('http')) {
                        const filename = path.basename(finalImage);
                        // Try to find file in public/uploads or root uploads
                        const possiblePaths = [
                            path.join(process.cwd(), 'public', 'uploads', filename),
                            path.join(process.cwd(), 'uploads', filename),
                            path.join(process.cwd(), 'dist', 'uploads', filename)
                        ];

                        let imageBuffer = null;

                        for (const p of possiblePaths) {
                            if (fs.existsSync(p)) {
                                imageBuffer = fs.readFileSync(p);
                                break;
                            }
                        }

                        if (imageBuffer) {
                            console.log(`Migrating local image: ${filename}`);
                            // Save to Mongo Image
                            let existingImg = await Image.findOne({ filename: filename });
                            if (!existingImg) {
                                const base64Data = imageBuffer.toString('base64');
                                const ext = path.extname(filename).toLowerCase();
                                let mime = 'image/png';
                                if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
                                if (ext === '.webp') mime = 'image/webp';

                                await Image.create({
                                    filename: filename,
                                    contentType: mime,
                                    data: base64Data
                                });
                            }
                            finalImage = `/api/uploads/${filename}`;
                        } else {
                            console.warn(`Local image not found for post ${postData.title}: ${finalImage}`);
                        }
                    }

                    // Check if post exists
                    const existingPost = await BlogPost.findOne({ slug: postData.slug });
                    if (!existingPost) {
                        // Map fields
                        const newPost = {
                            slug: postData.slug,
                            title: postData.title,
                            content: postData.content,
                            excerpt: postData.metaDescription || "",
                            category: postData.category,
                            date: postData.date ? new Date(postData.date) : new Date(),
                            status: postData.status || 'published',
                            coverImage: finalImage,
                            seo: {
                                title: postData.seoTitle,
                                description: postData.metaDescription
                            },
                            views: 0,
                            createdAt: postData.date ? new Date(postData.date) : new Date(),
                            updatedAt: new Date()
                        };

                        await BlogPost.create(newPost);
                        console.log(`Created Post: ${postData.title}`);
                    } else {
                        console.log(`Post exists: ${postData.title}`);
                    }
                } catch (err) {
                    console.error(`Error processing file ${file}:`, err);
                }
            }
        } else {
            console.log("No blog_posts directory found.");
        }

        console.log("Migration Complete!");
        process.exit(0);

    } catch (e) {
        console.error("Migration Failed:", e);
        process.exit(1);
    }
}

run();
