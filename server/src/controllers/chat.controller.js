// const Chat = require('../models/Chat.model');
// const { sendMessage: ragSend } = require('../services/langchain.service');

// // ── POST /api/chat/send ──────────────────────────────────────
// exports.sendMessage = async (req, res) => {
//     try {
//         const { chatId, message, model, ragEnabled = true } = req.body;
//         const user = req.user;

//         if (!message?.trim()) {
//             return res.status(400).json({ message: 'Message is required' });
//         }

//         // Usage বাড়াও
//         user.usage.messagesThisMonth += 1;
//         user.usage.totalMessages += 1;
//         await user.save();

//         // Chat session খোঁজো বা নতুন তৈরি করো
//         let chat;
//         if (chatId) {
//             chat = await Chat.findOne({ _id: chatId, userId: user._id });
//             if (!chat) return res.status(404).json({ message: 'Chat not found' });
//         } else {
//             chat = new Chat({
//                 userId: user._id,
//                 title: message.substring(0, 60),
//                 model: model || user.preferences.defaultModel || 'gpt-4o',
//                 ragEnabled,
//             });
//         }

//         // User message save
//         chat.messages.push({ role: 'user', content: message });

//         // Custom LLM provider check
//         let customProvider = null;
//         const builtinModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo', 'claude-3-5-sonnet'];
//         if (model && !builtinModels.includes(model)) {
//             customProvider = user.llmProviders.find(
//                 p => p.name === model || p.model === model
//             );
//         }

//         // RAG enabled শুধু plan এ allow থাকলে
//         const useRag = ragEnabled && user.planLimits.knowledgeFiles > 0;

//         // AI reply generate করো
//         const { answer, sources, ragUsed, cantAnswer } = await ragSend({
//             userMessage: message,
//             chatHistory: chat.messages.slice(-20),
//             userId: user._id.toString(),
//             model: model || chat.model,
//             ragEnabled: useRag,
//             customProvider,
//         });

//         // AI message save
//         const aiMessage = { role: 'assistant', content: answer, sources };
//         chat.messages.push(aiMessage);
//         await chat.save();

//         const savedMsg = chat.messages[chat.messages.length - 1];

//         res.json({
//             success: true,
//             chatId: chat._id,
//             message: {
//                 id: savedMsg._id,
//                 role: 'assistant',
//                 content: answer,
//                 sources,
//                 ragUsed,
//                 createdAt: savedMsg.createdAt,
//             },
//             cantAnswer,
//             usage: {
//                 used: user.usage.messagesThisMonth,
//                 limit: user.planLimits.messagesPerMonth,
//             },
//         });
//     } catch (err) {
//         console.error('Chat send error:', err.message);
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── GET /api/chat/history ────────────────────────────────────
// exports.getChatHistory = async (req, res) => {
//     try {
//         const chats = await Chat.find({ userId: req.user._id })
//             .select('title model ragEnabled updatedAt createdAt')
//             .sort({ updatedAt: -1 })
//             .limit(50);

//         res.json({ success: true, chats });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── GET /api/chat/:chatId ────────────────────────────────────
// exports.getChat = async (req, res) => {
//     try {
//         const chat = await Chat.findOne({ _id: req.params.chatId, userId: req.user._id });
//         if (!chat) return res.status(404).json({ message: 'Chat not found' });
//         res.json({ success: true, chat });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── DELETE /api/chat/:chatId ─────────────────────────────────
// exports.deleteChat = async (req, res) => {
//     try {
//         await Chat.deleteOne({ _id: req.params.chatId, userId: req.user._id });
//         res.json({ success: true });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // ── PATCH /api/chat/:chatId/message/:messageId/correct ───────
// exports.correctMessage = async (req, res) => {
//     try {
//         const { correction } = req.body;
//         const chat = await Chat.findOne({ _id: req.params.chatId, userId: req.user._id });
//         if (!chat) return res.status(404).json({ message: 'Chat not found' });

//         const msg = chat.messages.id(req.params.messageId);
//         if (!msg) return res.status(404).json({ message: 'Message not found' });

//         msg.corrected = true;
//         msg.correction = correction;
//         await chat.save();

//         res.json({ success: true });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };







const Chat = require('../models/Chat.model');
const { sendMessage: ragSend } = require('../services/langchain.service');

