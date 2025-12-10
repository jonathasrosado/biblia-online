import mongoose from 'mongoose';

const devotionalSchema = new mongoose.Schema({
    date: { type: String, required: true }, // YYYY-MM-DD
    language: { type: String, default: 'pt' },
    title: { type: String, required: true },
    verse: {
        text: String,
        reference: String
    },
    content: { type: String, required: true },
    prayer: String,
    rawJson: String, // Store original raw response just in case
    createdAt: { type: Date, default: Date.now }
});

// Composite index to ensure one devotional per language per day
devotionalSchema.index({ date: 1, language: 1 }, { unique: true });

export const Devotional = mongoose.model('Devotional', devotionalSchema);
