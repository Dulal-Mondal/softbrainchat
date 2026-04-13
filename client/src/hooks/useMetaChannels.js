import { useState, useCallback, useEffect } from 'react';
import { metaService } from '../services/metaService';
import toast from 'react-hot-toast';

export function useMetaChannels({ autoLoad = true } = {}) {
    const [channels, setChannels] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msgFilter, setMsgFilter] = useState('');

    // ── Channels ──────────────────────────────────────────────
    const loadChannels = useCallback(async () => {
        setLoading(true);
        try {
            const data = await metaService.getChannels();
            setChannels(data.channels);
        } catch (err) {
            console.error('Channels load error:', err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Messages ──────────────────────────────────────────────
    const loadMessages = useCallback(async (filter = msgFilter) => {
        try {
            const params = filter ? { status: filter } : {};
            const data = await metaService.getMessages(params);
            setMessages(data.messages);
        } catch (err) {
            console.error('Messages load error:', err.message);
        }
    }, [msgFilter]);

    useEffect(() => {
        if (autoLoad) {
            loadChannels();
            loadMessages();
        }
    }, [autoLoad, loadChannels, loadMessages]);

    // Filter change হলে messages reload করো
    useEffect(() => {
        loadMessages(msgFilter);
    }, [msgFilter, loadMessages]);

    // ── Add channel ────────────────────────────────────────────
    const addChannel = useCallback(async (formData) => {
        const data = await metaService.addChannel(formData);
        await loadChannels();
        return data;
    }, [loadChannels]);

    // ── Toggle auto-reply ──────────────────────────────────────
    const toggleAutoReply = useCallback(async (channelId, currentValue) => {
        try {
            await metaService.updateChannel(channelId, { autoReplyEnabled: !currentValue });
            setChannels(prev =>
                prev.map(c =>
                    c._id === channelId ? { ...c, autoReplyEnabled: !currentValue } : c
                )
            );
            toast.success(`Auto-reply ${!currentValue ? 'চালু' : 'বন্ধ'} হয়েছে`);
        } catch (err) {
            toast.error(err.message);
        }
    }, []);

    // ── Delete channel ─────────────────────────────────────────
    const deleteChannel = useCallback(async (channelId) => {
        try {
            await metaService.deleteChannel(channelId);
            setChannels(prev => prev.filter(c => c._id !== channelId));
            toast.success('Channel deleted');
        } catch (err) {
            toast.error(err.message);
        }
    }, []);

    // ── Human reply পাঠাও ─────────────────────────────────────
    const sendHumanReply = useCallback(async (msgId, reply) => {
        await metaService.humanReply(msgId, reply);
        setMessages(prev =>
            prev.map(m =>
                m._id === msgId
                    ? { ...m, status: 'human_replied', humanReply: reply, finalReply: reply }
                    : m
            )
        );
        toast.success('Reply sent!');
    }, []);

    // Derived stats
    const stats = {
        totalChannels: channels.length,
        totalMessages: messages.length,
        needReview: messages.filter(m => m.status === 'review_needed').length,
        aiReplied: messages.filter(m => m.status === 'ai_replied').length,
        aiRate: messages.length
            ? Math.round((messages.filter(m => m.status === 'ai_replied').length / messages.length) * 100)
            : 0,
    };

    return {
        channels,
        messages,
        loading,
        stats,
        msgFilter,
        setMsgFilter,
        loadChannels,
        loadMessages,
        addChannel,
        toggleAutoReply,
        deleteChannel,
        sendHumanReply,
    };
}