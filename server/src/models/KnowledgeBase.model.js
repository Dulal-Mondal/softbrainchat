// const mongoose = require('mongoose');

// const KnowledgeBaseSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     type: { type: String, enum: ['file', 'url'], required: true },
//     name: { type: String, required: true },
//     mimeType: { type: String },
//     size: { type: Number },
//     status: { type: String, enum: ['processing', 'indexed', 'failed'], default: 'processing' },
//     vectorIds: { type: [String], default: [] },
//     chunkCount: { type: Number, default: 0 },
//     error: { type: String },
//     createdAt: { type: Date, default: Date.now },
// });

// KnowledgeBaseSchema.index({ userId: 1 });
// KnowledgeBaseSchema.index({ userId: 1, type: 1, status: 1 });

// module.exports = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);


const mongoose = require('mongoose');

const KnowledgeBaseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['file', 'url'], required: true },
    name: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
    status: { type: String, enum: ['processing', 'indexed', 'failed'], default: 'processing' },
    vectorIds: { type: [String], default: [] },
    chunkCount: { type: Number, default: 0 },
    error: { type: String },
}, {
    timestamps: true,
});

KnowledgeBaseSchema.index({ userId: 1 });
KnowledgeBaseSchema.index({ userId: 1, type: 1, status: 1 });

module.exports = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);