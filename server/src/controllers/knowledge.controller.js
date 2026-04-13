// const KnowledgeBase = require('../models/KnowledgeBase.model');
// const { parseFile } = require('../services/fileParser.service');
// const { scrapeUrl } = require('../services/urlScraper.service');
// const { indexText, deleteVectors } = require('../services/vectorStore.service');
// const fs = require('fs');

// // ── GET /api/knowledge ───────────────────────────────────────
// exports.getAll = async (req, res) => {
//     try {
//         const items = await KnowledgeBase.find({ userId: req.user._id }).sort({ createdAt: -1 });
//         res.json({ success: true, items });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── POST /api/knowledge/file ─────────────────────────────────
// exports.uploadFile = async (req, res) => {
//     const file = req.file;
//     if (!file) return res.status(400).json({ message: 'No file uploaded' });

//     const user = req.user;

//     // Plan limit check
//     const existing = await KnowledgeBase.countDocuments({
//         userId: user._id,
//         type: 'file',
//         status: 'indexed',
//     });

//     if (existing >= user.planLimits.knowledgeFiles) {
//         fs.unlinkSync(file.path);
//         return res.status(403).json({
//             message: `Plan limit: সর্বোচ্চ ${user.planLimits.knowledgeFiles}টি file index করা যাবে`,
//             upgrade: true,
//         });
//     }

//     // DB record তৈরি করো (processing status)
//     const kb = await KnowledgeBase.create({
//         userId: user._id,
//         type: 'file',
//         name: file.originalname,
//         mimeType: file.mimetype,
//         size: file.size,
//         status: 'processing',
//     });

//     // Client কে তুরন্ত respond করো
//     res.json({ success: true, item: kb, message: 'File processing started' });

//     // Background এ index করো
//     try {
//         const text = await parseFile(file.path, file.mimetype);
//         const chunkCount = await indexText(text, {
//             userId: user._id.toString(),
//             kbId: kb._id.toString(),
//             fileName: file.originalname,
//             type: 'file',
//         });

//         kb.status = 'indexed';
//         kb.chunkCount = chunkCount;
//         await kb.save();
//         console.log(`✅ Indexed file: ${file.originalname} (${chunkCount} chunks)`);
//     } catch (err) {
//         kb.status = 'failed';
//         kb.error = err.message;
//         await kb.save();
//         console.error('File indexing failed:', err.message);
//     } finally {
//         if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
//     }
// };

// // ── POST /api/knowledge/url ──────────────────────────────────
// exports.addUrl = async (req, res) => {
//     const { url } = req.body;
//     if (!url) return res.status(400).json({ message: 'URL required' });

//     const user = req.user;

//     // Plan limit check
//     const existing = await KnowledgeBase.countDocuments({
//         userId: user._id,
//         type: 'url',
//         status: 'indexed',
//     });

//     if (existing >= user.planLimits.knowledgeUrls) {
//         return res.status(403).json({
//             message: `Plan limit: সর্বোচ্চ ${user.planLimits.knowledgeUrls}টি URL add করা যাবে`,
//             upgrade: true,
//         });
//     }

//     // Duplicate check
//     const duplicate = await KnowledgeBase.findOne({ userId: user._id, name: url });
//     if (duplicate) return res.status(409).json({ message: 'এই URL আগেই indexed আছে' });

//     const kb = await KnowledgeBase.create({
//         userId: user._id,
//         type: 'url',
//         name: url,
//         status: 'processing',
//     });

//     res.json({ success: true, item: kb, message: 'URL scraping started' });

//     // Background scrape + index
//     try {
//         const { text, title } = await scrapeUrl(url);
//         const chunkCount = await indexText(text, {
//             userId: user._id.toString(),
//             kbId: kb._id.toString(),
//             url,
//             title,
//             type: 'url',
//         });

//         kb.name = `${title} (${url})`;
//         kb.status = 'indexed';
//         kb.chunkCount = chunkCount;
//         await kb.save();
//         console.log(`✅ Indexed URL: ${url} (${chunkCount} chunks)`);
//     } catch (err) {
//         kb.status = 'failed';
//         kb.error = err.message;
//         await kb.save();
//         console.error('URL indexing failed:', err.message);
//     }
// };

// // ── DELETE /api/knowledge/:kbId ──────────────────────────────
// exports.deleteItem = async (req, res) => {
//     try {
//         const kb = await KnowledgeBase.findOne({ _id: req.params.kbId, userId: req.user._id });
//         if (!kb) return res.status(404).json({ message: 'Not found' });

//         // Pinecone থেকে vectors মুছে দাও
//         if (kb.vectorIds?.length) {
//             await deleteVectors(req.user._id.toString(), kb.vectorIds);
//         }

//         await kb.deleteOne();
//         res.json({ success: true });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };







