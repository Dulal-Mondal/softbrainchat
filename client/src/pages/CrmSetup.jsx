import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const FIELD_TYPES = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'choice', label: 'Choice' },
];

export default function CrmSetup() {
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            const res = await api.get('/crm-config');
            setFields((res.config || res.data?.config)?.fields || []);
        } catch (err) { toast.error(err.message); }
        finally { setLoading(false); }
    };

    const save = async () => {
        setSaving(true);
        try {
            await api.patch('/crm-config', { fields });
            toast.success('✅ CRM columns saved!');
        } catch (err) { toast.error(err.response?.data?.message || err.message); }
        finally { setSaving(false); }
    };

    const addField = () => {
        setFields([...fields, {
            key: `field_${fields.length + 1}`, label: 'New Column', aiHint: '',
            type: 'text', options: [], showInTable: true, order: fields.length + 1,
        }]);
    };

    const updateField = (idx, key, val) => {
        const f = [...fields];
        f[idx] = { ...f[idx], [key]: val };
        setFields(f);
    };

    const removeField = (idx) => setFields(fields.filter((_, i) => i !== idx));

    const move = (idx, dir) => {
        const f = [...fields];
        const ni = idx + dir;
        if (ni < 0 || ni >= f.length) return;
        [f[idx], f[ni]] = [f[ni], f[idx]];
        f.forEach((x, i) => x.order = i + 1);
        setFields(f);
    };

    const input = {
        width: '100%', padding: '8px 12px', borderRadius: 8,
        border: '1px solid var(--border-2)', background: 'var(--bg-tertiary)',
        color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: "'DM Sans',sans-serif",
    };
    const label = { display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 5, fontWeight: 500 };

    if (loading) return <div style={{ padding: 32, color: 'var(--text-2)' }}>Loading...</div>;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700 }}>⚙️ CRM Setup</h1>
                    <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>
                        আপনার প্রয়োজন অনুযায়ী CRM column তৈরি করুন — AI conversation থেকে এই তথ্য বের করবে
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <Link to="/crm" className="btn btn-outline btn-sm">📋 CRM Table</Link>
                    <Link to="/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
                </div>
            </div>

            <div style={{ maxWidth: 720 }}>
                <div className="card">
                    <h2 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Custom Columns</h2>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 18 }}>
                        যেমন: "আগ্রহী পণ্য", "Budget", "এলাকা", "Size" — যা আপনার ব্যবসায় দরকার।
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {fields.map((field, idx) => (
                            <div key={idx} style={{ padding: 14, background: 'var(--bg-tertiary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={label}>Column নাম</label>
                                        <input style={input} value={field.label} onChange={e => updateField(idx, 'label', e.target.value)} placeholder="যেমন: আগ্রহী পণ্য" />
                                    </div>
                                    <div style={{ width: 110 }}>
                                        <label style={label}>Type</label>
                                        <select style={input} value={field.type} onChange={e => updateField(idx, 'type', e.target.value)}>
                                            {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ marginBottom: 10 }}>
                                    <label style={label}>🤖 AI কে কী বের করতে বলবেন</label>
                                    <input style={input} value={field.aiHint} onChange={e => updateField(idx, 'aiHint', e.target.value)}
                                        placeholder="যেমন: customer কোন পণ্যে আগ্রহী দেখাচ্ছে" />
                                </div>

                                {field.type === 'choice' && (
                                    <div style={{ marginBottom: 10 }}>
                                        <label style={label}>Options (কমা দিয়ে)</label>
                                        <input style={input} value={(field.options || []).join(', ')}
                                            onChange={e => updateField(idx, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                            placeholder="যেমন: ছোট, মাঝারি, বড়" />
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <input type="checkbox" checked={field.showInTable} onChange={e => updateField(idx, 'showInTable', e.target.checked)} />
                                        Table এ দেখাও
                                    </label>
                                    <div style={{ flex: 1 }} />
                                    <button onClick={() => move(idx, -1)} className="btn btn-sm btn-outline" style={{ fontSize: 11 }}>↑</button>
                                    <button onClick={() => move(idx, 1)} className="btn btn-sm btn-outline" style={{ fontSize: 11 }}>↓</button>
                                    <button onClick={() => removeField(idx)} className="btn btn-sm btn-danger" style={{ fontSize: 11 }}>মুছুন</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={addField} className="btn btn-outline" style={{ fontSize: 13, marginTop: 12 }}>+ নতুন Column</button>

                    <button onClick={save} disabled={saving} className="btn btn-primary" style={{ width: '100%', marginTop: 20, padding: 12 }}>
                        {saving ? 'Saving...' : '💾 Save করুন'}
                    </button>
                </div>
            </div>
        </div>
    );
}