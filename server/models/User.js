import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    // Auth Fields
    googleId: { type: String, unique: true, sparse: true }, // Optional, only for Google Users
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Hashed password (optional if Google-only)

    // Profile Fields
    username: { type: String }, // Optional initially, can be set during profile completion
    name: { type: String, required: true },
    picture: { type: String },
    role: { type: String, default: 'user', enum: ['user', 'admin'] },

    // User Data
    preferences: { type: Object }, // Store theme, font size etc.
    favorites: [{ type: Object }], // Store favorite verses
    history: [{ type: Object }],   // Store reading history
    completedChapters: [{
        book: String,
        chapter: Number,
        completedAt: { type: Date, default: Date.now }
    }],

    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
export default User;
