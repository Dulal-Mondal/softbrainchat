import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 12,
                background: 'var(--bg-primary)',
            }}>
                <div style={{ fontFamily: 'Syne', fontSize: 20, color: 'var(--accent-2)' }}>
                    SoftBrainChat
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Loading...</div>
            </div>
        );
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
}