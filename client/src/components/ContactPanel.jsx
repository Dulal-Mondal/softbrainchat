import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const STAGES = [
    { key: 'new', label: 'New', color: 'var(--text-3)' },
    { key: 'contacted', label: 'Contacted', color: 'var(--accent-2)' },
    { key: 'qualified', label: 'Qualified', color: 'var(--orange)' },
    { key: 'won', label: 'Won', color: 'var(--green)' },
    { key: 'lost', label: 'Lost', color: 'var(--red)' },
];

const PLATFORM_LABELS = { whatsapp: 'WhatsApp', messenger: 'Messenger', instagram: 'Instagram' };

export default function ContactPanel({ contact, onUpdate }) {
    const [agents, setAgents] = useState([]);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', notes: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadAgents();
    }, []);

    useEffect(() => {
        if (contact) setForm({ name: contact.name || '', email: contact.email || '', notes: contact.notes || '' });
    }, [contact]);

    const loadAgents = async () => {
        try {
            const res = await api.get('/agents');
            setAgents((res.agents || res.data?.agents || []).filter(a => a.active));
        } catch (err) { /* silent */ }
    };

    if (!contact) return null;

    // contact এর _id না থাকলে CRM যুক্ত হয়নি — basic info দেখাও
    const hasCrm = !!contact._id;

    const assign = async (agentId) => {
        if (!hasCrm) { toast.error('Contact এখনো sync হয়নি'); return; }
        try {
            await api.post(`/contacts/${contact._id}/assign`, { agentId: agentId || null });
            toast.success(agentId ? 'Assigned!' : 'Unassigned');
            onUpdate?.();
        } catch (err) { toast.error(err.response?.data?.message || err.message); }
    };

    const changeStage = async (stage) => {
        if (!hasCrm) return;
        try {
            await api.patch(`/contacts/${contact._id}/stage`, { stage });
            toast.success('Stage updated');
            onUpdate?.();
        } catch (err) { toast.error(err.message); }
    };

    const saveDetails = async () => {
        if (!hasCrm) { toast.error('Contact এখনো sync হয়নি'); return; }
        setSaving(true);
        try {
            await api.patch(`/contacts/${contact._id}`, form);
            toast.success('Saved!');
            setEditing(false);
            onUpdate?.();
        } catch (err) { toast.error(err.message); }
        finally { setSaving(false); }
    };

    const input = {
        width: '100%', padding: '8px 10px', borderRadius: 7,
        border: '1px solid var(--border-2)', background: 'var(--bg-tertiary)',
        color: 'var(--text)', fontSize: 12, outline: 'none', fontFamily: "'DM Sans',sans-serif",
    };
    const lbl = { fontSize: 11, color: 'var(--text-3)', marginBottom: 4, display: 'block' };
    const sectionTitle = { fontSize: 12, fontWeight: 600, marginBottom: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5 };

    return (
        <div style={{ width: 290, borderLeft: '1px solid var(--border)', background: 'var(--bg-secondary)', overflowY: 'auto', height: '100%' }}>
            <div style={{ padding: 20 }}>

                {/* Avatar + name */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    {contact.profilePic ? (
                        <img src={contact.profilePic} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginBottom: 10 }} />
                    ) : (
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, margin: '0 auto 10px' }}>
                            {contact.name?.[0]?.toUpperCase() || 'C'}
                        </div>
                    )}
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{contact.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{PLATFORM_LABELS[contact.platform]}</div>
                </div>

                {!hasCrm && (
                    <div style={{ fontSize: 11, color: 'var(--orange)', background: 'var(--orange-dim)', padding: 10, borderRadius: 8, marginBottom: 16, lineHeight: 1.5 }}>
                        ⚠️ এই contact এখনো CRM এ sync হয়নি। নতুন message এলে sync হবে।
                    </div>
                )}

                {/* ── Assign to agent ── */}
                <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                    <div style={sectionTitle}>👤 Assigned Agent</div>
                    <select
                        value={contact.assignedTo?._id || ''}
                        onChange={e => assign(e.target.value)}
                        style={input}
                        disabled={!hasCrm}
                    >
                        <option value="">— Unassigned —</option>
                        {agents.map(a => (
                            <option key={a._id} value={a.agentUserId || a._id}>{a.name} ({a.role})</option>
                        ))}
                    </select>
                    {agents.length === 0 && (
                        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 6 }}>
                            কোনো agent নেই — Team page এ যোগ করুন
                        </div>
                    )}
                </div>

                {/* ── Lead stage ── */}
                <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                    <div style={sectionTitle}>📊 Lead Stage</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {STAGES.map(s => (
                            <button key={s.key} onClick={() => changeStage(s.key)} disabled={!hasCrm}
                                style={{
                                    padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: hasCrm ? 'pointer' : 'default',
                                    border: `1px solid ${contact.lead?.stage === s.key ? s.color : 'var(--border)'}`,
                                    background: contact.lead?.stage === s.key ? s.color : 'transparent',
                                    color: contact.lead?.stage === s.key ? '#fff' : 'var(--text-2)',
                                }}>
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* Lead qualification data (ধাপ পরে AI ভরবে) */}
                    {(contact.lead?.problem || contact.lead?.budget || contact.lead?.urgency) && (
                        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-2)', lineHeight: 1.7 }}>
                            {contact.lead.problem && <div>🎯 Problem: {contact.lead.problem}</div>}
                            {contact.lead.urgency && <div>⏱ Urgency: {contact.lead.urgency}</div>}
                            {contact.lead.budget && <div>💰 Budget: {contact.lead.budget}</div>}
                        </div>
                    )}
                </div>

                {/* ── Contact details ── */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={sectionTitle}>📇 Details</span>
                        {hasCrm && !editing && (
                            <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-2)', fontSize: 11, cursor: 'pointer' }}>✏️ Edit</button>
                        )}
                    </div>

                    {editing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div>
                                <label style={lbl}>নাম</label>
                                <input style={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label style={lbl}>Email</label>
                                <input style={input} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                            </div>
                            <div>
                                <label style={lbl}>Notes</label>
                                <textarea style={{ ...input, minHeight: 60, resize: 'vertical' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="এই customer সম্পর্কে note..." />
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={saveDetails} disabled={saving} className="btn btn-primary btn-sm" style={{ flex: 1, fontSize: 12 }}>{saving ? '...' : 'Save'}</button>
                                <button onClick={() => setEditing(false)} className="btn btn-outline btn-sm" style={{ fontSize: 12 }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ fontSize: 12, lineHeight: 2 }}>
                            {contact.phone && <div><span style={{ color: 'var(--text-3)' }}>📞 </span>{contact.phone}</div>}
                            {contact.email && <div><span style={{ color: 'var(--text-3)' }}>✉️ </span>{contact.email}</div>}
                            {contact.notes && (
                                <div style={{ marginTop: 8, padding: 10, background: 'var(--bg-tertiary)', borderRadius: 7, fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6 }}>
                                    📝 {contact.notes}
                                </div>
                            )}
                            {!contact.phone && !contact.email && !contact.notes && (
                                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>আরও তথ্য যোগ করতে Edit চাপুন</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}