const KnowledgeBase = require('../models/KnowledgeBase.model');
const { parseFile } = require('../services/fileParser.service');
const { scrapeUrl } = require('../services/urlScraper.service');
const { indexText, deleteByKbId } = require('../services/vectorStore.service');
const fs = require('fs');

// ── GET /api/knowledge ───────────────────────────────────────
exports.getAll = async (req, res) => {
    try {
        const items = await KnowledgeBase.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, items });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── POST /api/knowledge/file ─────────────────────────────────
exports.uploadFile = async (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const user = req.user;

    // Plan limit check
    const existing = await KnowledgeBase.countDocuments({
        userId: user._id,
        type: 'file',
        status: 'indexed',
    });

    const limit = user.planLimits?.knowledgeFiles ?? 1;
    if (limit !== Infinity && existing >= limit) {
        fs.unlinkSync(file.path);
        return res.status(403).json({
            message: `Plan limit: সর্বোচ্চ ${limit}টি file index করা যাবে`,
            upgrade: true,
        });
    }

    // DB record তৈরি করো
    const kb = await KnowledgeBase.create({
        userId: user._id,
        type: 'file',
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        status: 'processing',
    });

    // Client কে তুরন্ত respond করো
    res.json({ success: true, item: kb, message: 'File uploading and indexing started...' });

    // ── Background indexing ────────────────────────────────────
    setImmediate(async () => {
        try {
            // Text extract করো
            const text = await parseFile(file.path, file.mimetype);

            if (!text || text.trim().length < 50) {
                throw new Error('File থেকে পড়ার মতো text পাওয়া যায়নি');
            }

            // Pinecone এ index করো
            // metadata তে kbId রাখো যাতে পরে delete করা যায়
            const chunkCount = await indexText(text, {
                userId: user._id.toString(),
                kbId: kb._id.toString(),
                fileName: file.originalname,
                fileType: file.mimetype,
                type: 'file',
            });

            kb.status = 'indexed';
            kb.chunkCount = chunkCount;
            await kb.save();

            console.log(`✅ File indexed: "${file.originalname}" → ${chunkCount} chunks`);
        } catch (err) {
            kb.status = 'failed';
            kb.error = err.message;
            await kb.save();
            console.error(`❌ File indexing failed: "${file.originalname}":`, err.message);
        } finally {
            // Temp file সবসময় delete করো
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
    });
};

// ── POST /api/knowledge/url ──────────────────────────────────
exports.addUrl = async (req, res) => {
    let { url } = req.body;
    if (!url?.trim()) return res.status(400).json({ message: 'URL required' });

    // URL format normalize করো
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    const user = req.user;

    // Plan limit check
    const existing = await KnowledgeBase.countDocuments({
        userId: user._id,
        type: 'url',
        status: 'indexed',
    });

    const limit = user.planLimits?.knowledgeUrls ?? 0;
    if (limit !== Infinity && existing >= limit) {
        return res.status(403).json({
            message: `Plan limit: সর্বোচ্চ ${limit}টি URL add করা যাবে`,
            upgrade: true,
        });
    }

    // Duplicate check
    const duplicate = await KnowledgeBase.findOne({
        userId: user._id,
        name: { $regex: url.replace(/https?:\/\//, ''), $options: 'i' },
    });
    if (duplicate) return res.status(409).json({ message: 'এই URL আগেই indexed আছে' });

    const kb = await KnowledgeBase.create({
        userId: user._id,
        type: 'url',
        name: url,
        status: 'processing',
    });

    res.json({ success: true, item: kb, message: 'URL scraping and indexing started...' });

    // ── Background scraping + indexing ────────────────────────
    setImmediate(async () => {
        try {
            const { text, title } = await scrapeUrl(url);

            if (!text || text.trim().length < 100) {
                throw new Error('URL থেকে পড়ার মতো content পাওয়া যায়নি');
            }

            const chunkCount = await indexText(text, {
                userId: user._id.toString(),
                kbId: kb._id.toString(),
                url,
                title: title || url,
                type: 'url',
            });

            // Name update করো title সহ
            kb.name = title ? `${title} (${url})` : url;
            kb.status = 'indexed';
            kb.chunkCount = chunkCount;
            await kb.save();

            console.log(`✅ URL indexed: "${url}" → ${chunkCount} chunks`);
        } catch (err) {
            kb.status = 'failed';
            kb.error = err.message;
            await kb.save();
            console.error(`❌ URL indexing failed: "${url}":`, err.message);
        }
    });
};

// ── DELETE /api/knowledge/:kbId ──────────────────────────────
exports.deleteItem = async (req, res) => {
    try {
        const kb = await KnowledgeBase.findOne({ _id: req.params.kbId, userId: req.user._id });
        if (!kb) return res.status(404).json({ message: 'Not found' });

        // Pinecone থেকে vectors delete করো
        if (kb.status === 'indexed') {
            await deleteByKbId(req.user._id.toString(), kb._id.toString());
        }

        await kb.deleteOne();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};