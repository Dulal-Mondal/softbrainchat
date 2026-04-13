// const { HumanMessage, AIMessage, SystemMessage } = require('@langchain/core/messages');
// const { getLLM, getCustomLLM } = require('../config/langchain');
// const { searchSimilar } = require('./vectorStore.service');

// const SYSTEM_PROMPT = `তুমি SoftBrainChat AI assistant।
// তোমার কাজ হলো user এর business সংক্রান্ত প্রশ্নের সঠিক উত্তর দেওয়া।
// যদি provided context থেকে উত্তর পাও, সেটা ব্যবহার করো এবং accurate তথ্য দাও।
// যদি context থেকে উত্তর খুঁজে না পাও, বলো: "আমার কাছে এই তথ্য নেই।"
// সবসময় helpful, accurate এবং concise থাকো। বাংলা বা English — user যে ভাষায় জিজ্ঞেস করে সেই ভাষায় উত্তর দাও।`;

// const sendMessage = async ({
//     userMessage,
//     chatHistory = [],
//     userId,
//     model = 'gpt-4o',
//     ragEnabled = true,
//     customProvider = null,
// }) => {
//     // ── 1. LLM তৈরি করো ──────────────────────────────────────
//     const llm = customProvider ? getCustomLLM(customProvider) : getLLM(model);

//     // ── 2. RAG context খোঁজো ─────────────────────────────────
//     let context = '';
//     let sources = [];
//     let ragUsed = false;

//     if (ragEnabled && userId) {
//         try {
//             const results = await searchSimilar(userMessage, userId, 4);
//             if (results.length > 0) {
//                 ragUsed = true;
//                 sources = results.map(r => ({
//                     file: r.metadata.fileName || null,
//                     url: r.metadata.url || null,
//                     excerpt: r.content.substring(0, 180),
//                 }));
//                 context = results.map(r => r.content).join('\n\n---\n\n');
//             }
//         } catch (err) {
//             console.warn('RAG search failed:', err.message);
//         }
//     }

//     // ── 3. System prompt তৈরি করো ────────────────────────────
//     const systemContent = context
//         ? `${SYSTEM_PROMPT}\n\n=== Knowledge Base Context ===\n${context}\n=== End Context ===`
//         : SYSTEM_PROMPT;

//     // ── 4. Messages array তৈরি করো ───────────────────────────
//     const messages = [
//         new SystemMessage(systemContent),
//         // শেষ ১০টা chat history
//         ...chatHistory.slice(-10).map(m =>
//             m.role === 'user'
//                 ? new HumanMessage(m.content)
//                 : new AIMessage(m.content)
//         ),
//         new HumanMessage(userMessage),
//     ];

//     // ── 5. LLM call করো ──────────────────────────────────────
//     const response = await llm.invoke(messages);
//     const answer = response.content;

//     // ── 6. AI উত্তর দিতে পারেছে কিনা check করো ──────────────
//     const cantAnswer =
//         answer.toLowerCase().includes('আমার কাছে এই তথ্য নেই') ||
//         answer.toLowerCase().includes("i don't have") ||
//         answer.toLowerCase().includes('i cannot find') ||
//         answer.toLowerCase().includes('i do not have information');

//     return { answer, sources, ragUsed, cantAnswer };
// };

// module.exports = { sendMessage };



// const { ChatOpenAI } = require('@langchain/openai');
// const { ChatAnthropic } = require('@langchain/anthropic');
// const {
//     HumanMessage,
//     AIMessage,
//     SystemMessage,
// } = require('@langchain/core/messages');
// const { searchSimilar } = require('./vectorStore.service');

// // ── LLM Factory ───────────────────────────────────────────────
// const BUILTIN_MODELS = {
//     'gpt-4o': (key) =>
//         new ChatOpenAI({ modelName: 'gpt-4o', temperature: 0.7, openAIApiKey: key }),
//     'gpt-4o-mini': (key) =>
//         new ChatOpenAI({ modelName: 'gpt-4o-mini', temperature: 0.7, openAIApiKey: key }),
//     'gpt-3.5-turbo': (key) =>
//         new ChatOpenAI({ modelName: 'gpt-3.5-turbo', temperature: 0.7, openAIApiKey: key }),
//     'claude-3-5-sonnet': (key) =>
//         new ChatAnthropic({ modelName: 'claude-3-5-sonnet-20241022', temperature: 0.7, anthropicApiKey: key }),
// };

