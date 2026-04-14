import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from './config';

export const loginWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

export const registerWithEmail = async (email, password, name) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    return cred;
};

export const loginWithGoogle = () =>
    signInWithRedirect(auth, googleProvider);

export const handleRedirectResult = () =>
    getRedirectResult(auth);

export const logout = () => signOut(auth);

export const resetPassword = (email) =>
    sendPasswordResetEmail(auth, email);

export const getIdToken = async () => {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
};
