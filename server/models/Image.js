
import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
    filename: { type: String, required: true, unique: true },
    contentType: { type: String, required: true },
    data: { type: String, required: true }, // Base64 Data
    createdAt: { type: Date, default: Date.now }
});

export const Image = mongoose.model('Image', imageSchema);