// const getLLM = (modelName = 'gpt-4o', customProvider = null) => {
//     // Custom provider (user এর নিজের API key)
//     if (customProvider?.apiKey) {
//         return new ChatOpenAI({
//             modelName: customProvider.model || 'gpt-4o',
//             temperature: 0.7,
//             openAIApiKey: customProvider.apiKey,
//             ...(customProvider.baseUrl && {
//                 configuration: { baseURL: customProvider.baseUrl },
//             }),
//         });
//     }

//     // Built-in model
//     const factory = BUILTIN_MODELS[modelName];
//     if (!factory) {
//         console.warn(`Model "${modelName}" not found, using gpt-4o`);
//         return BUILTIN_MODELS['gpt-4o'](process.env.OPENAI_API_KEY);
//     }

//     // Correct API key select করো
//     const apiKey = modelName.startsWith('claude')
//         ? process.env.ANTHROPIC_API_KEY
//         : process.env.OPENAI_API_KEY;

//     return factory(apiKey);
// };

// // ── System Prompt ─────────────────────────────────────────────
// const buildSystemPrompt = (context, hasContext) => {
//     const base = `তুমি SoftBrainChat AI assistant। তুমি সবসময় helpful, accurate এবং friendly।

// নিচের rules follow করো:
// - User যে ভাষায় কথা বলে সেই ভাষায় উত্তর দাও (বাংলা বা English)
// - Markdown format ব্যবহার করো সুন্দর formatting এর জন্য
// - Short এবং precise উত্তর দাও, প্রয়োজনে বিস্তারিত বলো`;

//     if (!hasContext) {
//         return base + `\n\n- যদি Knowledge Base তথ্য না থাকে, সাধারণ জ্ঞান থেকে উত্তর দাও
// - কিন্তু যদি কোনো specific business information জিজ্ঞেস করে যা তোমার কাছে নেই, সৎভাবে বলো: "আমার কাছে এই তথ্য নেই। Knowledge Base এ যোগ করুন।"`;
//     }

//     return base + `

// তোমার কাছে নিচের Knowledge Base context আছে। এটা থেকে accurate উত্তর দাও:

// === KNOWLEDGE BASE ===
// ${context}
// === END ===

// Rules:
// - উপরের context থেকে relevant তথ্য দিয়ে উত্তর দাও
// - Context এ উত্তর না পেলে বলো: "আমার কাছে এই তথ্য নেই।"
// - Context থেকে quote করলে সেটা clearly বলো
// - নিজে থেকে তথ্য fabricate করবে না`;
// };

// // ── Chat history → LangChain messages format ──────────────────
// // এইটাই সবচেয়ে গুরুত্বপূর্ণ — history ঠিকমতো format না হলে AI মনে রাখে না
// const formatHistory = (chatHistory) => {
//     if (!chatHistory || chatHistory.length === 0) return [];

//     // System message বাদ দাও, শুধু user/assistant messages নাও
//     const filtered = chatHistory.filter(
//         m => m.role === 'user' || m.role === 'assistant'
//     );

//     // শেষ 10 pair (20 messages) রাখো — context window overflow prevent করতে
//     const recent = filtered.slice(-20);

//     return recent.map(m => {
//         if (m.role === 'user') {
//             return new HumanMessage(m.content);
//         }
//         // Corrected version থাকলে সেটাই use করো (AI কে সঠিক শেখাতে)
//         const content = m.correction || m.content;
//         return new AIMessage(content);
//     });
// };

// // ── Main: AI reply generate করো ──────────────────────────────
// const sendMessage = async ({
//     userMessage,
//     chatHistory = [],
//     userId,
//     model = 'gpt-4o',
//     ragEnabled = true,
//     customProvider = null,
// }) => {
//     // ── Step 1: LLM তৈরি করো ────────────────────────────────
//     const llm = getLLM(model, customProvider);

//     // ── Step 2: RAG — Knowledge Base থেকে context খোঁজো ────
//     let context = '';
//     let sources = [];
//     let ragUsed = false;

//     if (ragEnabled && userId) {
//         try {
//             const results = await searchSimilar(userMessage, userId, 5);

//             if (results.length > 0) {
//                 ragUsed = true;

