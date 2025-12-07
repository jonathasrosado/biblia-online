import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const BlogPost = (await import('./server/models/BlogPost.js')).default;
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const posts = await BlogPost.find({ status: 'published' }).sort({ date: -1 });
        const allUploads = fs.readdirSync(UPLOADS_DIR);

        console.log("--- MISSING IMAGES REPORT ---");
        let missingCount = 0;

        for (const p of posts) {
            let matches = false;
            // Check if coverImage is set AND points to an existing file
            if (p.coverImage && p.coverImage.startsWith('/api/uploads/')) {
                const filename = p.coverImage.split('/').pop();
                if (fs.existsSync(path.join(UPLOADS_DIR, filename))) {
                    matches = true;
                }
            }

            if (!matches) {
                missingCount++;
                console.log(`[MISSING] ${p.title} (${p.slug})`);
                console.log(`   Legacy Image: ${p.image || 'N/A'}`);
                console.log(`   Current Cover: ${p.coverImage || 'N/A'}`);
            }
        }

        console.log(`\nTotal Missing: ${missingCount} / ${posts.length}`);

        if (missingCount > 0) {
            console.log("\n--- UNUSED FILES IN UPLOADS (Potential Matches?) ---");
            // Find files in uploads that are NOT used by any post
            const usedFiles = posts.map(p => p.coverImage ? p.coverImage.split('/').pop() : '').filter(Boolean);
            const unused = allUploads.filter(u => !usedFiles.includes(u));
            unused.forEach(u => console.log(u));
        }

        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}
run();
