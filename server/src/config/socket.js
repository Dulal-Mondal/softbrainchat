const { Server } = require('socket.io');
const admin = require('firebase-admin');
const User = require('../models/User.model');

let io = null;

// ── Socket.IO initialize করো ─────────────────────────────────
const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });

    // ── Auth middleware — Firebase token verify ────────────────
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error('No auth token'));

            const decoded = await admin.auth().verifyIdToken(token);

            // Firebase UID দিয়ে MongoDB user খুঁজো
            const user = await User.findOne({ uid: decoded.uid }).select('_id email');
            if (!user) return next(new Error('User not found'));

            socket.userId = user._id.toString();   // MongoDB _id
            socket.userEmail = user.email;
            next();
        } catch (err) {
            console.warn('Socket auth failed:', err.message);
            next(new Error('Authentication failed'));
        }
    });

    // ── Connection handler ──────────────────────────────────────
    io.on('connection', (socket) => {
        socket.join(`user:${socket.userId}`);
        console.log(`🔌 Socket connected: ${socket.userEmail}`);

        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: ${socket.userEmail}`);
        });
    });

    console.log('✅ Socket.IO initialized');
    return io;
};

// ── নির্দিষ্ট user কে event পাঠাও (MongoDB _id) ─────────────
const emitToUser = (userId, event, data) => {
    if (!io || !userId) return;
    io.to(`user:${userId.toString()}`).emit(event, data);
};

const emitToAll = (event, data) => {
    if (!io) return;
    io.emit(event, data);
};

const getIO = () => io;

module.exports = { initSocket, emitToUser, emitToAll, getIO };