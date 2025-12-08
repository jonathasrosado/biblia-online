
import mongoose from 'mongoose';

const blogPostSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String }, // HTML or Markdown
    excerpt: String,
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['published', 'draft'], default: 'draft' },
    tags: [String],
    category: String,
    coverImage: String,
    author: String,
    seo: {
        title: String,
        description: String,
        keywords: [String]
    },
    views: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Middleware to update updatedAt
blogPostSchema.pre('save', function () {
    this.updatedAt = new Date();
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

export default BlogPost;
