import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const PLANS = [
    {
        id: 'pro', name: 'Pro', color: 'var(--accent-2)',
        features: ['৩টি চ্যানেল', 'সীমাহীন মেসেজ', 'সম্পূর্ণ CRM', 'গ্রুপ ব্রডকাস্ট', '৩ জন এজেন্ট']
    },
    {
        id: 'pro-max', name: 'Pro Max', color: 'var(--purple)',
        features: ['সীমাহীন চ্যানেল', 'WhatsApp টেমপ্লেট', 'কাস্টম LLM', '১০ জন এজেন্ট', 'অগ্রাধিকার সাপোর্ট']
    },
];

export default function Subscribe() {
    const [selectedPlan, setSelectedPlan] = useState('pro');
    const [mySubscriptions, setMySubscriptions] = useState([]);
    const [currentPlan, setCurrentPlan] = useState('free');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const res = await api.get('/subscriptions/my');
            setMySubscriptions(res.subscriptions || res.data?.subscriptions || []);
            setCurrentPlan(res.currentPlan || res.data?.currentPlan || 'free');
        } catch (err) { /* silent */ }
    };

    const plan = PLANS.find(p => p.id === selectedPlan);
    const pending = mySubscriptions.find(s => s.status === 'pending');

    const submit = async () => {
        setSubmitting(true);
        try {
            await api.post('/subscriptions', { plan: selectedPlan, note });
            toast.success('✅ Request পাঠানো হয়েছে! Admin approve করলে plan active হবে।');
            setNote('');
            load();
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally { setSubmitting(false); }
    };

    const input = {
        width: '100%', padding: '10px 12px', borderRadius: 8,
        border: '1px solid var(--border-2)', background: 'var(--bg-tertiary)',
        color: 'var(--text)', fontSize: 13, outline: 'none',
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700 }}>💎 Plan Upgrade</h1>
                    <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>
                        বর্তমান plan: <span style={{ color: 'var(--accent-2)', fontWeight: 600, textTransform: 'uppercase' }}>{currentPlan}</span>
                    </p>
                </div>
                <Link to="/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
            </div>

            {/* Pending alert */}
            {pending && (
                <div className="card" style={{ maxWidth: 700, marginBottom: 20, border: '1px solid var(--orange)' }}>
                    <div style={{ fontSize: 13, color: 'var(--orange)' }}>
                        ⏳ আপনার <strong>{pending.plan}</strong> request pending আছে। Admin approve করলে active হবে।
                    </div>
                </div>
            )}

            <div style={{ maxWidth: 700 }}>
                {/* Plan select */}
                <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Plan বাছুন</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                    {PLANS.map(p => (
                        <div key={p.id} onClick={() => setSelectedPlan(p.id)} className="card" style={{
                            cursor: 'pointer',
                            border: `2px solid ${selectedPlan === p.id ? p.color : 'var(--border)'}`,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700 }}>{p.name}</span>
                                {selectedPlan === p.id && <span style={{ fontSize: 18, color: p.color }}>✓</span>}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {p.features.map((f, i) => (
                                    <span key={i} style={{ fontSize: 11, color: 'var(--text-2)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 6 }}>✓ {f}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Note */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 5, fontWeight: 500 }}>
                        Message (ঐচ্ছিক)
                    </label>
                    <textarea style={{ ...input, minHeight: 70, resize: 'vertical' }} value={note} onChange={e => setNote(e.target.value)}
                        placeholder="Admin কে কিছু বলতে চাইলে লিখুন..." />
                </div>

                <button onClick={submit} disabled={submitting || pending} className="btn btn-primary" style={{ width: '100%', padding: 12 }}>
                    {submitting ? 'পাঠানো হচ্ছে...' : pending ? 'একটি request pending আছে' : `📤 ${plan.name} Plan Request পাঠান`}
                </button>

                <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
                    Request পাঠানোর পর admin যাচাই করে approve করবেন। Approve হলে আপনার plan সাথে সাথে active হবে।
                </p>
            </div>

            {/* History */}
            {mySubscriptions.length > 0 && (
                <div style={{ maxWidth: 700, marginTop: 28 }}>
                    <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>আপনার Request গুলো</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {mySubscriptions.map(s => (
                            <div key={s._id} className="card" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase' }}>{s.plan}</span>
                                    <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 10 }}>{new Date(s.createdAt).toLocaleDateString('bn-BD')}</span>
                                    {s.status === 'rejected' && s.rejectReason && (
                                        <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>❌ {s.rejectReason}</div>
                                    )}
                                </div>
                                <span style={{
                                    fontSize: 11, padding: '3px 10px', borderRadius: 10,
                                    background: s.status === 'approved' ? 'var(--green-dim)' : s.status === 'rejected' ? 'var(--red-dim)' : 'var(--orange-dim)',
                                    color: s.status === 'approved' ? 'var(--green)' : s.status === 'rejected' ? 'var(--red)' : 'var(--orange)'
                                }}>
                                    {s.status === 'approved' ? '✅ Approved' : s.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}