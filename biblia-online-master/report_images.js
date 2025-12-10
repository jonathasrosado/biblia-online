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
        const posts = await BlogPost.find({}).sort({ date: -1 });

        console.log("--- IMAGE STATUS REPORT ---");
        for (const p of posts) {
            let status = "OK";
            let reason = "";

            if (!p.coverImage) {
                status = "MISSING DB";
            } else if (p.coverImage.startsWith('/api/uploads/')) {
                const filename = p.coverImage.replace('/api/uploads/', '');
                if (!fs.existsSync(path.join(UPLOADS_DIR, filename))) {
                    status = "FILE MISSING";
                    reason = `File '${filename}' not found in uploads`;
                }
            }

            if (status !== "OK") {
                console.log(`[${status}] ${p.title}`);
                if (reason) console.log(`  Reason: ${reason}`);
                console.log(`  DB Cover: ${p.coverImage}`);
                console.log(`  Legacy Image: ${p.image}`);
                console.log("--------------------------------");
            }
        }
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}
run();
