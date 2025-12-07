
import mongoose from 'mongoose';

const bookSummarySchema = new mongoose.Schema({
    book: {
        type: String,
        required: true,
        index: true // Faster lookups
    },
    normalizedBook: {
        type: String, // For accent-insensitive lookups (e.g., 'genesis')
        required: true,
        unique: true
    },
    language: {
        type: String,
        required: true,
        default: 'pt'
    },
    title: String,
    testament: String,
    author: String,
    date: String,
    theme: String,
    keyVerse: String,
    summary: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
bookSummarySchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const BookSummary = mongoose.model('BookSummary', bookSummarySchema);

export default BookSummary;
