const admin = require('../config/firebase');

// ── Firebase ID token verify করো ─────────────────────────────
const verifyIdToken = async (token) => {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded;
};

// ── Firebase user নিয়ে আসো UID দিয়ে ──────────────────────────
const getFirebaseUser = async (uid) => {
    const user = await admin.auth().getUser(uid);
    return user;
};

// ── Firebase user এর email verify করো ────────────────────────
const setEmailVerified = async (uid, verified = true) => {
    await admin.auth().updateUser(uid, { emailVerified: verified });
};

// ── Firebase user delete করো ─────────────────────────────────
// User MongoDB থেকে delete হলে Firebase থেকেও সরাও
const deleteFirebaseUser = async (uid) => {
    try {
        await admin.auth().deleteUser(uid);
    } catch (err) {
        // User আগেই delete হয়ে থাকলে ignore করো
        if (err.code !== 'auth/user-not-found') throw err;
    }
};

// ── Custom claims set করো ────────────────────────────────────
// Admin role Firebase token এ embed করো
const setCustomClaims = async (uid, claims) => {
    await admin.auth().setCustomUserClaims(uid, claims);
};

// ── Password reset email পাঠাও ───────────────────────────────
const generatePasswordResetLink = async (email) => {
    const link = await admin.auth().generatePasswordResetLink(email);
    return link;
};

// ── Email verification link তৈরি করো ────────────────────────
const generateEmailVerificationLink = async (email) => {
    const link = await admin.auth().generateEmailVerificationLink(email);
    return link;
};

module.exports = {
    verifyIdToken,
    getFirebaseUser,
    setEmailVerified,
    deleteFirebaseUser,
    setCustomClaims,
    generatePasswordResetLink,
    generateEmailVerificationLink,
};