import { useState, useCallback } from 'react';
import { chatService } from '../services/chatService';
import toast from 'react-hot-toast';

export function useChat() {
    const [messages, setMessages] = useState([]);
    const [chatId, setChatId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [notification, setNotification] = useState(null);

    // ── Chat history sidebar এর জন্য ─────────────────────────
    const loadHistory = useCallback(async () => {
        try {
            const data = await chatService.history();
            setHistory(data.chats);
        } catch (err) {
            console.error('History load error:', err.message);
        }
    }, []);

    // ── Specific chat load করো ────────────────────────────────
    const loadChat = useCallback(async (id) => {
        try {
            const data = await chatService.getChat(id);
            setMessages(data.chat.messages);
            setChatId(id);
            setNotification(null);
        } catch {
            toast.error('Chat load failed');
        }
    }, []);

    // ── Message পাঠাও ─────────────────────────────────────────
    const sendMessage = useCallback(async ({ message, model, ragEnabled }) => {
        if (!message.trim() || loading) return;

        // Optimistic UI — user message তুরন্ত দেখাও
        const tempUser = {
            _id: `temp-user-${Date.now()}`,
            role: 'user',
            content: message,
            createdAt: new Date(),
        };
        const tempAI = {
            _id: `temp-ai-${Date.now()}`,
            role: 'assistant',
            content: '',
            loading: true,
        };

        setMessages(prev => [...prev, tempUser, tempAI]);
        setLoading(true);
        setNotification(null);

        try {
            const data = await chatService.send({ chatId, message, model, ragEnabled });

            // Typing placeholder সরিয়ে real response রাখো
            setMessages(prev => [
                ...prev.filter(m => m._id !== tempAI._id),
                data.message,
            ]);
            setChatId(data.chatId);

            // AI উত্তর দিতে পারেনি
            if (data.cantAnswer) {
                setNotification('AI এই প্রশ্নের উত্তর দিতে পারেনি। Human review দরকার।');
            }

            await loadHistory();
        } catch (err) {
            // Error হলে typing placeholder সরাও
            setMessages(prev => prev.filter(m => m._id !== tempAI._id));
            toast.error(err.message || 'Message send failed');
        } finally {
            setLoading(false);
        }
    }, [chatId, loading, loadHistory]);

    // ── New chat শুরু করো ────────────────────────────────────
    const newChat = useCallback(() => {
        setMessages([]);
        setChatId(null);
        setNotification(null);
    }, []);

    // ── AI reply correct করো ────────────────────────────────
    const correctMessage = useCallback(async (msgId, correction) => {
        if (!chatId) return;
        try {
            await chatService.correct(chatId, msgId, correction);
            setMessages(prev =>
                prev.map(m => m._id === msgId ? { ...m, corrected: true, correction } : m)
            );
            toast.success('Correction saved!');
        } catch (err) {
            toast.error(err.message);
        }
    }, [chatId]);

    // ── Chat delete করো ─────────────────────────────────────
    const deleteChat = useCallback(async (id) => {
        try {
            await chatService.delete(id);
            if (id === chatId) newChat();
            await loadHistory();
            toast.success('Chat deleted');
        } catch (err) {
            toast.error(err.message);
        }
    }, [chatId, newChat, loadHistory]);

    return {
        messages,
        chatId,
        loading,
        history,
        notification,
        setNotification,
        loadHistory,
        loadChat,
        sendMessage,
        newChat,
        correctMessage,
        deleteChat,
    };
}