//                 // Context তৈরি করো — প্রতিটি chunk আলাদা করে দাও
//                 context = results
//                     .map((r, i) => {
//                         const source = r.metadata?.fileName || r.metadata?.url || r.metadata?.title || 'Document';
//                         return `[Source ${i + 1}: ${source}]\n${r.content}`;
//                     })
//                     .join('\n\n---\n\n');

//                 // Sources array তৈরি করো client এ দেখাতে
//                 sources = results.map(r => ({
//                     file: r.metadata?.fileName || null,
//                     url: r.metadata?.url || null,
//                     excerpt: r.content.substring(0, 200) + (r.content.length > 200 ? '...' : ''),
//                     score: r.score,
//                 }));

//                 console.log(`📚 RAG: Found ${results.length} relevant chunks (user: ${userId})`);
//             } else {
//                 console.log(`📭 RAG: No relevant chunks found (user: ${userId})`);
//             }
//         } catch (err) {
//             console.error('RAG search failed:', err.message);
//             // RAG fail হলেও chat চালু রাখো
//         }
//     }

//     // ── Step 3: Messages array তৈরি করো ─────────────────────
//     const systemPrompt = buildSystemPrompt(context, ragUsed);
//     const historyMessages = formatHistory(chatHistory);

//     const messages = [
//         new SystemMessage(systemPrompt),
//         ...historyMessages,            // ← পুরো conversation history এখানে
//         new HumanMessage(userMessage), // ← নতুন user message সবার শেষে
//     ];

//     // ── Step 4: LLM call করো ────────────────────────────────
//     console.log(`🤖 LLM: ${model} | RAG: ${ragUsed} | History: ${historyMessages.length} msgs`);

//     const response = await llm.invoke(messages);
//     const answer = response.content;

//     // ── Step 5: AI উত্তর দিতে পেরেছে কিনা check করো ────────
//     const noAnswerPhrases = [
//         'আমার কাছে এই তথ্য নেই',
//         'knowledge base এ যোগ করুন',
//         "i don't have",
//         'i cannot find',
//         'i do not have information',
//         'not in my knowledge',
//     ];

//     const cantAnswer = noAnswerPhrases.some(phrase =>
//         answer.toLowerCase().includes(phrase.toLowerCase())
//     );

//     return { answer, sources, ragUsed, cantAnswer };
// };

// module.exports = { sendMessage };












const { ChatOpenAI } = require('@langchain/openai');
const { ChatAnthropic } = require('@langchain/anthropic');
const {
    HumanMessage,
    AIMessage,
    SystemMessage,
} = require('@langchain/core/messages');
const { searchSimilar } = require('./vectorStore.service');

// ── LLM Factory ───────────────────────────────────────────────
const BUILTIN_MODELS = {
    'gpt-4o': (key) =>
        new ChatOpenAI({ modelName: 'gpt-4o', temperature: 0.7, openAIApiKey: key }),
    'gpt-4o-mini': (key) =>
        new ChatOpenAI({ modelName: 'gpt-4o-mini', temperature: 0.7, openAIApiKey: key }),
    'gpt-3.5-turbo': (key) =>
        new ChatOpenAI({ modelName: 'gpt-3.5-turbo', temperature: 0.7, openAIApiKey: key }),
    'claude-3-5-sonnet': (key) =>
        new ChatAnthropic({ modelName: 'claude-3-5-sonnet-20241022', temperature: 0.7, anthropicApiKey: key }),
};

const getLLM = (modelName = 'gpt-4o', customProvider = null) => {
    if (customProvider?.apiKey) {
        return new ChatOpenAI({
            modelName: customProvider.model || 'gpt-4o',
            temperature: 0.7,
            openAIApiKey: customProvider.apiKey,
            ...(customProvider.baseUrl && {
                configuration: { baseURL: customProvider.baseUrl },
            }),
        });
    }

    const factory = BUILTIN_MODELS[modelName];
    if (!factory) {
        console.warn(`Model "${modelName}" not found, using gpt-4o`);
        return BUILTIN_MODELS['gpt-4o'](process.env.OPENAI_API_KEY);
    }

    const apiKey = modelName.startsWith('claude')
        ? process.env.ANTHROPIC_API_KEY
        : process.env.OPENAI_API_KEY;

    return factory(apiKey);
};

