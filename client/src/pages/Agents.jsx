import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

// feature list — admin এগুলো toggle করবে
const FEATURES = [
    { key: 'inbox', label: '📥 Inbox', desc: 'Conversation দেখা ও reply' },
    { key: 'crm', label: '📋 CRM', desc: 'Customer table' },
    { key: 'broadcast', label: '📢 Broadcast', desc: 'Bulk message' },
    { key: 'import', label: '📤 Import', desc: 'Contact import' },
    { key: 'orders', label: '📦 Orders', desc: 'Order management' },
    { key: 'analytics', label: '📊 Analytics', desc: 'Dashboard reports' },
    { key: 'business', label: '🏪 Business', desc: 'Business setup' },
    { key: 'meta', label: '📲 Meta Reply', desc: 'Channel management' },
];

export default function Agents() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', role: 'agent', permissions: ['inbox'] });
    const [saving, setSaving] = useState(false);
    const [inviteLink, setInviteLink] = useState(null);   // email fail হলে দেখাবে

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const res = await api.get('/agents');
            setAgents(res.agents || res.data?.agents || []);
        } catch (err) { toast.error(err.message); }
        finally { setLoading(false); }
    };

    const togglePerm = (key) => {
        setForm(f => ({
            ...f,
            permissions: f.permissions.includes(key)
                ? f.permissions.filter(p => p !== key)
                : [...f.permissions, key],
        }));
    };

    const addAgent = async () => {
        if (!form.name.trim() || !form.email.trim()) { toast.error('নাম ও email দিন'); return; }
        if (form.permissions.length === 0) { toast.error('অন্তত একটা feature access দিন'); return; }
        setSaving(true);
        setInviteLink(null);
        try {
            const res = await api.post('/agents', form);
            const data = res.success ? res : res.data;
            if (data.emailSent) {
                toast.success('✅ Invite email পাঠানো হয়েছে!');
            } else {
                toast('ℹ️ Email যায়নি — link copy করে agent কে পাঠান', { icon: '📋' });
                setInviteLink(data.inviteLink);
            }
            setForm({ name: '', email: '', role: 'agent', permissions: ['inbox'] });
            setShowAdd(false);
            load();
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally { setSaving(false); }
    };

    const resendInvite = async (agent) => {
        try {
            const res = await api.post(`/agents/${agent._id}/resend`);
            const data = res.success ? res : res.data;
            if (data.emailSent) toast.success('Invite আবার পাঠানো হয়েছে');
            else { setInviteLink(data.inviteLink); toast('Link copy করে পাঠান', { icon: '📋' }); }
        } catch (err) { toast.error(err.message); }
    };

    const updatePerms = async (agent, newPerms) => {
        try {
            await api.patch(`/agents/${agent._id}`, { permissions: newPerms });
            setAgents(agents.map(a => a._id === agent._id ? { ...a, permissions: newPerms } : a));
            toast.success('Permission updated');
        } catch (err) { toast.error(err.message); }
    };

    const toggleActive = async (agent) => {
        try {
            await api.patch(`/agents/${agent._id}`, { active: !agent.active });
            load();
        } catch (err) { toast.error(err.message); }
    };

    const removeAgent = async (id) => {
        if (!confirm('এই agent মুছবেন?')) return;
        try {
            await api.delete(`/agents/${id}`);
            toast.success('মুছে ফেলা হয়েছে');
            load();
        } catch (err) { toast.error(err.message); }
    };

    const copyLink = (link) => {
        navigator.clipboard.writeText(link);
        toast.success('Link copy হয়েছে!');
    };

    const input = {
        width: '100%', padding: '9px 12px', borderRadius: 8,
        border: '1px solid var(--border-2)', background: 'var(--bg-tertiary)',
        color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: "'DM Sans',sans-serif",
    };
    const label = { display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 5, fontWeight: 500 };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700 }}>👥 Team / Agents</h1>
                    <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>
                        Staff যোগ করুন — email invite যাবে, তারা password বানিয়ে login করবে
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <Link to="/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
                    <button onClick={() => setShowAdd(!showAdd)} className="btn btn-primary btn-sm">+ Agent যোগ করুন</button>
                </div>
            </div>

            {/* Invite link (email fail হলে) */}
            {inviteLink && (
                <div className="card" style={{ maxWidth: 700, marginBottom: 20, border: '1px solid var(--orange)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--orange)' }}>📋 Invite Link (agent কে পাঠান)</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input readOnly value={inviteLink} style={{ ...input, fontSize: 11 }} />
                        <button onClick={() => copyLink(inviteLink)} className="btn btn-primary btn-sm">Copy</button>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
                        এই link agent কে WhatsApp/messenger এ পাঠান। তারা এখানে password বানাবে।
                    </div>
                </div>
            )}

            {/* Add form */}
            {showAdd && (
                <div className="card" style={{ maxWidth: 700, marginBottom: 20 }}>
                    <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 14 }}>নতুন Agent</h3>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                        <div style={{ flex: 1 }}>
                            <label style={label}>নাম</label>
                            <input style={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Agent নাম" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={label}>Email</label>
                            <input style={input} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="agent@example.com" />
                        </div>
                        <div style={{ width: 120 }}>
                            <label style={label}>Role</label>
                            <select style={input} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                <option value="agent">Agent</option>
                                <option value="manager">Manager</option>
                            </select>
                        </div>
                    </div>

                    {/* Feature permissions */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={label}>কোন feature access দেবেন</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                            {FEATURES.map(f => (
                                <label key={f.key} style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                                    border: `1px solid ${form.permissions.includes(f.key) ? 'var(--accent)' : 'var(--border)'}`,
                                    background: form.permissions.includes(f.key) ? 'var(--accent-dim)' : 'var(--bg-tertiary)',
                                }}>
                                    <input type="checkbox" checked={form.permissions.includes(f.key)} onChange={() => togglePerm(f.key)} />
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 500 }}>{f.label}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{f.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={addAgent} disabled={saving} className="btn btn-primary btn-sm">{saving ? 'পাঠানো হচ্ছে...' : '📧 Invite পাঠান'}</button>
                        <button onClick={() => setShowAdd(false)} className="btn btn-outline btn-sm">বাতিল</button>
                    </div>
                </div>
            )}

            {/* Agents list */}
            {loading ? (
                <div style={{ color: 'var(--text-2)' }}>Loading...</div>
            ) : agents.length === 0 ? (
                <div className="card" style={{ maxWidth: 600, textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>কোনো agent নেই</div>
                    <div style={{ fontSize: 13, color: 'var(--text-3)' }}>"+ Agent যোগ করুন" দিয়ে team তৈরি করুন</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 800 }}>
                    {agents.map(agent => (
                        <div key={agent._id} className="card" style={{ opacity: agent.active ? 1 : 0.6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                                    {agent.name[0]?.toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{agent.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{agent.email}</div>
                                </div>
                                {/* Invite status */}
                                <span style={{
                                    fontSize: 10, padding: '3px 10px', borderRadius: 10,
                                    background: agent.inviteStatus === 'accepted' ? 'var(--green-dim)' : 'var(--orange-dim)',
                                    color: agent.inviteStatus === 'accepted' ? 'var(--green)' : 'var(--orange)'
                                }}>
                                    {agent.inviteStatus === 'accepted' ? '✓ Active' : '⏳ Invite Pending'}
                                </span>
                                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: agent.role === 'manager' ? 'var(--purple-dim)' : 'var(--accent-dim)', color: agent.role === 'manager' ? 'var(--purple)' : 'var(--accent-2)' }}>
                                    {agent.role}
                                </span>
                            </div>

                            {/* Permissions */}
                            <div style={{ marginBottom: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>Feature Access (click করে toggle):</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {FEATURES.map(f => {
                                        const has = (agent.permissions || []).includes(f.key);
                                        return (
                                            <button key={f.key}
                                                onClick={() => updatePerms(agent, has ? agent.permissions.filter(p => p !== f.key) : [...(agent.permissions || []), f.key])}
                                                style={{
                                                    padding: '4px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                                                    border: `1px solid ${has ? 'var(--accent)' : 'var(--border)'}`,
                                                    background: has ? 'var(--accent-dim)' : 'transparent',
                                                    color: has ? 'var(--accent-2)' : 'var(--text-3)',
                                                }}>
                                                {has ? '✓' : '+'} {f.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                                {agent.inviteStatus !== 'accepted' && (
                                    <button onClick={() => resendInvite(agent)} className="btn btn-outline btn-sm" style={{ fontSize: 12 }}>📧 Resend Invite</button>
                                )}
                                <button onClick={() => toggleActive(agent)} className="btn btn-outline btn-sm" style={{ fontSize: 12 }}>
                                    {agent.active ? '⏸ Disable' : '▶ Enable'}
                                </button>
                                <div style={{ flex: 1 }} />
                                <button onClick={() => removeAgent(agent._id)} className="btn btn-danger btn-sm" style={{ fontSize: 12 }}>মুছুন</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}