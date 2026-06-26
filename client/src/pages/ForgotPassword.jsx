import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/config';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        if (!email.trim()) { toast.error('Email দিন'); return; }
        setSending(true);
        try {
            await sendPasswordResetEmail(auth, email.trim());
            setSent(true);
            toast.success('Reset link পাঠানো হয়েছে!');
        } catch (err) {
            const code = err.code;
            if (code === 'auth/user-not-found') toast.error('এই email এ কোনো account নেই');
            else if (code === 'auth/invalid-email') toast.error('সঠিক email দিন');
            else toast.error(err.message);
        } finally {
            setSending(false);
        }
    };

    const input = {
        width: '100%', padding: '11px 14px', borderRadius: 10,
        border: '1px solid var(--border-2)', background: 'var(--bg-tertiary)',
        color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: "'DM Sans',sans-serif",
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ width: '100%', maxWidth: 400 }}>
                <div className="card" style={{ padding: 32 }}>
                    <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                        🔑 Password Reset
                    </h1>

                    {sent ? (
                        <div style={{ marginTop: 16 }}>
                            <div style={{ padding: 16, borderRadius: 10, background: 'var(--green-dim)', border: '1px solid var(--green)', color: 'var(--green)', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                                ✅ <strong>{email}</strong> এ একটা reset link পাঠানো হয়েছে।<br /><br />
                                Email এর link এ click করে নতুন password সেট করুন। (Spam folder ও দেখুন)
                            </div>
                            <Link to="/login" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none', textAlign: 'center', display: 'block', padding: '11px' }}>
                                Login এ ফিরে যান
                            </Link>
                        </div>
                    ) : (
                        <>
                            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 24, lineHeight: 1.6 }}>
                                আপনার email দিন। আমরা একটা link পাঠাবো যেখান থেকে নতুন password সেট করতে পারবেন।
                            </p>
                            <form onSubmit={handleReset}>
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 6, fontWeight: 500 }}>Email</label>
                                    <input style={input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoFocus />
                                </div>
                                <button type="submit" disabled={sending} className="btn btn-primary" style={{ width: '100%', padding: '11px', fontSize: 14 }}>
                                    {sending ? 'পাঠানো হচ্ছে...' : 'Reset Link পাঠান'}
                                </button>
                            </form>
                            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13 }}>
                                <Link to="/login" style={{ color: 'var(--accent-2)', textDecoration: 'none' }}>← Login এ ফিরে যান</Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}