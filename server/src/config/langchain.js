// const { ChatOpenAI } = require('@langchain/openai');
// const { ChatAnthropic } = require('@langchain/anthropic');

// // Built-in model map
// const MODEL_MAP = {
//     'gpt-4o': () => new ChatOpenAI({ modelName: 'gpt-4o', temperature: 0.7, openAIApiKey: process.env.OPENAI_API_KEY }),
//     'gpt-4o-mini': () => new ChatOpenAI({ modelName: 'gpt-4o-mini', temperature: 0.7, openAIApiKey: process.env.OPENAI_API_KEY }),
//     'gpt-3.5-turbo': () => new ChatOpenAI({ modelName: 'gpt-3.5-turbo', temperature: 0.7, openAIApiKey: process.env.OPENAI_API_KEY }),
//     'claude-3-5-sonnet': () => new ChatAnthropic({ modelName: 'claude-3-5-sonnet-20241022', temperature: 0.7, anthropicApiKey: process.env.ANTHROPIC_API_KEY }),
// };

// // Built-in model থেকে LLM তৈরি করো
// const getLLM = (modelName = 'gpt-4o') => {
//     const factory = MODEL_MAP[modelName];
//     if (!factory) {
//         console.warn(`Model "${modelName}" not in map — using gpt-4o`);
//         return MODEL_MAP['gpt-4o']();
//     }
//     return factory();
// };

// // User এর custom API key দিয়ে LLM তৈরি করো
// const getCustomLLM = (provider) => {
//     return new ChatOpenAI({
//         modelName: provider.model || 'gpt-4o',
//         temperature: 0.7,
//         openAIApiKey: provider.apiKey,
//         // OpenAI-compatible custom endpoint (Mistral, Groq, etc.)
//         ...(provider.baseUrl && {
//             configuration: { baseURL: provider.baseUrl },
//         }),
//     });
// };

// module.exports = { getLLM, getCustomLLM };



// LangChain config — available models এবং validation

const AVAILABLE_MODELS = [
    { id: 'gpt-4o', provider: 'openai', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', provider: 'openai', label: 'GPT-4o Mini' },
    { id: 'gpt-3.5-turbo', provider: 'openai', label: 'GPT-3.5 Turbo' },
    { id: 'claude-3-5-sonnet', provider: 'anthropic', label: 'Claude 3.5 Sonnet' },
];

// Model টি available কিনা check করো
const isValidModel = (modelId) => {
    return AVAILABLE_MODELS.some(m => m.id === modelId);
};

// Model এর provider কী
const getModelProvider = (modelId) => {
    const model = AVAILABLE_MODELS.find(m => m.id === modelId);
    return model?.provider || 'openai';
};

// API key আছে কিনা check করো
const checkApiKeys = () => {
    const missing = [];
    if (!process.env.OPENAI_API_KEY) missing.push('OPENAI_API_KEY');
    if (!process.env.PINECONE_API_KEY) missing.push('PINECONE_API_KEY');
    if (!process.env.PINECONE_INDEX) missing.push('PINECONE_INDEX');

    if (missing.length > 0) {
        console.warn(`⚠️  Missing env vars: ${missing.join(', ')}`);
    }
    return missing;
};

module.exports = { AVAILABLE_MODELS, isValidModel, getModelProvider, checkApiKeys };