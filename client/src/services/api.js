import axios from 'axios';
import { auth } from '../firebase/config';

// const api = axios.create({
//     baseURL: '/api',
//     headers: { 'Content-Type': 'application/json' },
// });


const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' },
});

// প্রতিটি request এ Firebase token automatically attach
api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response error সহজ করো
api.interceptors.response.use(
    (res) => res.data,
    (err) => {
        const message = err.response?.data?.message || 'Something went wrong';
        return Promise.reject(new Error(message));
    }
);

export default api;