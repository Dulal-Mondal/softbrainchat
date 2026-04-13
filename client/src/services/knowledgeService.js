import axios from 'axios';
import api from './api';
import { auth } from '../firebase/config';

export const knowledgeService = {
    getAll: () => api.get('/knowledge'),

    uploadFile: async (file) => {
        const token = await auth.currentUser?.getIdToken();
        const form = new FormData();
        form.append('file', file);
        const res = await axios.post('/api/knowledge/file', form, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    },

    addUrl: (url) => api.post('/knowledge/url', { url }),
    delete: (id) => api.delete(`/knowledge/${id}`),
};