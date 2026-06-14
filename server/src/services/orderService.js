import api from './api';

export const orderService = {
    // Orders
    getOrders: (params = {}) => api.get('/orders', { params }),
    getOrder: (orderId) => api.get(`/orders/${orderId}`),
    updateStatus: (orderId, status, notes) => api.patch(`/orders/${orderId}/status`, { status, notes }),
    deleteOrder: (orderId) => api.delete(`/orders/${orderId}`),

    // API Keys
    getApiKeys: () => api.get('/orders/api-keys'),
    createApiKey: (name) => api.post('/orders/api-keys', { name }),
    revokeApiKey: (keyId) => api.delete(`/orders/api-keys/${keyId}`),
};