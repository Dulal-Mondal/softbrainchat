import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const PLATFORM_ICON = { whatsapp: '💬', messenger: '📘', instagram: '📸' };
const STAGE_COLORS = {
    new: 'var(--text-3)', contacted: 'var(--accent-2)', qualified: 'var(--orange)',
    won: 'var(--green)', lost: 'var(--red)',
};

export default function CrmTable() {
    const [contacts, setContacts] = useState([]);
    const [columns, setColumns] = useState([]);   // custom columns (showInTable)
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);    // drawer এ যে contact
    const [conversation, setConversation] = useState([]);
    const [loadingConvo, setLoadingConvo] = useState(false);
    const [extracting, setExtracting] = useState(false);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const [cfg, ct] = await Promise.all([
                api.get('/crm-config'),
                api.get('/contacts'),
            ]);
            const fields = (cfg.config || cfg.data?.config)?.fields || [];
            setColumns(fields.filter(f => f.showInTable));
            setContacts(ct.contacts || ct.data?.contacts || []);
        } catch (err) { toast.error(err.message); }
        finally { setLoading(false); }
    };

    // ── Contact click → conversation drawer ──
    const openContact = async (contact) => {
        setSelected(contact);
        setLoadingConvo(true);
        setConversation([]);
        try {
            const res = await api.get(`/conversations/${contact.senderId}/${contact.channelId}`);
            setConversation(res.messages || res.data?.messages || []);
        } catch (err) { toast.error(err.message); }
        finally { setLoadingConvo(false); }
    };

    // ── AI extract custom data ──
    const extractData = async () => {
        if (!selected) return;
        setExtracting(true);
        try {
            const res = await api.post(`/contacts/${selected._id}/extract`);
            const customData = res.customData || res.data?.customData;
            // selected update করো
            setSelected({ ...selected, customData });
            // table এ ও update করো
            setContacts(contacts.map(c => c._id === selected._id ? { ...c, customData } : c));
            toast.success('🤖 AI data বের করেছে!');
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally { setExtracting(false); }
    };

    // ── Manual edit custom field ──
    const saveCustomField = async (key, value) => {
        if (!selected) return;
        try {
            const customData = { ...(selected.customData || {}), [key]: value };
            await api.patch(`/contacts/${selected._id}/custom`, { customData });
            setSelected({ ...selected, customData });
            setContacts(contacts.map(c => c._id === selected._id ? { ...c, customData } : c));
        } catch (err) { toast.error(err.message); }
    };

    const filtered = contacts.filter(c =>
        !search ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search)
    );

    const isImageUrl = (t) => /\.(jpg|jpeg|png|gif|webp)/i.test(t) || t?.includes('cloudinary');

    const th = { textAlign: 'left', padding: '10px 12px', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' };
    const td = { padding: '10px 12px', fontSize: 13, borderBottom: '1px solid var(--border)' };

    if (loading) return <div style={{ padding: 32, color: 'var(--text-2)' }}>Loading...</div>;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700 }}>📋 CRM</h1>
                    <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>সব customer — নাম এ click করে conversation দেখুন</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <Link to="/crm-setup" className="btn btn-outline btn-sm">⚙️ Setup Columns</Link>
                    <Link to="/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
                </div>
            </div>

            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 নাম বা phone দিয়ে খুঁজুন..."
                style={{ width: '100%', maxWidth: 360, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-2)', background: 'var(--bg-tertiary)', color: 'var(--text)', fontSize: 13, outline: 'none', marginBottom: 18 }} />

            {/* Table */}
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={th}>Customer</th>
                            <th style={th}>Phone</th>
                            <th style={th}>Platform</th>
                            <th style={th}>Stage</th>
                            {columns.map(col => <th key={col.key} style={th}>{col.label}</th>)}
                            <th style={th}>Last Message</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={5 + columns.length} style={{ ...td, textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>কোনো customer নেই</td></tr>
                        ) : filtered.map(c => (
                            <tr key={c._id} style={{ cursor: 'pointer' }}
                                onClick={() => openContact(c)}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <td style={td}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {c.profilePic ? (
                                            <img src={c.profilePic} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                                                {c.name?.[0]?.toUpperCase() || 'C'}
                                            </div>
                                        )}
                                        <span style={{ fontWeight: 600, color: 'var(--accent-2)' }}>{c.name}</span>
                                    </div>
                                </td>
                                <td style={{ ...td, color: 'var(--text-2)', fontSize: 12 }}>{c.phone || '—'}</td>
                                <td style={td}>{PLATFORM_ICON[c.platform]} </td>
                                <td style={td}>
                                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, color: STAGE_COLORS[c.lead?.stage] || 'var(--text-3)', border: `1px solid ${STAGE_COLORS[c.lead?.stage] || 'var(--border)'}` }}>
                                        {c.lead?.stage || 'new'}
                                    </span>
                                </td>
                                {columns.map(col => (
                                    <td key={col.key} style={{ ...td, color: 'var(--text-2)', fontSize: 12 }}>
                                        {c.customData?.[col.key] || '—'}
                                    </td>
                                ))}
                                <td style={{ ...td, color: 'var(--text-3)', fontSize: 12, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {c.lastMessageText}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Conversation drawer ── */}
            {selected && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'flex-end', zIndex: 1000 }}
                    onClick={() => setSelected(null)}>
                    <div style={{ width: 480, maxWidth: '90vw', height: '100%', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}
                        onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div style={{ padding: 18, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                            {selected.profilePic ? (
                                <img src={selected.profilePic} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600 }}>
                                    {selected.name?.[0]?.toUpperCase()}
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 15, fontWeight: 600 }}>{selected.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{selected.phone || selected.platform}</div>
                            </div>
                            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 22, cursor: 'pointer' }}>×</button>
                        </div>

                        {/* Custom data section */}
                        {columns.length > 0 && (
                            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>📊 CRM Data</span>
                                    <button onClick={extractData} disabled={extracting}
                                        style={{ background: 'none', border: '1px solid var(--accent)', color: 'var(--accent-2)', fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>
                                        {extracting ? '🤖 ...' : '🤖 AI দিয়ে বের করুন'}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {columns.map(col => (
                                        <div key={col.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span style={{ fontSize: 12, color: 'var(--text-3)', minWidth: 100 }}>{col.label}:</span>
                                            <input
                                                defaultValue={selected.customData?.[col.key] || ''}
                                                onBlur={e => saveCustomField(col.key, e.target.value)}
                                                placeholder="—"
                                                style={{ flex: 1, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border-2)', background: 'var(--bg-secondary)', color: 'var(--text)', fontSize: 12, outline: 'none' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Conversation */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {loadingConvo ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13, marginTop: 20 }}>Loading...</div>
                            ) : conversation.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13, marginTop: 20 }}>কোনো message নেই</div>
                            ) : conversation.map(m => (
                                <div key={m._id} style={{ display: 'flex', justifyContent: m.from === 'customer' ? 'flex-start' : 'flex-end' }}>
                                    <div style={{
                                        maxWidth: '75%', padding: '8px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                        background: m.from === 'customer' ? 'var(--bg-tertiary)' : (m.from === 'human' ? 'var(--green-dim)' : 'var(--accent)'),
                                        color: m.from === 'customer' ? 'var(--text)' : (m.from === 'human' ? 'var(--green)' : '#fff'),
                                    }}>
                                        {isImageUrl(m.text) ? <img src={m.text} style={{ maxWidth: 180, borderRadius: 8 }} /> : m.text}
                                        {m.from !== 'customer' && (
                                            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 3 }}>
                                                {m.from === 'ai' ? '🤖 AI' : `👤 ${m.repliedBy || 'Agent'}`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer link to inbox */}
                        <div style={{ padding: 14, borderTop: '1px solid var(--border)' }}>
                            <Link to="/inbox" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', textDecoration: 'none', display: 'block', padding: 10 }}>
                                💬 Inbox এ গিয়ে reply করুন
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}