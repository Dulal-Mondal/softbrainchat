import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function Agents() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', role: 'agent' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const res = await api.get('/agents');
            setAgents(res.agents || res.data?.agents || []);
        } catch (err) { toast.error(err.message); }
        finally { setLoading(false); }
    };

    const addAgent = async () => {
        if (!form.name.trim() || !form.email.trim()) { toast.error('নাম ও email দিন'); return; }
        setSaving(true);
        try {
            await api.post('/agents', form);
            toast.success('Agent যোগ হয়েছে!');
            setForm({ name: '', email: '', role: 'agent' });
            setShowAdd(false);
            load();
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally { setSaving(false); }
    };

    const toggleActive = async (agent) => {
        try {
            await api.patch(`/agents/${agent._id}`, { active: !agent.active });
            load();
        } catch (err) { toast.error(err.message); }
    };

    const removeAgent = async (id) => {
        if (!confirm('এই agent মুছবেন? তার assigned conversation গুলো unassign হবে।')) return;
        try {
            await api.delete(`/agents/${id}`);
            toast.success('Agent মুছে ফেলা হয়েছে');
            load();
        } catch (err) { toast.error(err.message); }
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
                        Conversation handle করার জন্য staff যোগ করুন
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <Link to="/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
                    <button onClick={() => setShowAdd(!showAdd)} className="btn btn-primary btn-sm">+ Agent যোগ করুন</button>
                </div>
            </div>

            {/* Add form */}
            {showAdd && (
                <div className="card" style={{ maxWidth: 600, marginBottom: 20 }}>
                    <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 14 }}>নতুন Agent</h3>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
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
                    <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 14 }}>
                        💡 Agent এই email দিয়ে SoftBrainChat এ register করলে assigned conversation দেখতে পাবে।
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={addAgent} disabled={saving} className="btn btn-primary btn-sm">{saving ? 'যোগ হচ্ছে...' : 'যোগ করুন'}</button>
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
                    <div style={{ fontSize: 13, color: 'var(--text-3)' }}>উপরে "+ Agent যোগ করুন" দিয়ে team তৈরি করুন</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, maxWidth: 920 }}>
                    {agents.map(agent => (
                        <div key={agent._id} className="card" style={{ opacity: agent.active ? 1 : 0.55 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                                    {agent.name[0]?.toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{agent.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.email}</div>
                                </div>
                                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: agent.role === 'manager' ? 'var(--purple-dim)' : 'var(--accent-dim)', color: agent.role === 'manager' ? 'var(--purple)' : 'var(--accent-2)' }}>
                                    {agent.role}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)', marginBottom: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                                <span>📥 Assigned: <strong style={{ color: 'var(--text)' }}>{agent.assignedCount || 0}</strong></span>
                                <span>✅ Resolved: <strong style={{ color: 'var(--text)' }}>{agent.resolvedCount || 0}</strong></span>
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => toggleActive(agent)} className="btn btn-outline btn-sm" style={{ flex: 1, fontSize: 12 }}>
                                    {agent.active ? '⏸ Disable' : '▶ Enable'}
                                </button>
                                <button onClick={() => removeAgent(agent._id)} className="btn btn-danger btn-sm" style={{ fontSize: 12 }}>মুছুন</button>
                            </div>

                            {!agent.agentUserId && (
                                <div style={{ fontSize: 10, color: 'var(--orange)', marginTop: 10 }}>
                                    ⚠️ এখনো register করেনি — এই email দিয়ে signup করতে বলুন
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}