// import axios from 'axios';
// import api from './api';
// import { auth } from '../firebase/config';

// export const knowledgeService = {
//     getAll: () => api.get('/knowledge'),

//     uploadFile: async (file) => {
//         const token = await auth.currentUser?.getIdToken();
//         const form = new FormData();
//         form.append('file', file);
//         const res = await axios.post('/api/knowledge/file', form, {
//             headers: { Authorization: `Bearer ${token}` },
//         });
//         return res.data;
//     },

//     addUrl: (url) => api.post('/knowledge/url', { url }),
//     delete: (id) => api.delete(`/knowledge/${id}`),
// };

import axios from 'axios';
import api from './api';
import { auth } from '../firebase/config';

// Base URL — api.js এর মতোই
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const knowledgeService = {
    getAll: () => api.get('/knowledge'),

    uploadFile: async (file) => {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error('Not authenticated');

        const form = new FormData();
        form.append('file', file);

        // Relative URL এর বদলে Full URL দাও
        const res = await axios.post(`${BASE_URL}/knowledge/file`, form, {
            headers: {
                Authorization: `Bearer ${token}`,
                // Content-Type দিও না — axios নিজে multipart/form-data set করবে
            },
        });
        return res.data;
    },

    addUrl: (url) => api.post('/knowledge/url', { url }),
    delete: (id) => api.delete(`/knowledge/${id}`),
};