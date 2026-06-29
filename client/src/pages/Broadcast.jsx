import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useSocketEvent } from '../hooks/useSocket';

export default function Broadcast() {
    const [channels, setChannels] = useState([]);
    const [tags, setTags] = useState([]);
    const [broadcasts, setBroadcasts] = useState([]);
    const [form, setForm] = useState({ name: '', message: '', channelId: '', targetTag: '' });
    const [preview, setPreview] = useState(null);
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [ch, tg, bc] = await Promise.all([
                api.get('/meta/channels'),
                api.get('/contacts/meta/tags'),
                api.get('/broadcasts'),
            ]);
            setChannels(ch.channels || ch.data?.channels || []);
            setTags(tg.tags || tg.data?.tags || []);
            setBroadcasts(bc.broadcasts || bc.data?.broadcasts || []);
        } catch (err) { toast.error(err.message); }
    };

    // Real-time progress
    useSocketEvent('broadcast:progress', (data) => setProgress(data));
    useSocketEvent('broadcast:done', (data) => {
        setProgress(null);
        toast.success(`✅ Broadcast শেষ! ${data.sent} পাঠানো, ${data.failed} ব্যর্থ`);
        loadData();
    });

    const doPreview = async () => {
        if (!form.channelId) { toast.error('Channel select করুন'); return; }
        try {
            const res = await api.post('/broadcasts/preview', { channelId: form.channelId, targetTag: form.targetTag });
            setPreview(res.count ?? res.data?.count ?? 0);
        } catch (err) { toast.error(err.message); }
    };

    const send = async () => {
        if (!form.message.trim()) { toast.error('Message লিখুন'); return; }
        if (!form.channelId) { toast.error('Channel select করুন'); return; }
        if (!confirm(`${preview ?? '?'} জনকে message পাঠাবেন?`)) return;

        setSending(true);
        setProgress({ sent: 0, failed: 0, total: preview });
        try {
            await api.post('/broadcasts', form);
            toast.success('📤 Broadcast শুরু হয়েছে!');
            setForm({ name: '', message: '', channelId: form.channelId, targetTag: '' });
            setPreview(null);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
            setProgress(null);
        } finally { setSending(false); }
    };

    const input = {
        width: '100%', padding: '10px 12px', borderRadius: 8,
        border: '1px solid var(--border-2)', background: 'var(--bg-tertiary)',
        color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: "'DM Sans',sans-serif",
    };
    const label = { display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 6, fontWeight: 500 };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700 }}>📢 Broadcast</h1>
                    <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>একসাথে অনেক customer কে message পাঠান</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <Link to="/import-contacts" className="btn btn-primary btn-sm">📥 Import Contacts</Link>
                    <Link to="/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 1000 }}>

                {/* ── Compose ── */}
                <div className="card">
                    <h2 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>নতুন Broadcast</h2>

                    <div style={{ marginBottom: 14 }}>
                        <label style={label}>Channel</label>
                        <select style={input} value={form.channelId} onChange={e => { setForm({ ...form, channelId: e.target.value }); setPreview(null); }}>
                            <option value="">— Channel select করুন —</option>
                            {channels.map(c => <option key={c._id} value={c._id}>{c.name} ({c.platform})</option>)}
                        </select>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                        <label style={label}>কাদের পাঠাবেন</label>
                        <select style={input} value={form.targetTag} onChange={e => { setForm({ ...form, targetTag: e.target.value }); setPreview(null); }}>
                            <option value="">সব contact</option>
                            {tags.map(t => <option key={t} value={t}>🏷️ {t} tag এর contact রা</option>)}
                        </select>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                        <label style={label}>Message</label>
                        <textarea style={{ ...input, minHeight: 120, resize: 'vertical' }} value={form.message}
                            onChange={e => setForm({ ...form, message: e.target.value })}
                            placeholder="আপনার message লিখুন..." />
                    </div>

                    {/* Preview + Send */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button onClick={doPreview} className="btn btn-outline btn-sm">👁 Preview recipients</button>
                        {preview !== null && (
                            <span style={{ fontSize: 13, color: 'var(--accent-2)', fontWeight: 600 }}>
                                {preview} জন recipient
                            </span>
                        )}
                    </div>

                    <button onClick={send} disabled={sending || !!progress} className="btn btn-primary"
                        style={{ width: '100%', marginTop: 16, padding: 12 }}>
                        {progress ? 'পাঠানো হচ্ছে...' : '📤 Broadcast পাঠান'}
                    </button>

                    {/* Live progress */}
                    {progress && (
                        <div style={{ marginTop: 16, padding: 14, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>
                                পাঠানো হচ্ছে... {progress.sent + progress.failed} / {progress.total}
                            </div>
                            <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${((progress.sent + progress.failed) / progress.total * 100) || 0}%`, background: 'var(--accent)', transition: 'width .3s' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11 }}>
                                <span style={{ color: 'var(--green)' }}>✅ {progress.sent} sent</span>
                                {progress.failed > 0 && <span style={{ color: 'var(--red)' }}>❌ {progress.failed} failed</span>}
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: 14, padding: 10, background: 'var(--orange-dim)', borderRadius: 8, fontSize: 11, color: 'var(--orange)', lineHeight: 1.6 }}>
                        ⚠️ WhatsApp এ ২৪ ঘণ্টার বেশি আগে যোগাযোগ করা customer দের template ছাড়া message যাবে না। Messenger/Instagram এ active customer দের যাবে।
                    </div>
                </div>

                {/* ── History ── */}
                <div>
                    <h2 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Broadcast History</h2>
                    {broadcasts.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 30, color: 'var(--text-3)', fontSize: 13 }}>
                            এখনো কোনো broadcast পাঠাননি
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {broadcasts.map(b => (
                                <div key={b._id} className="card" style={{ padding: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: 13, fontWeight: 600 }}>{b.name}</span>
                                        <span style={{
                                            fontSize: 10, padding: '2px 8px', borderRadius: 6,
                                            background: b.status === 'completed' ? 'var(--green-dim)' : b.status === 'sending' ? 'var(--orange-dim)' : 'var(--bg-tertiary)',
                                            color: b.status === 'completed' ? 'var(--green)' : b.status === 'sending' ? 'var(--orange)' : 'var(--text-3)',
                                        }}>{b.status}</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {b.message}
                                    </div>
                                    <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-2)' }}>
                                        <span>📊 {b.totalRecipients} total</span>
                                        <span style={{ color: 'var(--green)' }}>✅ {b.sentCount}</span>
                                        {b.failedCount > 0 && <span style={{ color: 'var(--red)' }}>❌ {b.failedCount}</span>}
                                        {b.targetTag && <span>🏷️ {b.targetTag}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}