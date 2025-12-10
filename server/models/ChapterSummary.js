import mongoose from 'mongoose';

const chapterSummarySchema = new mongoose.Schema({
    book: {
        type: String,
        required: true,
        index: true
    },
    normalizedBook: {
        type: String,
        required: true,
        index: true
    },
    chapter: {
        type: Number,
        required: true,
        index: true
    },
    language: {
        type: String,
        required: true,
        default: 'pt',
        index: true
    },
    title: String,
    summary: String,
    structure: {
        intro: String,
        blocks: [{
            verses: String,
            description: String
        }],
        centralMessage: String
    },
    keyVerses: [{
        verses: String,
        title: String,
        explanation: String
    }],
    historicalContext: String,
    practicalApplication: [String],
    prayer: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for unique chapter lookups
chapterSummarySchema.index({ normalizedBook: 1, chapter: 1, language: 1 }, { unique: true });

// Update timestamp on save
chapterSummarySchema.pre('save', function () {
    this.updatedAt = Date.now();
});

const ChapterSummary = mongoose.model('ChapterSummary', chapterSummarySchema);

export default ChapterSummary;
