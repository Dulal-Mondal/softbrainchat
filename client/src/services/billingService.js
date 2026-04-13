import api from './api';

export const billingService = {
    getStatus: () => api.get('/billing/status'),
    createCheckout: (plan) => api.post('/billing/checkout', { plan }),
    createPortal: () => api.post('/billing/portal'),
};