
import mongoose from 'mongoose';
import { aiManager } from './server/services/aiManager.js';
import dotenv from 'dotenv';
dotenv.config();

// Connect to DB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/biblia_db';
console.log('Connecting to:', MONGO_URI);

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB.');

        // Test Genesis
        console.log('\n--- Request 1: Genesis (First pass - should generate/save) ---');
        await aiManager.generateBookSummary('Gênesis', 'pt', false);

        // Test Genesis again
        console.log('\n--- Request 2: Genesis (Second pass - should CACHE HIT) ---');
        await aiManager.generateBookSummary('Gênesis', 'pt', false);

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
