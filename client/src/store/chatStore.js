import { create } from 'zustand';
import { chatService } from '../services/chatService';

export const useChatStore = create((set, get) => ({
    // ── State ────────────────────────────────────────────────
    activeChatId: null,
    messages: [],
    history: [],       // sidebar chat list
    loading: false,
    notification: null,     // AI can't answer notification

    // ── Actions ──────────────────────────────────────────────

    // New chat শুরু করো
    newChat: () => set({ activeChatId: null, messages: [], notification: null }),

    // Notification dismiss করো
    dismissNotification: () => set({ notification: null }),

    // Chat history (sidebar) load করো
    loadHistory: async () => {
        try {
            const data = await chatService.history();
            set({ history: data.chats });
        } catch (err) {
            console.error('History load error:', err.message);
        }
    },

    // Specific chat load করো (sidebar থেকে click)
    loadChat: async (chatId) => {
        try {
            const data = await chatService.getChat(chatId);
            set({ activeChatId: chatId, messages: data.chat.messages, notification: null });
        } catch (err) {
            console.error('Chat load error:', err.message);
        }
    },

    // Message পাঠাও
    sendMessage: async ({ message, model, ragEnabled }) => {
        const { activeChatId, messages, loadHistory } = get();

        if (!message.trim() || get().loading) return;

        // Optimistic UI
        const tempUser = {
            _id: `temp-u-${Date.now()}`,
            role: 'user',
            content: message,
            createdAt: new Date(),
        };
        const tempAI = {
            _id: `temp-a-${Date.now()}`,
            role: 'assistant',
            content: '',
            loading: true,
        };

        set(state => ({
            messages: [...state.messages, tempUser, tempAI],
            loading: true,
            notification: null,
        }));

        try {
            const data = await chatService.send({
                chatId: activeChatId,
                message,
                model,
                ragEnabled,
            });

            set(state => ({
                messages: [
                    ...state.messages.filter(m => m._id !== tempAI._id),
                    data.message,
                ],
                activeChatId: data.chatId,
                loading: false,
                notification: data.cantAnswer
                    ? 'AI এই প্রশ্নের উত্তর দিতে পারেনি। Knowledge base আপডেট করুন বা human review করুন।'
                    : null,
            }));

            await loadHistory();
        } catch (err) {
            set(state => ({
                messages: state.messages.filter(m => m._id !== tempAI._id),
                loading: false,
            }));
            throw err;
        }
    },

    // AI reply correct করো
    correctMessage: async (msgId, correction) => {
        const { activeChatId } = get();
        if (!activeChatId) return;

        await chatService.correct(activeChatId, msgId, correction);

        set(state => ({
            messages: state.messages.map(m =>
                m._id === msgId ? { ...m, corrected: true, correction } : m
            ),
        }));
    },

    // Chat delete করো
    deleteChat: async (chatId) => {
        await chatService.delete(chatId);
        const { activeChatId, newChat, loadHistory } = get();
        if (chatId === activeChatId) newChat();
        await loadHistory();
    },
}));