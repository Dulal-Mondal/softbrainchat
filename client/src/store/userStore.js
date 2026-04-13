import { create } from 'zustand';
import api from '../services/api';

export const useUserStore = create((set, get) => ({
    // ── State ────────────────────────────────────────────────
    profile: null,    // MongoDB user object
    loading: false,
    initialized: false,

    // ── Load profile from server ──────────────────────────────
    loadProfile: async () => {
        set({ loading: true });
        try {
            const data = await api.get('/auth/me');
            set({ profile: data.user, initialized: true });
        } catch (err) {
            console.error('Profile load error:', err.message);
        } finally {
            set({ loading: false });
        }
    },

    // ── Clear on logout ───────────────────────────────────────
    clearProfile: () => set({ profile: null, initialized: false }),

    // ── Update name/photo ─────────────────────────────────────
    updateProfile: async ({ name, photo }) => {
        await api.patch('/auth/profile', { name, photo });
        set(state => ({
            profile: state.profile ? { ...state.profile, name: name || state.profile.name, photo: photo || state.profile.photo } : state.profile,
        }));
    },

    // ── Update preferences (theme, defaultModel, language) ────
    updatePreferences: async (prefs) => {
        await api.patch('/auth/preferences', prefs);
        set(state => ({
            profile: state.profile
                ? { ...state.profile, preferences: { ...state.profile.preferences, ...prefs } }
                : state.profile,
        }));
    },

    // ── Add custom LLM provider ───────────────────────────────
    addLLMProvider: async ({ name, apiKey, model, baseUrl }) => {
        const data = await api.post('/auth/llm-provider', { name, apiKey, model, baseUrl });
        // Server থেকে refresh করো (apiKey safe করে)
        await get().loadProfile();
        return data;
    },

    // ── Remove custom LLM provider ────────────────────────────
    removeLLMProvider: async (providerId) => {
        await api.delete(`/auth/llm-provider/${providerId}`);
        set(state => ({
            profile: state.profile
                ? {
                    ...state.profile,
                    llmProviders: state.profile.llmProviders.filter(p => p.id !== providerId),
                }
                : state.profile,
        }));
    },

    // ── Convenience getters ───────────────────────────────────
    get effectivePlan() {
        return get().profile?.effectivePlan || 'free';
    },

    get planLimits() {
        return get().profile?.planLimits || {};
    },

    get usage() {
        return get().profile?.usage || { messagesThisMonth: 0 };
    },

    get isAdmin() {
        return get().profile?.role === 'admin';
    },
}));