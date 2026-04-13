// const { OpenAIEmbeddings } = require('@langchain/openai');
// const { PineconeStore } = require('@langchain/pinecone');
// const { Pinecone } = require('@pinecone-database/pinecone');
// // const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');

// const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');

// let _pinecone = null;

// const getPinecone = () => {
//     if (!_pinecone) {
//         _pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
//     }
//     return _pinecone;
// };

// const getEmbeddings = () => new OpenAIEmbeddings({
//     openAIApiKey: process.env.OPENAI_API_KEY,
//     modelName: 'text-embedding-3-small',
// });

// // Text → chunks → Pinecone এ index করো
// // metadata এ userId (namespace এর জন্য), kbId, fileName/url থাকবে
// const indexText = async (text, metadata) => {
//     const splitter = new RecursiveCharacterTextSplitter({
//         chunkSize: 1000,
//         chunkOverlap: 200,
//     });

//     const docs = await splitter.createDocuments([text], [metadata]);

//     const pinecone = getPinecone();
//     const index = pinecone.Index(process.env.PINECONE_INDEX);
//     const embeddings = getEmbeddings();

//     await PineconeStore.fromDocuments(docs, embeddings, {
//         pineconeIndex: index,
//         namespace: metadata.userId,   // প্রতি user আলাদা namespace
//     });

//     return docs.length; // total chunks indexed
// };

// // Query → similar docs খোঁজো user এর namespace থেকে
// const searchSimilar = async (query, userId, topK = 4) => {
//     const pinecone = getPinecone();
//     const index = pinecone.Index(process.env.PINECONE_INDEX);
//     const embeddings = getEmbeddings();

//     const store = await PineconeStore.fromExistingIndex(embeddings, {
//         pineconeIndex: index,
//         namespace: userId,
//     });

//     const results = await store.similaritySearchWithScore(query, topK);

//     // Score threshold 0.7 — এর নিচে relevant না
//     return results
//         .filter(([, score]) => score > 0.7)
//         .map(([doc, score]) => ({
//             content: doc.pageContent,
//             metadata: doc.metadata,
//             score,
//         }));
// };

// // KB item delete করলে Pinecone থেকেও vectors সরাও
// const deleteVectors = async (userId, vectorIds) => {
//     if (!vectorIds?.length) return;
//     const pinecone = getPinecone();
//     const index = pinecone.Index(process.env.PINECONE_INDEX);
//     await index.namespace(userId).deleteMany(vectorIds);
// };

// module.exports = { indexText, searchSimilar, deleteVectors };


const { OpenAIEmbeddings } = require('@langchain/openai');
const { PineconeStore } = require('@langchain/pinecone');
const { Pinecone } = require('@pinecone-database/pinecone');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { Document } = require('@langchain/core/documents');

// ── Singletons ────────────────────────────────────────────────
let _pinecone = null;
let _embeddings = null;

const getPinecone = () => {
    if (!_pinecone) {
        _pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    }
    return _pinecone;
};

const getEmbeddings = () => {
    if (!_embeddings) {
        _embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: 'text-embedding-3-small',
            batchSize: 512,
        });
    }
    return _embeddings;
};

// ── Text index করো ───────────────────────────────────────────
const indexText = async (text, metadata) => {
    if (!text || text.trim().length < 50) {
        throw new Error('Text too short to index (minimum 50 chars)');
    }

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 150,
        separators: ['\n\n', '\n', '. ', '। ', ' ', ''],
    });

    const rawChunks = await splitter.splitText(text);
    const validChunks = rawChunks.filter(c => c.trim().length > 20);

    if (validChunks.length === 0) throw new Error('No valid chunks generated');

    const docs = validChunks.map((chunk, i) =>
        new Document({
            pageContent: chunk,
            metadata: { ...metadata, chunkIndex: i, totalChunks: validChunks.length },
        })
    );

    const index = getPinecone().Index(process.env.PINECONE_INDEX);
    const namespace = `user-${metadata.userId}`;

    await PineconeStore.fromDocuments(docs, getEmbeddings(), {
        pineconeIndex: index,
        namespace,
        maxConcurrency: 5,
    });

    console.log(`✅ Indexed ${validChunks.length} chunks → namespace: ${namespace}`);
    return validChunks.length;
};

// ── Similar docs search ───────────────────────────────────────
const searchSimilar = async (query, userId, topK = 5) => {
    if (!query || query.trim().length < 3) return [];

    try {
        const index = getPinecone().Index(process.env.PINECONE_INDEX);
        const namespace = `user-${userId}`;

        // Namespace এ data আছে কিনা check করো
        const stats = await index.describeIndexStats();
        const nsStats = stats.namespaces?.[namespace];
        if (!nsStats || nsStats.recordCount === 0) return [];

        const store = await PineconeStore.fromExistingIndex(getEmbeddings(), {
            pineconeIndex: index,
            namespace,
        });

        const results = await store.similaritySearchWithScore(query, topK);

        return results
            .filter(([, score]) => score >= 0.25)
            .map(([doc, score]) => ({
                content: doc.pageContent,
                metadata: doc.metadata,
                score: Math.round(score * 100) / 100,
            }));
    } catch (err) {
        console.error('Vector search error:', err.message);
        return [];
    }
};

// ── kbId এর vectors delete করো ───────────────────────────────
const deleteByKbId = async (userId, kbId) => {
    try {
        const index = getPinecone().Index(process.env.PINECONE_INDEX);
        const namespace = `user-${userId}`;
        await index.namespace(namespace).deleteMany({ filter: { kbId: { $eq: kbId } } });
        console.log(`🗑️  Deleted vectors for kbId: ${kbId}`);
    } catch (err) {
        console.error('Delete by kbId error:', err.message);
    }
};

// ── Namespace সম্পূর্ণ clear করো ─────────────────────────────
const deleteNamespace = async (userId) => {
    const index = getPinecone().Index(process.env.PINECONE_INDEX);
    const namespace = `user-${userId}`;
    await index.namespace(namespace).deleteAll();
};

module.exports = { indexText, searchSimilar, deleteByKbId, deleteNamespace };