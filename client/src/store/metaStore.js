import { create } from 'zustand';
import { metaService } from '../services/metaService';

export const useMetaStore = create((set, get) => ({
    // ── State ────────────────────────────────────────────────
    channels: [],
    messages: [],
    loading: false,
    msgFilter: '',    // '', 'pending', 'ai_replied', 'review_needed', 'human_replied'

    // ── Channels ─────────────────────────────────────────────
    loadChannels: async () => {
        set({ loading: true });
        try {
            const data = await metaService.getChannels();
            set({ channels: data.channels });
        } catch (err) {
            console.error('Meta channels load error:', err.message);
        } finally {
            set({ loading: false });
        }
    },

    addChannel: async (formData) => {
        const data = await metaService.addChannel(formData);
        await get().loadChannels();
        return data;
    },

    updateChannel: async (channelId, updates) => {
        await metaService.updateChannel(channelId, updates);
        set(state => ({
            channels: state.channels.map(c =>
                c._id === channelId ? { ...c, ...updates } : c
            ),
        }));
    },

    deleteChannel: async (channelId) => {
        await metaService.deleteChannel(channelId);
        set(state => ({
            channels: state.channels.filter(c => c._id !== channelId),
        }));
    },

    // ── Messages ─────────────────────────────────────────────
    setMsgFilter: (filter) => {
        set({ msgFilter: filter });
        get().loadMessages(filter);
    },

    loadMessages: async (filter) => {
        const f = filter !== undefined ? filter : get().msgFilter;
        try {
            const params = f ? { status: f } : {};
            const data = await metaService.getMessages(params);
            set({ messages: data.messages });
        } catch (err) {
            console.error('Meta messages load error:', err.message);
        }
    },

    humanReply: async (msgId, reply) => {
        await metaService.humanReply(msgId, reply);
        set(state => ({
            messages: state.messages.map(m =>
                m._id === msgId
                    ? { ...m, status: 'human_replied', humanReply: reply, finalReply: reply, replySent: true }
                    : m
            ),
        }));
    },

    // ── Derived ──────────────────────────────────────────────
    getStats: () => {
        const { channels, messages } = get();
        const aiReplied = messages.filter(m => m.status === 'ai_replied').length;
        return {
            totalChannels: channels.length,
            totalMessages: messages.length,
            needReview: messages.filter(m => m.status === 'review_needed').length,
            aiReplied,
            aiRate: messages.length ? Math.round((aiReplied / messages.length) * 100) : 0,
        };
    },
}));