// ── POST /api/chat/send ──────────────────────────────────────
exports.sendMessage = async (req, res) => {
    try {
        const { chatId, message, model, ragEnabled = true } = req.body;
        const user = req.user;

        if (!message?.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // ── Chat session খোঁজো বা নতুন তৈরি করো ──────────────
        let chat;

        if (chatId) {
            // Existing chat — history সহ load করো
            chat = await Chat.findOne({ _id: chatId, userId: user._id });
            if (!chat) return res.status(404).json({ message: 'Chat not found' });
        } else {
            // New chat session
            chat = new Chat({
                userId: user._id,
                title: message.substring(0, 60).replace(/\n/g, ' '),
                model: model || user.preferences?.defaultModel || 'gpt-4o',
                ragEnabled: ragEnabled,
            });
        }

        // ── User message save করো (AI call এর আগে) ───────────
        chat.messages.push({ role: 'user', content: message });

        // ── Custom LLM provider check ──────────────────────────
        let customProvider = null;
        const builtinModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo', 'claude-3-5-sonnet'];
        const selectedModel = model || chat.model;

        if (!builtinModels.includes(selectedModel)) {
            customProvider = user.llmProviders?.find(
                p => p.name === selectedModel || p.model === selectedModel
            ) || null;
        }

        // ── RAG use করা যাবে কিনা plan check ─────────────────
        const useRag = ragEnabled && (user.planLimits?.knowledgeFiles || 0) > 0;

        // ── AI history: নতুন user message বাদে বাকি সব পাঠাও ──
        // শেষ message টা (এইমাত্র push করা user message) বাদ দাও
        // কারণ langchain.service এ userMessage separately দেওয়া হয়
        const historyForAI = chat.messages
            .slice(0, -1)   // শেষেরটা বাদ দাও
            .filter(m => m.role === 'user' || m.role === 'assistant');

        // ── LangChain call করো ────────────────────────────────
        // const { answer, sources, ragUsed, cantAnswer } = await ragSend({
        //     userMessage: message,
        //     chatHistory: historyForAI,   // ← পুরো history (new msg বাদে)
        //     userId: user._id.toString(),
        //     model: selectedModel,
        //     ragEnabled: useRag,
        //     customProvider,
        // });


        // ── LangChain call করো ────────────────────────────────────
        const { answer, sources, ragUsed, cantAnswer } = await ragSend({
            userMessage: message,
            chatHistory: historyForAI,   // ← পুরো history (new msg বাদে)
            userId: user._id.toString(),
            userProfile: {
                name: user.name,
                plan: user.effectivePlan,
            },
            model: selectedModel,
            ragEnabled: useRag,
            customProvider,
        });

        // ── AI message save করো ───────────────────────────────
        chat.messages.push({
            role: 'assistant',
            content: answer,
            sources,
        });

        await chat.save();

        // ── Usage count বাড়াও ────────────────────────────────
        user.usage.messagesThisMonth += 1;
        user.usage.totalMessages += 1;
        await user.save();

        const savedMsg = chat.messages[chat.messages.length - 1];

        res.json({
            success: true,
            chatId: chat._id,
            message: {
                id: savedMsg._id,
                role: 'assistant',
                content: answer,
                sources,
                ragUsed,
                createdAt: savedMsg.createdAt,
            },
            cantAnswer,
            usage: {
                used: user.usage.messagesThisMonth,
                limit: user.planLimits?.messagesPerMonth,
            },
        });
    } catch (err) {
        console.error('Chat send error:', err.message);
        res.status(500).json({ message: err.message });
    }
};

// ── GET /api/chat/history ────────────────────────────────────
exports.getChatHistory = async (req, res) => {
    try {
        const chats = await Chat.find({ userId: req.user._id })
            .select('title model ragEnabled updatedAt createdAt')
            .sort({ updatedAt: -1 })
            .limit(50);

        res.json({ success: true, chats });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── GET /api/chat/:chatId ────────────────────────────────────
exports.getChat = async (req, res) => {
    try {
        const chat = await Chat.findOne({ _id: req.params.chatId, userId: req.user._id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        res.json({ success: true, chat });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── DELETE /api/chat/:chatId ─────────────────────────────────
exports.deleteChat = async (req, res) => {
    try {
        await Chat.deleteOne({ _id: req.params.chatId, userId: req.user._id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── PATCH /api/chat/:chatId/message/:messageId/correct ───────
exports.correctMessage = async (req, res) => {
    try {
        const { correction } = req.body;
        if (!correction?.trim()) {
            return res.status(400).json({ message: 'correction text required' });
        }

        const chat = await Chat.findOne({ _id: req.params.chatId, userId: req.user._id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        const msg = chat.messages.id(req.params.messageId);
        if (!msg) return res.status(404).json({ message: 'Message not found' });

        msg.corrected = true;
        msg.correction = correction;
        await chat.save();

        res.json({ success: true, message: 'Correction saved' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};