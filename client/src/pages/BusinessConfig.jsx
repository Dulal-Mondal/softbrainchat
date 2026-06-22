import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const FIELD_TYPES = [
    { value: 'text', label: 'Text (যেকোনো লেখা)' },
    { value: 'number', label: 'Number (সংখ্যা)' },
    { value: 'phone', label: 'Phone (মোবাইল নম্বর)' },
    { value: 'choice', label: 'Choice (নির্দিষ্ট option)' },
];

export default function BusinessConfig() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const { data } = await api.get('/business-config');
            setConfig(data.config);
        } catch (err) { toast.error(err.message); }
        finally { setLoading(false); }
    };

    const save = async () => {
        setSaving(true);
        try {
            const { data } = await api.patch('/business-config', config);
            setConfig(data.config);
            toast.success('✅ Configuration saved!');
        } catch (err) { toast.error(err.response?.data?.message || err.message); }
        finally { setSaving(false); }
    };

    const update = (key, val) => setConfig(c => ({ ...c, [key]: val }));

    // ── Order field management ──
    const addField = () => {
        const fields = [...(config.orderFields || [])];
        fields.push({
            key: `field_${fields.length + 1}`,
            label: 'New Field',
            prompt: '',
            type: 'text',
            options: [],
            required: true,
            order: fields.length + 1,
        });
        update('orderFields', fields);
    };

    const updateField = (idx, key, val) => {
        const fields = [...config.orderFields];
        fields[idx] = { ...fields[idx], [key]: val };
        update('orderFields', fields);
    };

    const removeField = (idx) => {
        update('orderFields', config.orderFields.filter((_, i) => i !== idx));
    };

    const moveField = (idx, dir) => {
        const fields = [...config.orderFields];
        const ni = idx + dir;
        if (ni < 0 || ni >= fields.length) return;
        [fields[idx], fields[ni]] = [fields[ni], fields[idx]];
        fields.forEach((f, i) => { f.order = i + 1; });
        update('orderFields', fields);
    };

    if (loading) return <div style={{ padding: 32, color: 'var(--text-2)' }}>Loading...</div>;
    if (!config) return null;

    const input = {
        width: '100%', padding: '8px 12px', borderRadius: 8,
        border: '1px solid var(--border-2)', background: 'var(--bg-tertiary)',
        color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: "'DM Sans',sans-serif",
    };
    const label = { display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 5, fontWeight: 500 };
    const title = { fontFamily: 'Syne', fontSize: 16, fontWeight: 600, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700 }}>🏪 Business Setup</h1>
                <Link to="/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
            </div>

            <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* ── Business Info ── */}
                <div className="card">
                    <h2 style={title}>Business তথ্য</h2>
                    <div style={{ marginBottom: 14 }}>
                        <label style={label}>Business Name</label>
                        <input style={input} value={config.businessName || ''} onChange={e => update('businessName', e.target.value)} placeholder="যেমন: Aster Lifestyle" />
                    </div>
                    <div>
                        <label style={label}>Business Type</label>
                        <input style={input} value={config.businessType || ''} onChange={e => update('businessType', e.target.value)} placeholder="যেমন: Clothing, Electronics, Consultancy" />
                    </div>
                </div>

                {/* ── Mode Selection ── */}
                <div className="card">
                    <h2 style={title}>AI কীভাবে কাজ করবে?</h2>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>
                        একটি বা দুটোই চালু করতে পারেন।
                    </p>

                    {/* Service Mode */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: 10, border: `1px solid ${config.serviceMode ? 'var(--accent)' : 'var(--border)'}`, background: config.serviceMode ? 'var(--accent-dim)' : 'var(--bg-tertiary)', marginBottom: 10 }}>
                        <input type="checkbox" checked={config.serviceMode} onChange={e => update('serviceMode', e.target.checked)} style={{ width: 18, height: 18 }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>💬 Service Mode</div>
                            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                                AI আপনার Knowledge Base (RAG) থেকে customer এর প্রশ্নের উত্তর দেবে। Service business এর জন্য।
                            </div>
                        </div>
                    </div>

                    {/* Product Mode */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: 10, border: `1px solid ${config.productMode ? 'var(--accent)' : 'var(--border)'}`, background: config.productMode ? 'var(--accent-dim)' : 'var(--bg-tertiary)' }}>
                        <input type="checkbox" checked={config.productMode} onChange={e => update('productMode', e.target.checked)} style={{ width: 18, height: 18 }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>🛒 Product Mode</div>
                            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                                AI customer এর কাছ থেকে order এর তথ্য নেবে (নিচে field সেট করুন)। Product বিক্রির জন্য।
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Order Fields (শুধু Product Mode চালু থাকলে) ── */}
                {config.productMode && (
                    <div className="card">
                        <h2 style={title}>📋 Order Fields</h2>
                        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>
                            Customer order করলে AI এই তথ্যগুলো একে একে জিজ্ঞেস করবে। আপনি field যোগ/বাদ/সাজাতে পারেন।
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {(config.orderFields || []).map((field, idx) => (
                                <div key={idx} style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={label}>Field Label (customer দেখবে না)</label>
                                            <input style={input} value={field.label} onChange={e => updateField(idx, 'label', e.target.value)} placeholder="যেমন: রং, Brand, Size" />
                                        </div>
                                        <div style={{ width: 130 }}>
                                            <label style={label}>Type</label>
                                            <select style={input} value={field.type} onChange={e => updateField(idx, 'type', e.target.value)}>
                                                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 10 }}>
                                        <label style={label}>AI যে প্রশ্ন করবে</label>
                                        <input style={input} value={field.prompt} onChange={e => updateField(idx, 'prompt', e.target.value)} placeholder="যেমন: আপনার পছন্দের রং লিখুন:" />
                                    </div>

                                    {field.type === 'choice' && (
                                        <div style={{ marginBottom: 10 }}>
                                            <label style={label}>Options (কমা দিয়ে আলাদা করুন)</label>
                                            <input style={input}
                                                value={(field.options || []).join(', ')}
                                                onChange={e => updateField(idx, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                                placeholder="যেমন: S, M, L, XL" />
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <input type="checkbox" checked={field.required} onChange={e => updateField(idx, 'required', e.target.checked)} />
                                            Required
                                        </label>
                                        <div style={{ flex: 1 }} />
                                        <button onClick={() => moveField(idx, -1)} className="btn btn-sm btn-outline" style={{ fontSize: 11 }}>↑</button>
                                        <button onClick={() => moveField(idx, 1)} className="btn btn-sm btn-outline" style={{ fontSize: 11 }}>↓</button>
                                        <button onClick={() => removeField(idx)} className="btn btn-sm btn-danger" style={{ fontSize: 11 }}>মুছুন</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button onClick={addField} className="btn btn-outline" style={{ fontSize: 13, marginTop: 12 }}>+ নতুন Field যোগ করুন</button>

                        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                            <label style={label}>Order Confirm প্রশ্ন</label>
                            <textarea style={{ ...input, minHeight: 60, marginBottom: 12 }} value={config.orderConfirmPrompt || ''} onChange={e => update('orderConfirmPrompt', e.target.value)} />
                            <label style={label}>Order সফল হলে message</label>
                            <textarea style={{ ...input, minHeight: 60 }} value={config.orderSuccessMessage || ''} onChange={e => update('orderSuccessMessage', e.target.value)} />
                        </div>
                    </div>
                )}

                {/* ── Fallback Message ── */}
                <div className="card">
                    <h2 style={title}>AI উত্তর না পেলে</h2>
                    <label style={label}>Fallback Message (customer কে যা বলবে)</label>
                    <textarea style={{ ...input, minHeight: 60 }} value={config.fallbackMessage || ''} onChange={e => update('fallbackMessage', e.target.value)} />
                </div>

                <button onClick={save} disabled={saving} className="btn btn-primary" style={{ fontSize: 14, padding: '12px' }}>
                    {saving ? 'Saving...' : '💾 Configuration Save করুন'}
                </button>
            </div>
        </div>
    );
}