
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    googleId: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true },
    name: String,
    picture: String,
    role: { type: String, default: 'user' }, // 'user', 'admin'
    createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);

const settingsSchema = new mongoose.Schema({
    key: { type: String, default: 'global', unique: true }, // Singleton pattern
    siteTitle: { type: String, default: 'Bíblia Online Inteligente' },
    siteDescription: String,
    themeColor: String,
    contactEmail: String,
    scripts: String, // Custom Header/Body Scripts
    updatedAt: { type: Date, default: Date.now }
});

export const Settings = mongoose.model('Settings', settingsSchema);
