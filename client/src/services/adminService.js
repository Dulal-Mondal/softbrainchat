import api from './api';

export const adminService = {
    getStats: () => api.get('/admin/stats'),
    getAllUsers: (params = {}) => api.get('/admin/users', { params }),
    getUser: (id) => api.get(`/admin/users/${id}`),
    setPlanOverride: (id, data) => api.patch(`/admin/users/${id}/plan-override`, data),
    removePlanOverride: (id) => api.patch(`/admin/users/${id}/plan-override/remove`),
    updateRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
};