import api from './api';

export const metaService = {
    // Channels
    getChannels: () => api.get('/meta/channels'),
    addChannel: (data) => api.post('/meta/channels', data),
    updateChannel: (id, data) => api.patch(`/meta/channels/${id}`, data),
    deleteChannel: (id) => api.delete(`/meta/channels/${id}`),

    // Messages
    getMessages: (params = {}) => api.get('/meta/messages', { params }),
    humanReply: (msgId, reply) => api.patch(`/meta/messages/${msgId}/reply`, { reply }),
};