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
    const [newTag, setNewTag] = useState('');
    const [tagSuggestions, setTagSuggestions] = useState([]);

    useEffect(() => {
        loadAgents();
        loadTagSuggestions();
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

    const loadTagSuggestions = async () => {
        try {
            const res = await api.get('/contacts/meta/tags');
            setTagSuggestions(res.tags || res.data?.tags || []);
        } catch (err) { /* silent */ }
    };

    const addTag = async (tagValue) => {
        const tag = (tagValue || newTag).trim();
        if (!tag || !contact?._id) return;
        try {
            await api.post(`/contacts/${contact._id}/tags`, { tag });
            setNewTag('');
            onUpdate?.();
            loadTagSuggestions();
        } catch (err) { toast.error(err.message); }
    };

    const removeTag = async (tag) => {
        if (!contact?._id) return;
        try {
            await api.delete(`/contacts/${contact._id}/tags/${encodeURIComponent(tag)}`);
            onUpdate?.();
        } catch (err) { toast.error(err.message); }
    };

    const [analyzing, setAnalyzing] = useState(false);
    const analyzeLead = async () => {
        if (!contact?._id) { toast.error('Contact এখনো sync হয়নি'); return; }
        setAnalyzing(true);
        try {
            await api.post(`/contacts/${contact._id}/analyze`);
            toast.success('🤖 Lead analyzed!');
            onUpdate?.();
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally { setAnalyzing(false); }
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={sectionTitle}>📊 Lead Stage</span>
                        <button onClick={analyzeLead} disabled={!hasCrm || analyzing}
                            style={{ background: 'none', border: '1px solid var(--accent)', color: 'var(--accent-2)', fontSize: 10, cursor: hasCrm ? 'pointer' : 'default', padding: '3px 8px', borderRadius: 6 }}>
                            {analyzing ? '🤖 ...' : '🤖 Analyze Lead'}
                        </button>
                    </div>
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

                    {/* AI extract করা lead data */}
                    {(contact.lead?.summary || contact.lead?.problem || contact.lead?.score > 0) && (
                        <div style={{ marginTop: 14, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                            {/* Score + interest */}
                            {(contact.lead?.score > 0 || contact.lead?.interest) && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                    {contact.lead?.score > 0 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Score</span>
                                            <span style={{
                                                fontSize: 16, fontWeight: 700, fontFamily: 'Syne',
                                                color: contact.lead.score >= 70 ? 'var(--green)' : contact.lead.score >= 40 ? 'var(--orange)' : 'var(--text-3)',
                                            }}>
                                                {contact.lead.score}
                                            </span>
                                        </div>
                                    )}
                                    {contact.lead?.interest && (
                                        <span style={{
                                            fontSize: 10, padding: '3px 8px', borderRadius: 10, textTransform: 'capitalize',
                                            background: contact.lead.interest === 'hot' ? 'var(--red-dim)' : contact.lead.interest === 'warm' ? 'var(--orange-dim)' : 'var(--bg-secondary)',
                                            color: contact.lead.interest === 'hot' ? 'var(--red)' : contact.lead.interest === 'warm' ? 'var(--orange)' : 'var(--text-3)',
                                        }}>
                                            {contact.lead.interest === 'hot' ? '🔥' : contact.lead.interest === 'warm' ? '☀️' : '❄️'} {contact.lead.interest}
                                        </span>
                                    )}
                                </div>
                            )}

                            {contact.lead?.summary && (
                                <div style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.6, marginBottom: 8, fontStyle: 'italic' }}>
                                    "{contact.lead.summary}"
                                </div>
                            )}

                            <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.8 }}>
                                {contact.lead?.problem && <div>🎯 <strong>সমস্যা:</strong> {contact.lead.problem}</div>}
                                {contact.lead?.urgency && contact.lead.urgency !== 'unknown' && <div>⏱ <strong>Urgency:</strong> {contact.lead.urgency}</div>}
                                {contact.lead?.budget && <div>💰 <strong>Budget:</strong> {contact.lead.budget}</div>}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Tags / Segments ── */}
                <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                    <div style={sectionTitle}>🏷️ Tags</div>

                    {/* Current tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                        {(contact.tags || []).length === 0 && (
                            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>কোনো tag নেই</span>
                        )}
                        {(contact.tags || []).map(tag => (
                            <span key={tag} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                padding: '3px 8px', borderRadius: 12, fontSize: 11,
                                background: 'var(--accent-dim)', color: 'var(--accent-2)',
                            }}>
                                {tag}
                                <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: 'var(--accent-2)', cursor: 'pointer', padding: 0, fontSize: 12, lineHeight: 1 }}>×</button>
                            </span>
                        ))}
                    </div>

                    {/* Add tag */}
                    <div style={{ display: 'flex', gap: 6 }}>
                        <input
                            value={newTag}
                            onChange={e => setNewTag(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') addTag(); }}
                            placeholder="নতুন tag..."
                            style={{ ...input, flex: 1 }}
                            disabled={!hasCrm}
                            list="tag-suggestions"
                        />
                        <datalist id="tag-suggestions">
                            {tagSuggestions.map(t => <option key={t} value={t} />)}
                        </datalist>
                        <button onClick={() => addTag()} disabled={!hasCrm} className="btn btn-primary btn-sm" style={{ fontSize: 12 }}>+</button>
                    </div>

                    {/* Quick tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                        {['VIP', 'New Lead', 'Hot', 'Follow-up'].filter(t => !(contact.tags || []).includes(t)).map(t => (
                            <button key={t} onClick={() => addTag(t)} disabled={!hasCrm}
                                style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, border: '1px dashed var(--border-2)', background: 'transparent', color: 'var(--text-3)', cursor: hasCrm ? 'pointer' : 'default' }}>
                                + {t}
                            </button>
                        ))}
                    </div>
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