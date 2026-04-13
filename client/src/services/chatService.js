import api from './api';

export const chatService = {
    send: (data) => api.post('/chat/send', data),
    history: () => api.get('/chat/history'),
    getChat: (id) => api.get(`/chat/${id}`),
    delete: (id) => api.delete(`/chat/${id}`),
    correct: (chatId, msgId, correction) =>
        api.patch(`/chat/${chatId}/message/${msgId}/correct`, { correction }),
};