import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { auth } from '../firebase/config';

// Socket server URL — VITE_API_URL থেকে /api বাদ দিয়ে
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
    .replace(/\/api\/?$/, '');

let socketInstance = null;

// ── Singleton socket — পুরো app এ একটাই connection ──────────
export const getSocket = async () => {
    if (socketInstance?.connected) return socketInstance;

    const user = auth.currentUser;
    if (!user) return null;

    const token = await user.getIdToken();

    socketInstance = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    return socketInstance;
};

export const disconnectSocket = () => {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }
};

// ── React hook — যেকোনো component এ real-time event শোনো ────
// useSocketEvent('order:new', (data) => { ... })
export const useSocketEvent = (event, handler) => {
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    useEffect(() => {
        let socket;
        let mounted = true;

        const setup = async () => {
            socket = await getSocket();
            if (!socket || !mounted) return;

            const listener = (data) => handlerRef.current(data);
            socket.on(event, listener);

            // cleanup
            return () => socket.off(event, listener);
        };

        const cleanupPromise = setup();

        return () => {
            mounted = false;
            cleanupPromise?.then(cleanup => cleanup?.());
        };
    }, [event]);
};

// ── Connection status hook ───────────────────────────────────
export const useSocketStatus = () => {
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        let socket;
        const setup = async () => {
            socket = await getSocket();
            if (!socket) return;
            setConnected(socket.connected);
            socket.on('connect', () => setConnected(true));
            socket.on('disconnect', () => setConnected(false));
        };
        setup();
    }, []);

    return connected;
};