// ── System Prompt ─────────────────────────────────────────────
const buildSystemPrompt = (context, hasContext, userProfile) => {
    // ✅ User info যোগ করো
    const userInfo = userProfile
        ? `\n\nUser Information:\n- Name: ${userProfile.name}\n- Plan: ${userProfile.plan}`
        : '';

    const base = `তুমি SoftBrainChat AI assistant। তুমি সবসময় helpful, accurate এবং friendly।${userInfo}

নিচের rules follow করো:
- User যে ভাষায় কথা বলে সেই ভাষায় উত্তর দাও (বাংলা বা English)
- Markdown format ব্যবহার করো সুন্দর formatting এর জন্য
- Short এবং precise উত্তর দাও, প্রয়োজনে বিস্তারিত বলো
- User এর নাম জানলে personally address করো`;

    if (!hasContext) {
        return base + `\n\n- যদি Knowledge Base তথ্য না থাকে, সাধারণ জ্ঞান থেকে উত্তর দাও
- কিন্তু যদি কোনো specific business information জিজ্ঞেস করে যা তোমার কাছে নেই, সৎভাবে বলো: "আমার কাছে এই তথ্য নেই। Knowledge Base এ যোগ করুন।"`;
    }

    return base + `

তোমার কাছে নিচের Knowledge Base context আছে। এটা থেকে accurate উত্তর দাও:

=== KNOWLEDGE BASE ===
${context}
=== END ===

Rules:
- উপরের context থেকে relevant তথ্য দিয়ে উত্তর দাও
- Context এ উত্তর না পেলে বলো: "আমার কাছে এই তথ্য নেই।"
- Context থেকে quote করলে সেটা clearly বলো
- নিজে থেকে তথ্য fabricate করবে না`;
};

// ── Chat history → LangChain messages format ──────────────────
const formatHistory = (chatHistory) => {
    if (!chatHistory || chatHistory.length === 0) return [];

    const filtered = chatHistory.filter(
        m => m.role === 'user' || m.role === 'assistant'
    );

    const recent = filtered.slice(-20);

    return recent.map(m => {
        if (m.role === 'user') return new HumanMessage(m.content);
        const content = m.correction || m.content;
        return new AIMessage(content);
    });
};

// ── Main: AI reply generate করো ──────────────────────────────
const sendMessage = async ({
    userMessage,
    chatHistory = [],
    userId,
    userProfile = null,        // ✅ নতুন parameter
    model = 'gpt-4o',
    ragEnabled = true,
    customProvider = null,
}) => {
    const llm = getLLM(model, customProvider);

    let context = '';
    let sources = [];
    let ragUsed = false;

    if (ragEnabled && userId) {
        try {
            const results = await searchSimilar(userMessage, userId, 5);

            if (results.length > 0) {
                ragUsed = true;

                context = results
                    .map((r, i) => {
                        const source = r.metadata?.fileName || r.metadata?.url || r.metadata?.title || 'Document';
                        return `[Source ${i + 1}: ${source}]\n${r.content}`;
                    })
                    .join('\n\n---\n\n');

                sources = results.map(r => ({
                    file: r.metadata?.fileName || null,
                    url: r.metadata?.url || null,
                    excerpt: r.content.substring(0, 200) + (r.content.length > 200 ? '...' : ''),
                    score: r.score,
                }));

                console.log(`📚 RAG: Found ${results.length} relevant chunks (user: ${userId})`);
            } else {
                console.log(`📭 RAG: No relevant chunks found (user: ${userId})`);
            }
        } catch (err) {
            console.error('RAG search failed:', err.message);
        }
    }

    // ✅ userProfile pass করো
    const systemPrompt = buildSystemPrompt(context, ragUsed, userProfile);
    const historyMessages = formatHistory(chatHistory);

    const messages = [
        new SystemMessage(systemPrompt),
        ...historyMessages,
        new HumanMessage(userMessage),
    ];

    console.log(`🤖 LLM: ${model} | RAG: ${ragUsed} | History: ${historyMessages.length} msgs`);

    const response = await llm.invoke(messages);
    const answer = response.content;

    const noAnswerPhrases = [
        'আমার কাছে এই তথ্য নেই',
        'knowledge base এ যোগ করুন',
        "i don't have",
        'i cannot find',
        'i do not have information',
        'not in my knowledge',
    ];

    const cantAnswer = noAnswerPhrases.some(phrase =>
        answer.toLowerCase().includes(phrase.toLowerCase())
    );

    return { answer, sources, ragUsed, cantAnswer };
};

module.exports = { sendMessage };