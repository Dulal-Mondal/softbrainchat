import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';

export default function AcceptInvite() {
    const [params] = useSearchParams();
    const token = params.get('token');
    const navigate = useNavigate();

    const [invite, setInvite] = useState(null);
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!token) { setLoading(false); return; }
        api.get(`/agents/invite/${token}`)
            .then(res => setInvite(res.invite || res.data?.invite))
            .catch(err => toast.error(err.response?.data?.message || 'Invite পাওয়া যায়নি'))
            .finally(() => setLoading(false));
    }, [token]);

    const accept = async () => {
        if (password.length < 6) { toast.error('Password অন্তত ৬ অক্ষর'); return; }
        if (password !== confirm) { toast.error('Password মিলছে না'); return; }

        setSubmitting(true);
        try {
            // ১. Firebase এ account তৈরি করো
            let firebaseUid;
            try {
                const cred = await createUserWithEmailAndPassword(auth, invite.email, password);
                firebaseUid = cred.user.uid;
            } catch (fbErr) {
                if (fbErr.code === 'auth/email-already-in-use') {
                    // email আগে থেকে Firebase এ আছে — এই password দিয়ে login try করো
                    try {
                        const cred = await signInWithEmailAndPassword(auth, invite.email, password);
                        firebaseUid = cred.user.uid;
                    } catch (loginErr) {
                        // password মেলেনি — এই email আগে অন্য password এ তৈরি
                        toast.error('এই email আগে থেকে ব্যবহৃত। আপনার আগের password দিন, অথবা login পেজে "Forgot Password" দিয়ে reset করুন।');
                        setSubmitting(false);
                        return;
                    }
                } else {
                    throw fbErr;
                }
            }

            // ২. Backend এ link করো
            await api.post(`/agents/invite/${token}/accept`, { firebaseUid, name: invite.name });

            toast.success('✅ Account তৈরি হয়েছে! Dashboard এ নিয়ে যাচ্ছি...');
            setTimeout(() => navigate('/dashboard'), 1000);
        } catch (err) {
            const msg = err.code === 'auth/weak-password' ? 'Password অন্তত ৬ অক্ষর হতে হবে'
                : err.code === 'auth/invalid-email' ? 'Email সঠিক নয়'
                    : err.code === 'auth/invalid-credential' ? 'এই email আগে ব্যবহৃত — Login পেজে Forgot Password দিয়ে reset করুন'
                        : err.response?.data?.message || err.message;
            toast.error(msg);
        } finally { setSubmitting(false); }
    };

    const input = {
        width: '100%', padding: '11px 14px', borderRadius: 8,
        border: '1px solid var(--border-2)', background: 'var(--bg-tertiary)',
        color: 'var(--text)', fontSize: 14, outline: 'none',
    };

    if (loading) return <Center><div style={{ color: 'var(--text-3)' }}>Loading...</div></Center>;

    if (!token || !invite) {
        return (
            <Center>
                <div className="card" style={{ maxWidth: 400, textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                    <h2 style={{ fontFamily: 'Syne', fontSize: 18, marginBottom: 8 }}>Invalid Invite</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
                        এই invite link টি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।
                    </p>
                    <Link to="/login" className="btn btn-primary">Login এ যান</Link>
                </div>
            </Center>
        );
    }

    if (invite.alreadyAccepted) {
        return (
            <Center>
                <div className="card" style={{ maxWidth: 400, textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                    <h2 style={{ fontFamily: 'Syne', fontSize: 18, marginBottom: 8 }}>ইতোমধ্যে Accept করা</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
                        এই invite আগেই accept করা হয়েছে। আপনার email ও password দিয়ে login করুন।
                    </p>
                    <Link to="/login" className="btn btn-primary">Login করুন</Link>
                </div>
            </Center>
        );
    }

    return (
        <Center>
            <div className="card" style={{ maxWidth: 420, width: '100%', padding: 32 }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
                    <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Team এ স্বাগতম!</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                        <strong>{invite.ownerName}</strong> আপনাকে যোগ করেছেন।<br />
                        password তৈরি করে শুরু করুন।
                    </p>
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Email</label>
                    <input style={{ ...input, opacity: 0.6, cursor: 'not-allowed' }} value={invite.email} readOnly />
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Password তৈরি করুন</label>
                    <div style={{ position: 'relative' }}>
                        <input style={input} type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="অন্তত ৬ অক্ষর" />
                        <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                            {showPw ? '🙈' : '👁️'}
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Password আবার দিন</label>
                    <input style={input} type={showPw ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="আবার লিখুন" />
                </div>

                <button onClick={accept} disabled={submitting} className="btn btn-primary" style={{ width: '100%', padding: 12 }}>
                    {submitting ? 'তৈরি হচ্ছে...' : 'Account তৈরি করুন →'}
                </button>
            </div>
        </Center>
    );
}

function Center({ children }) {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            {children}
        </div>
    );
}