import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [fbUser, setFbUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            setFbUser(firebaseUser);
            if (firebaseUser) {
                try {
                    const data = await api.get('/auth/me');
                    setUser(data.user);
                } catch (err) {
                    console.error('Profile fetch failed:', err.message);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    const refreshUser = async () => {
        try {
            const data = await api.get('/auth/me');
            setUser(data.user);
        } catch (err) {
            console.error('Refresh failed:', err.message);
        }
    };

    return (
        <AuthContext.Provider value={{ user, fbUser, loading, refreshUser, isAdmin: user?.role === 'admin', isLoggedIn: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}

export default AuthContext;