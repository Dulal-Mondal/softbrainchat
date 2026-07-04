import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useSocketEvent } from '../hooks/useSocket';

export default function Broadcast() {
    const [channels, setChannels] = useState([]);
    const [tags, setTags] = useState([]);
    const [broadcasts, setBroadcasts] = useState([]);
    const [form, setForm] = useState({ name: '', message: '', channelId: '' });
    const [selectedTags, setSelectedTags] = useState([]);   // multiple group
    const [preview, setPreview] = useState(null);
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState(null);

    // ── Template mode ──
    const [mode, setMode] = useState('text');
    const [templates, setTemplates] = useState([]);
    const [loadingTpl, setLoadingTpl] = useState(false);
    const [selectedTpl, setSelectedTpl] = useState(null);
    const [tplVars, setTplVars] = useState({});

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

    // group toggle
    const toggleTag = (tag) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
        setPreview(null);
    };

    const channel = channels.find(c => c._id === form.channelId);
    const isWhatsApp = channel?.platform === 'whatsapp';

    const loadTemplates = async () => {
        if (!form.channelId) { toast.error('Channel select করুন'); return; }
        setLoadingTpl(true);
        try {
            const res = await api.get(`/templates/${form.channelId}`);
            setTemplates(res.templates || res.data?.templates || []);
            if ((res.templates || res.data?.templates || []).length === 0) {
                toast('কোনো approved template নেই', { icon: 'ℹ️' });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally { setLoadingTpl(false); }
    };

    const selectTemplate = (tpl) => {
        setSelectedTpl(tpl);
        const vars = {};
        for (let i = 1; i <= tpl.variableCount; i++) vars[i] = i === 1 ? 'name' : '';
        setTplVars(vars);
    };

    useSocketEvent('broadcast:progress', (data) => setProgress(data));
    useSocketEvent('broadcast:done', (data) => {
        setProgress(null);
        toast.success(`✅ Broadcast শেষ! ${data.sent} পাঠানো, ${data.failed} ব্যর্থ`);
        loadData();
    });

    const doPreview = async () => {
        if (!form.channelId) { toast.error('Channel select করুন'); return; }
        try {
            const res = await api.post('/broadcasts/preview', { channelId: form.channelId, targetTags: selectedTags });
            setPreview(res.count ?? res.data?.count ?? 0);
        } catch (err) { toast.error(err.message); }
    };

    const sendText = async () => {
        if (!form.message.trim()) { toast.error('Message লিখুন'); return; }
        if (!confirm(`${preview ?? '?'} জনকে message পাঠাবেন?`)) return;
        setSending(true);
        setProgress({ sent: 0, failed: 0, total: preview });
        try {
            await api.post('/broadcasts', { ...form, targetTags: selectedTags });
            toast.success('📤 Broadcast শুরু হয়েছে!');
            setForm({ ...form, name: '', message: '' });
            setPreview(null);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
            setProgress(null);
        } finally { setSending(false); }
    };

    const sendTemplateBroadcast = async () => {
        if (!selectedTpl) { toast.error('Template select করুন'); return; }
        if (!confirm(`${preview ?? '?'} জনকে template পাঠাবেন?`)) return;
        setSending(true);
        setProgress({ sent: 0, failed: 0, total: preview });
        try {
            await api.post('/templates/broadcast', {
                name: form.name,
                channelId: form.channelId,
                targetTags: selectedTags,
                templateName: selectedTpl.name,
                language: selectedTpl.language,
                variableMapping: tplVars,
                templateBody: selectedTpl.bodyText,   // inbox এ আসল text দেখাতে
            });
            toast.success('📤 Template broadcast শুরু হয়েছে!');
            setSelectedTpl(null);
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
                        <select style={input} value={form.channelId} onChange={e => { setForm({ ...form, channelId: e.target.value }); setPreview(null); setSelectedTpl(null); setTemplates([]); }}>
                            <option value="">— Channel select করুন —</option>
                            {channels.map(c => <option key={c._id} value={c._id}>{c.name} ({c.platform})</option>)}
                        </select>
                    </div>

                    {/* ── Multiple Group select (checkbox) ── */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={label}>কোন Group এ পাঠাবেন (একাধিক select করা যায়)</label>
                        {tags.length === 0 ? (
                            <div style={{ fontSize: 12, color: 'var(--text-3)', padding: 10, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                                কোনো group নেই। Import করার সময় group তৈরি করুন।
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                                {/* All contacts option */}
                                <button onClick={() => { setSelectedTags([]); setPreview(null); }}
                                    style={{
                                        padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                                        border: `1px solid ${selectedTags.length === 0 ? 'var(--accent)' : 'var(--border-2)'}`,
                                        background: selectedTags.length === 0 ? 'var(--accent)' : 'transparent',
                                        color: selectedTags.length === 0 ? '#fff' : 'var(--text-2)',
                                    }}>
                                    সব contact
                                </button>
                                {tags.map(tag => {
                                    const active = selectedTags.includes(tag);
                                    return (
                                        <button key={tag} onClick={() => toggleTag(tag)}
                                            style={{
                                                padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                border: `1px solid ${active ? 'var(--accent)' : 'var(--border-2)'}`,
                                                background: active ? 'var(--accent-dim)' : 'transparent',
                                                color: active ? 'var(--accent-2)' : 'var(--text-2)',
                                            }}>
                                            {active ? '✓' : '🏷️'} {tag}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {selectedTags.length > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--accent-2)', marginTop: 6 }}>
                                {selectedTags.length}টি group select করা: {selectedTags.join(', ')}
                            </div>
                        )}
                    </div>

                    {/* Mode toggle (WhatsApp) */}
                    {isWhatsApp && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16, padding: 4, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                            <button onClick={() => setMode('text')}
                                style={{
                                    flex: 1, padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                                    background: mode === 'text' ? 'var(--accent)' : 'transparent', color: mode === 'text' ? '#fff' : 'var(--text-2)'
                                }}>
                                💬 Text (active only)
                            </button>
                            <button onClick={() => { setMode('template'); if (templates.length === 0) loadTemplates(); }}
                                style={{
                                    flex: 1, padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                                    background: mode === 'template' ? 'var(--accent)' : 'transparent', color: mode === 'template' ? '#fff' : 'var(--text-2)'
                                }}>
                                📋 Template (সবাইকে)
                            </button>
                        </div>
                    )}

                    {/* TEXT MODE */}
                    {(!isWhatsApp || mode === 'text') && (
                        <div style={{ marginBottom: 14 }}>
                            <label style={label}>Message</label>
                            <textarea style={{ ...input, minHeight: 120, resize: 'vertical' }} value={form.message}
                                onChange={e => setForm({ ...form, message: e.target.value })}
                                placeholder="আপনার message লিখুন..." />
                        </div>
                    )}

                    {/* TEMPLATE MODE */}
                    {isWhatsApp && mode === 'template' && (
                        <div style={{ marginBottom: 14 }}>
                            <label style={label}>Approved Template</label>
                            {loadingTpl ? (
                                <div style={{ fontSize: 12, color: 'var(--text-3)', padding: 10 }}>Template load হচ্ছে...</div>
                            ) : templates.length === 0 ? (
                                <div style={{ fontSize: 11, color: 'var(--orange)', padding: 10, background: 'var(--orange-dim)', borderRadius: 8, lineHeight: 1.6 }}>
                                    কোনো approved template নেই। Meta Business Manager এ template তৈরি ও approve করান।
                                    <button onClick={loadTemplates} style={{ display: 'block', marginTop: 8, background: 'none', border: '1px solid var(--orange)', color: 'var(--orange)', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>🔄 আবার চেষ্টা</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {templates.map(tpl => (
                                        <div key={tpl.name} onClick={() => selectTemplate(tpl)}
                                            style={{
                                                padding: 12, borderRadius: 8, cursor: 'pointer',
                                                border: `1px solid ${selectedTpl?.name === tpl.name ? 'var(--accent)' : 'var(--border)'}`,
                                                background: selectedTpl?.name === tpl.name ? 'var(--accent-dim)' : 'var(--bg-tertiary)'
                                            }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                                                {tpl.name} <span style={{ fontSize: 10, color: 'var(--text-3)' }}>({tpl.language} · {tpl.category})</span>
                                            </div>
                                            <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>{tpl.bodyText}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedTpl && selectedTpl.variableCount > 0 && (
                                <div style={{ marginTop: 14, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 10 }}>Variable গুলোতে কী বসবে:</div>
                                    {Array.from({ length: selectedTpl.variableCount }, (_, i) => i + 1).map(num => (
                                        <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <span style={{ fontSize: 12, color: 'var(--accent-2)', fontWeight: 600, minWidth: 36 }}>{`{{${num}}}`}</span>
                                            <select style={{ ...input, padding: '6px 10px' }} value={tplVars[num] || ''} onChange={e => setTplVars({ ...tplVars, [num]: e.target.value })}>
                                                <option value="name">Contact এর নাম</option>
                                                <option value="phone">Contact এর phone</option>
                                                <option value="">✏️ Fixed text লিখব</option>
                                            </select>
                                            {tplVars[num] !== 'name' && tplVars[num] !== 'phone' && (
                                                <input style={{ ...input, padding: '6px 10px', flex: 1 }} placeholder="text..." value={tplVars[num] || ''} onChange={e => setTplVars({ ...tplVars, [num]: e.target.value })} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Preview */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button onClick={doPreview} className="btn btn-outline btn-sm">👁 Preview recipients</button>
                        {preview !== null && <span style={{ fontSize: 13, color: 'var(--accent-2)', fontWeight: 600 }}>{preview} জন</span>}
                    </div>

                    {/* Send */}
                    <button onClick={isWhatsApp && mode === 'template' ? sendTemplateBroadcast : sendText}
                        disabled={sending || !!progress} className="btn btn-primary"
                        style={{ width: '100%', marginTop: 16, padding: 12 }}>
                        {progress ? 'পাঠানো হচ্ছে...' : (isWhatsApp && mode === 'template' ? '📋 Template পাঠান' : '📤 Broadcast পাঠান')}
                    </button>

                    {/* Progress */}
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

                    {/* Info */}
                    <div style={{ marginTop: 14, padding: 10, background: mode === 'template' ? 'var(--green-dim)' : 'var(--orange-dim)', borderRadius: 8, fontSize: 11, color: mode === 'template' ? 'var(--green)' : 'var(--orange)', lineHeight: 1.6 }}>
                        {isWhatsApp && mode === 'template'
                            ? '✅ Template যেকোনো number এ যাবে (imported সহ), কারণ Meta approved।'
                            : '⚠️ Text শুধু ২৪ ঘণ্টার মধ্যে active customer দের যাবে। নতুন/imported number এ Template ব্যবহার করুন।'}
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
                                            color: b.status === 'completed' ? 'var(--green)' : b.status === 'sending' ? 'var(--orange)' : 'var(--text-3)'
                                        }}>{b.status}</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {b.message}
                                    </div>
                                    <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-2)', flexWrap: 'wrap' }}>
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