import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const STATUS_STYLE = {
    APPROVED: { bg: 'var(--green-dim)', color: 'var(--green)', label: '✅ Approved' },
    PENDING: { bg: 'var(--orange-dim)', color: 'var(--orange)', label: '⏳ Pending' },
    REJECTED: { bg: 'var(--red-dim)', color: 'var(--red)', label: '❌ Rejected' },
};

const CATEGORIES = [
    { id: 'MARKETING', label: 'Marketing (অফার, প্রমোশন)' },
    { id: 'UTILITY', label: 'Utility (অর্ডার আপডেট, রিমাইন্ডার)' },
];

const LANGUAGES = [
    { id: 'en', label: 'English' },
    { id: 'bn', label: 'বাংলা (Bengali)' },
];

export default function Templates() {
    const [channels, setChannels] = useState([]);
    const [channelId, setChannelId] = useState('');
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [saving, setSaving] = useState(false);

    // create form
    const [form, setForm] = useState({
        name: '', category: 'MARKETING', language: 'en',
        headerText: '', bodyText: '', footerText: '',
        buttons: [],
    });

    useEffect(() => {
        api.get('/meta/channels')
            .then(res => {
                const chs = (res.channels || res.data?.channels || []).filter(c => c.platform === 'whatsapp');
                setChannels(chs);
                if (chs.length) setChannelId(chs[0]._id);
            })
            .catch(() => { });
    }, []);

    useEffect(() => { if (channelId) loadTemplates(); }, [channelId]);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/templates/${channelId}/all`);
            setTemplates(res.templates || res.data?.templates || []);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
            setTemplates([]);
        } finally { setLoading(false); }
    };

    const addButton = (type) => {
        if (form.buttons.length >= 3) { toast.error('সর্বোচ্চ ৩টি button'); return; }
        setForm({ ...form, buttons: [...form.buttons, { type, text: '', url: '', phone: '' }] });
    };
    const updateButton = (i, key, val) => {
        const btns = [...form.buttons];
        btns[i][key] = val;
        setForm({ ...form, buttons: btns });
    };
    const removeButton = (i) => {
        setForm({ ...form, buttons: form.buttons.filter((_, idx) => idx !== i) });
    };

    const submit = async () => {
        if (!form.name.trim() || !form.bodyText.trim()) {
            toast.error('নাম ও body দরকার'); return;
        }
        setSaving(true);
        try {
            await api.post(`/templates/${channelId}/create`, form);
            toast.success('✅ Template submit হয়েছে! Meta review করছে।');
            setShowCreate(false);
            setForm({ name: '', category: 'MARKETING', language: 'en', headerText: '', bodyText: '', footerText: '', buttons: [] });
            setTimeout(loadTemplates, 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally { setSaving(false); }
    };

    const deleteTemplate = async (name) => {
        if (!confirm(`"${name}" template মুছবেন?`)) return;
        try {
            await api.delete(`/templates/${channelId}/${name}`);
            toast.success('মুছে ফেলা হয়েছে');
            loadTemplates();
        } catch (err) { toast.error(err.response?.data?.message || err.message); }
    };

    const input = {
        width: '100%', padding: '10px 12px', borderRadius: 8,
        border: '1px solid var(--border-2)', background: 'var(--bg-tertiary)',
        color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: "'DM Sans',sans-serif",
    };
    const label = { display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 5, fontWeight: 500 };

    // body এর variable count
    const varCount = new Set((form.bodyText.match(/\{\{\d+\}\}/g) || [])).size;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700 }}>📋 WhatsApp Templates</h1>
                    <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>
                        Template তৈরি করুন — Meta approve করলে broadcast এ ব্যবহার করুন
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary btn-sm">+ নতুন Template</button>
                    <Link to="/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
                </div>
            </div>

            {/* Channel select */}
            {channels.length === 0 ? (
                <div className="card" style={{ maxWidth: 600, textAlign: 'center', padding: 30, color: 'var(--text-3)' }}>
                    কোনো WhatsApp channel নেই। আগে Meta Reply এ WhatsApp channel যোগ করুন (WABA ID সহ)।
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: 20, maxWidth: 400 }}>
                        <label style={label}>WhatsApp Channel</label>
                        <select style={input} value={channelId} onChange={e => setChannelId(e.target.value)}>
                            {channels.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Create form */}
                    {showCreate && (
                        <div className="card" style={{ maxWidth: 640, marginBottom: 24 }}>
                            <h3 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>নতুন Template</h3>

                            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={label}>Template নাম (English, ছোট হাতের)</label>
                                    <input style={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="যেমন: eid_offer_2026" />
                                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>শুধু a-z, 0-9, _ (space হবে না)</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={label}>Category</label>
                                    <select style={input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={label}>Language</label>
                                    <select style={input} value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
                                        {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Header (optional) */}
                            <div style={{ marginBottom: 14 }}>
                                <label style={label}>Header (ঐচ্ছিক — উপরে মোটা লেখা)</label>
                                <input style={input} value={form.headerText} onChange={e => setForm({ ...form, headerText: e.target.value })}
                                    placeholder="যেমন: ঈদ মোবারক! 🎉" maxLength={60} />
                            </div>

                            {/* Body (required) */}
                            <div style={{ marginBottom: 14 }}>
                                <label style={label}>Body * (মূল message)</label>
                                <textarea style={{ ...input, minHeight: 90, resize: 'vertical' }} value={form.bodyText}
                                    onChange={e => setForm({ ...form, bodyText: e.target.value })}
                                    placeholder="যেমন: হ্যালো {{1}}, ঈদ উপলক্ষে {{2}} ছাড়! আজই অর্ডার করুন।" maxLength={1024} />
                                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>
                                    {'{{1}}'}, {'{{2}}'} দিয়ে variable বসান (broadcast এ নাম/custom text বসবে)।
                                    {varCount > 0 && ` — ${varCount}টি variable`}
                                </div>
                            </div>

                            {/* Footer (optional) */}
                            <div style={{ marginBottom: 14 }}>
                                <label style={label}>Footer (ঐচ্ছিক — নিচে ছোট লেখা)</label>
                                <input style={input} value={form.footerText} onChange={e => setForm({ ...form, footerText: e.target.value })}
                                    placeholder="যেমন: SoftBrainChat থেকে" maxLength={60} />
                            </div>

                            {/* Buttons (optional) */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={label}>Buttons (ঐচ্ছিক — সর্বোচ্চ ৩টি)</label>
                                {form.buttons.map((b, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 60 }}>
                                            {b.type === 'URL' ? '🔗 Link' : b.type === 'PHONE_NUMBER' ? '📞 Call' : '💬 Reply'}
                                        </span>
                                        <input style={{ ...input, flex: 1 }} placeholder="Button লেখা" value={b.text}
                                            onChange={e => updateButton(i, 'text', e.target.value)} maxLength={25} />
                                        {b.type === 'URL' && (
                                            <input style={{ ...input, flex: 1 }} placeholder="https://..." value={b.url}
                                                onChange={e => updateButton(i, 'url', e.target.value)} />
                                        )}
                                        {b.type === 'PHONE_NUMBER' && (
                                            <input style={{ ...input, flex: 1 }} placeholder="8801XXXXXXXXX" value={b.phone}
                                                onChange={e => updateButton(i, 'phone', e.target.value)} />
                                        )}
                                        <button onClick={() => removeButton(i)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 16 }}>✕</button>
                                    </div>
                                ))}
                                {form.buttons.length < 3 && (
                                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                        <button onClick={() => addButton('QUICK_REPLY')} className="btn btn-outline btn-sm" style={{ fontSize: 11 }}>+ Reply</button>
                                        <button onClick={() => addButton('URL')} className="btn btn-outline btn-sm" style={{ fontSize: 11 }}>+ Link</button>
                                        <button onClick={() => addButton('PHONE_NUMBER')} className="btn btn-outline btn-sm" style={{ fontSize: 11 }}>+ Call</button>
                                    </div>
                                )}
                            </div>

                            {/* Preview */}
                            <div style={{ marginBottom: 16, padding: 14, background: '#e5ddd5', borderRadius: 10 }}>
                                <div style={{ fontSize: 10, color: '#667', marginBottom: 6 }}>Preview:</div>
                                <div style={{ background: '#fff', borderRadius: 8, padding: 12, maxWidth: 300, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                                    {form.headerText && <div style={{ fontSize: 13, fontWeight: 700, color: '#000', marginBottom: 4 }}>{form.headerText}</div>}
                                    <div style={{ fontSize: 13, color: '#000', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                                        {form.bodyText || 'Body text এখানে দেখাবে...'}
                                    </div>
                                    {form.footerText && <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>{form.footerText}</div>}
                                    {form.buttons.filter(b => b.text).map((b, i) => (
                                        <div key={i} style={{ borderTop: '1px solid #eee', marginTop: 8, paddingTop: 8, textAlign: 'center', fontSize: 13, color: '#0088cc' }}>
                                            {b.type === 'URL' ? '🔗 ' : b.type === 'PHONE_NUMBER' ? '📞 ' : ''}{b.text}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={submit} disabled={saving} className="btn btn-primary">
                                    {saving ? 'Submit হচ্ছে...' : '📤 Meta তে Submit করুন'}
                                </button>
                                <button onClick={() => setShowCreate(false)} className="btn btn-outline">বাতিল</button>
                            </div>

                            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>
                                💡 Submit করার পর Meta review করবে (কয়েক মিনিট - ২৪ ঘণ্টা)। Approved হলে broadcast এ ব্যবহার করতে পারবেন।
                            </div>
                        </div>
                    )}

                    {/* Template list with status */}
                    <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
                        আপনার Templates
                    </h3>
                    {loading ? (
                        <div style={{ color: 'var(--text-2)' }}>Loading...</div>
                    ) : templates.length === 0 ? (
                        <div className="card" style={{ maxWidth: 600, textAlign: 'center', padding: 30, color: 'var(--text-3)' }}>
                            কোনো template নেই। "+ নতুন Template" দিয়ে তৈরি করুন।
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 700 }}>
                            {templates.map(t => {
                                const st = STATUS_STYLE[t.status] || STATUS_STYLE.PENDING;
                                return (
                                    <div key={t.name + t.language} className="card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <div>
                                                <span style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</span>
                                                <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 8 }}>{t.language} · {t.category}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: st.bg, color: st.color }}>
                                                    {st.label}
                                                </span>
                                                <button onClick={() => deleteTemplate(t.name)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 14 }}>🗑️</button>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, background: 'var(--bg-tertiary)', padding: 10, borderRadius: 8 }}>
                                            {t.bodyText}
                                        </div>
                                        {t.variableCount > 0 && (
                                            <div style={{ fontSize: 10, color: 'var(--accent-2)', marginTop: 6 }}>
                                                {t.variableCount}টি variable
                                            </div>
                                        )}
                                        {t.status === 'REJECTED' && t.rejectedReason && (
                                            <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 6 }}>
                                                ❌ কারণ: {t.rejectedReason}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}