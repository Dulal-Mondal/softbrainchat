import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithEmail, loginWithGoogle } from '../firebase/auth';
import toast from 'react-hot-toast';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleEmail = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await loginWithEmail(email, password);
            navigate('/dashboard');
        } catch (err) {
            const msg =
                err.code === 'auth/invalid-credential'
                    ? 'Email বা password ভুল'
                    : err.message;
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setLoading(true);
        try {
            await loginWithGoogle();
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            background: 'var(--bg-primary)',
        }}>
            <div style={{ width: '100%', maxWidth: 420 }}>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <h1 style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 700, color: 'var(--accent-2)' }}>
                        SoftBrainChat
                    </h1>
                    <p style={{ color: 'var(--text-2)', marginTop: 6, fontSize: 14 }}>
                        আপনার account এ login করুন
                    </p>
                </div>

                <div className="card">

                    {/* Google Button */}
                    <button
                        onClick={handleGoogle}
                        disabled={loading}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 10,
                            padding: '10px 16px',
                            borderRadius: 8,
                            border: '1px solid var(--border-2)',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text)',
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: 'pointer',
                            marginBottom: 20,
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                    >
                        <GoogleIcon />
                        Google দিয়ে Login
                    </button>

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>অথবা email দিয়ে</span>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleEmail}>
                        <div style={{ marginBottom: 14 }}>
                            <label style={labelStyle}>Email</label>
                            <input
                                type="email"
                                className="input"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div style={{ marginBottom: 8 }}>
                            <label style={labelStyle}>Password</label>
                            <input
                                type="password"
                                className="input"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div style={{ textAlign: 'right', marginBottom: 20 }}>
                            <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--accent)' }}>
                                Password ভুলে গেছেন?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', padding: 10, fontSize: 14 }}
                            disabled={loading}
                        >
                            {loading ? 'Loading...' : 'Login করুন'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-2)' }}>
                        Account নেই?{' '}
                        <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 500 }}>
                            Register করুন
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

const labelStyle = {
    display: 'block',
    fontSize: 12,
    color: 'var(--text-2)',
    marginBottom: 5,
    fontWeight: 500,
};

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}