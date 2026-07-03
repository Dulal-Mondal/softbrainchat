import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function SubscriptionAdmin() {
    const [subs, setSubs] = useState([]);
    const [filter, setFilter] = useState('pending');
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, [filter]);

    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get('/subscriptions/all', { params: { status: filter } });
            setSubs(res.subscriptions || res.data?.subscriptions || []);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally { setLoading(false); }
    };

    const approve = async (sub) => {
        if (!confirm(`${sub.userId?.name} কে ${sub.plan} plan approve করবেন?`)) return;
        try {
            await api.post(`/subscriptions/${sub._id}/approve`);
            toast.success('✅ Plan active করা হয়েছে!');
            load();
        } catch (err) { toast.error(err.response?.data?.message || err.message); }
    };

    const reject = async (sub) => {
        const reason = prompt('Reject করার কারণ (ঐচ্ছিক):');
        if (reason === null) return;
        try {
            await api.post(`/subscriptions/${sub._id}/reject`, { reason });
            toast.success('Request reject করা হয়েছে');
            load();
        } catch (err) { toast.error(err.message); }
    };

    const fmt = (d) => d ? new Date(d).toLocaleDateString('bn-BD') : '—';

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700 }}>💳 Subscription Approvals</h1>
                    <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>Client দের plan request approve/reject করুন</p>
                </div>
                <Link to="/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {['pending', 'approved', 'rejected'].map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        style={{
                            padding: '7px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize',
                            border: `1px solid ${filter === s ? 'var(--accent)' : 'var(--border)'}`,
                            background: filter === s ? 'var(--accent)' : 'transparent',
                            color: filter === s ? '#fff' : 'var(--text-2)',
                        }}>
                        {s === 'pending' ? '⏳ Pending' : s === 'approved' ? '✅ Approved' : '❌ Rejected'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ color: 'var(--text-2)' }}>Loading...</div>
            ) : subs.length === 0 ? (
                <div className="card" style={{ maxWidth: 600, textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
                    কোনো {filter} request নেই
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 800 }}>
                    {subs.map(sub => (
                        <div key={sub._id} className="card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                                    {sub.userId?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{sub.userId?.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{sub.userId?.email}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: sub.plan === 'pro-max' ? 'var(--purple)' : 'var(--accent-2)', textTransform: 'uppercase', fontFamily: 'Syne' }}>
                                        {sub.plan}
                                    </span>
                                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmt(sub.createdAt)}</div>
                                </div>
                            </div>

                            {/* Request details */}
                            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.8 }}>
                                {sub.note && <div>📝 Message: {sub.note}</div>}
                                {!sub.note && <div style={{ color: 'var(--text-3)' }}>কোনো message নেই</div>}
                                {sub.status === 'approved' && sub.expiresAt && (
                                    <div style={{ color: 'var(--green)' }}>✅ মেয়াদ: {fmt(sub.startsAt)} — {fmt(sub.expiresAt)}</div>
                                )}
                                {sub.status === 'rejected' && sub.rejectReason && (
                                    <div style={{ color: 'var(--red)' }}>❌ কারণ: {sub.rejectReason}</div>
                                )}
                            </div>

                            {/* Actions (শুধু pending এ) */}
                            {sub.status === 'pending' && (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => approve(sub)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>✅ Approve</button>
                                    <button onClick={() => reject(sub)} className="btn btn-danger btn-sm">❌ Reject</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}