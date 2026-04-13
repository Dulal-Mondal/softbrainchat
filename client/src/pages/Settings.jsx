import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePlan } from '../context/PlanContext';
import { knowledgeService } from '../services/knowledgeService';
import api from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const BUILTIN_MODELS = [
    { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI' },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenAI' },
    { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
];

export default function Settings() {
    const { user, refreshUser } = useAuth();
    const { theme, toggleTheme, isDark } = useTheme();
    const { plan, canAccess } = usePlan();

    // Profile
    const [name, setName] = useState(user?.name || '');
    const [saving, setSaving] = useState(false);

    // LLM providers
    const [providers, setProviders] = useState(user?.llmProviders || []);
    const [newProvName, setNewProvName] = useState('');
    const [newProvKey, setNewProvKey] = useState('');
    const [newProvModel, setNewProvModel] = useState('');
    const [addingProv, setAddingProv] = useState(false);

    // Default model
    const [defaultModel, setDefaultModel] = useState(user?.preferences?.defaultModel || 'gpt-4o');

    // Knowledge base
    const [kbItems, setKbItems] = useState([]);
    const [urlInput, setUrlInput] = useState('');
    const [addingUrl, setAddingUrl] = useState(false);

    useEffect(() => { loadKB(); }, []);

    const loadKB = async () => {
        try { const d = await knowledgeService.getAll(); setKbItems(d.items); } catch { }
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            await api.patch('/auth/profile', { name });
            await refreshUser();
            toast.success('Profile updated');
        } catch (err) { toast.error(err.message); }
        finally { setSaving(false); }
    };

    const saveDefaultModel = async (model) => {
        setDefaultModel(model);
        try {
            await api.patch('/auth/preferences', { defaultModel: model });
            await refreshUser();
            toast.success('Default model updated');
        } catch (err) { toast.error(err.message); }
    };

    const addProvider = async (e) => {
        e.preventDefault();
        if (!newProvName || !newProvKey) { toast.error('Name and API Key required'); return; }
        try {
            await api.post('/auth/llm-provider', { name: newProvName, apiKey: newProvKey, model: newProvModel });
            await refreshUser();
            setNewProvName(''); setNewProvKey(''); setNewProvModel(''); setAddingProv(false);
            setProviders(prev => [...prev, { name: newProvName, model: newProvModel }]);
            toast.success('Provider added');
        } catch (err) { toast.error(err.message); }
    };

    const removeProvider = async (id) => {
        try {
            await api.delete(`/auth/llm-provider/${id}`);
            await refreshUser();
            toast.success('Provider removed');
        } catch (err) { toast.error(err.message); }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        try {
            toast.loading('Uploading...', { id: 'su' });
            await knowledgeService.uploadFile(file);
            toast.success('Uploaded! Indexing in background...', { id: 'su' });
            loadKB();
        } catch (err) { toast.error(err.message, { id: 'su' }); }
    };

    const handleAddUrl = async (e) => {
        e.preventDefault();
        if (!urlInput.trim()) return;
        try {
            toast.loading('Scraping...', { id: 'surl' });
            await knowledgeService.addUrl(urlInput.trim());
            toast.success('URL added!', { id: 'surl' });
            setUrlInput(''); setAddingUrl(false); loadKB();
        } catch (err) { toast.error(err.message, { id: 'surl' }); }
    };

    const deleteKBItem = async (id) => {
        if (!confirm('Delete this knowledge source?')) return;
        try {
            await knowledgeService.delete(id);
            toast.success('Deleted');
            loadKB();
        } catch (err) { toast.error(err.message); }
    };

    const inputStyle = {
        width: '100%', padding: '8px 12px', borderRadius: 8,
        border: '1px solid var(--border-2)', background: 'var(--bg-tertiary)',
        color: 'var(--text)', fontSize: 13, outline: 'none',
        fontFamily: "'DM Sans',sans-serif",
    };
    const labelStyle = { display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 5, fontWeight: 500 };
    const sectionTitle = { fontFamily: 'Syne', fontSize: 16, fontWeight: 600, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' };

    const allModels = [
        ...BUILTIN_MODELS,
        ...(user?.llmProviders || []).map(p => ({ id: p.name, label: p.name, provider: 'Custom' })),
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 32 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700 }}>⚙️ Settings</h1>
                <Link to="/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
            </div>

            <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 28 }}>

                {/* ── Appearance ─────────────────────────────────────── */}
                <div className="card">
                    <h2 style={sectionTitle}>Appearance</h2>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>Theme</div>
                            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>
                                Currently: <strong>{isDark ? 'Dark' : 'Light'} Mode</strong>
                            </div>
                        </div>
                        <button onClick={toggleTheme} className="btn btn-outline" style={{ gap: 8 }}>
                            {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
                        </button>
                    </div>
                </div>

                {/* ── Profile ────────────────────────────────────────── */}
                <div className="card">
                    <h2 style={sectionTitle}>Profile</h2>
                    <div style={{ marginBottom: 14 }}>
                        <label style={labelStyle}>Display Name</label>
                        <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Email</label>
                        <input style={{ ...inputStyle, opacity: .6, cursor: 'not-allowed' }} value={user?.email || ''} readOnly />
                    </div>
                    <button onClick={saveProfile} className="btn btn-primary" disabled={saving} style={{ fontSize: 13 }}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                {/* ── Default Model ───────────────────────────────────── */}
                <div className="card">
                    <h2 style={sectionTitle}>Default AI Model</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {allModels.map(m => (
                            <div key={m.id}
                                onClick={() => saveDefaultModel(m.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                                    borderRadius: 8, cursor: 'pointer', border: `1px solid ${defaultModel === m.id ? 'var(--accent)' : 'var(--border)'}`,
                                    background: defaultModel === m.id ? 'var(--accent-dim)' : 'var(--bg-tertiary)',
                                    transition: 'all .15s',
                                }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: defaultModel === m.id ? 'var(--accent)' : 'var(--border-2)', flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{m.label}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.provider}</div>
                                </div>
                                {defaultModel === m.id && <span style={{ fontSize: 12, color: 'var(--accent-2)', fontWeight: 500 }}>Default ✓</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Custom LLM Providers ────────────────────────────── */}
                <div className="card">
                    <h2 style={sectionTitle}>
                        Custom LLM Providers
                        {!canAccess('customLLM') && (
                            <span style={{ fontSize: 11, color: 'var(--orange)', fontFamily: "'DM Sans',sans-serif", marginLeft: 8, fontWeight: 400 }}>
                                Pro plan required
                            </span>
                        )}
                    </h2>

                    {canAccess('customLLM') ? (
                        <>
                            {(user?.llmProviders || []).length === 0 && !addingProv && (
                                <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 14 }}>
                                    No custom providers added yet.
                                </p>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                                {(user?.llmProviders || []).map(p => (
                                    <div key={p.id || p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                                        <span style={{ fontSize: 16 }}>🔌</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.model || 'Default model'}</div>
                                        </div>
                                        <button onClick={() => removeProvider(p._id)} className="btn btn-danger btn-sm" style={{ fontSize: 11 }}>Remove</button>
                                    </div>
                                ))}
                            </div>

                            {addingProv ? (
                                <form onSubmit={addProvider} style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg-tertiary)', padding: 14, borderRadius: 10 }}>
                                    <div>
                                        <label style={labelStyle}>Provider Name</label>
                                        <input style={inputStyle} value={newProvName} onChange={e => setNewProvName(e.target.value)} placeholder="e.g. Mistral, Groq" required />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>API Key</label>
                                        <input style={{ ...inputStyle, fontFamily: "'DM Mono',monospace" }} type="password" value={newProvKey} onChange={e => setNewProvKey(e.target.value)} placeholder="sk-..." required />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Model Name (optional)</label>
                                        <input style={inputStyle} value={newProvModel} onChange={e => setNewProvModel(e.target.value)} placeholder="e.g. mistral-medium" />
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button type="submit" className="btn btn-primary btn-sm">Add Provider</button>
                                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setAddingProv(false)}>Cancel</button>
                                    </div>
                                </form>
                            ) : (
                                <button onClick={() => setAddingProv(true)} className="btn btn-outline" style={{ fontSize: 13 }}>
                                    + Add Custom Provider
                                </button>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14 }}>
                                Upgrade to Pro to add custom LLM providers with your own API keys.
                            </p>
                            <Link to="/billing" className="btn btn-primary" style={{ fontSize: 13 }}>Upgrade to Pro →</Link>
                        </div>
                    )}
                </div>

                {/* ── Knowledge Base ──────────────────────────────────── */}
                <div className="card">
                    <h2 style={sectionTitle}>Knowledge Base</h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                        {kbItems.length === 0 && (
                            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No knowledge sources added yet.</p>
                        )}
                        {kbItems.map(k => (
                            <div key={k._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                                <span style={{ fontSize: 18 }}>{k.type === 'file' ? '📄' : '🌐'}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                                        {k.status === 'indexed' ? `✓ Indexed (${k.chunkCount} chunks)` : k.status === 'failed' ? `✗ Failed: ${k.error}` : '⏳ Processing...'}
                                    </div>
                                </div>
                                <button onClick={() => deleteKBItem(k._id)} className="btn btn-danger btn-sm" style={{ fontSize: 11 }}>Remove</button>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <label className="btn btn-outline" style={{ cursor: 'pointer', fontSize: 13 }}>
                            <input type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={handleFileUpload} />
                            📎 Upload File
                        </label>

                        {addingUrl ? (
                            <form onSubmit={handleAddUrl} style={{ display: 'flex', gap: 8, flex: 1 }}>
                                <input style={{ ...inputStyle, flex: 1 }} value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..." autoFocus />
                                <button type="submit" className="btn btn-primary btn-sm">Add</button>
                                <button type="button" className="btn btn-outline btn-sm" onClick={() => setAddingUrl(false)}>✕</button>
                            </form>
                        ) : (
                            <button onClick={() => setAddingUrl(true)} className="btn btn-outline" style={{ fontSize: 13 }}>
                                🌐 Add URL
                            </button>
                        )}
                    </div>

                    <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-3)' }}>
                        Plan limit: {user?.planLimits?.knowledgeFiles === Infinity ? '∞' : user?.planLimits?.knowledgeFiles} files,{' '}
                        {user?.planLimits?.knowledgeUrls === Infinity ? '∞' : user?.planLimits?.knowledgeUrls} URLs
                    </div>
                </div>

                {/* ── Current Plan ────────────────────────────────────── */}
                <div className="card" style={{ border: `1px solid ${plan === 'pro-max' ? 'var(--purple)' : plan === 'pro' ? 'var(--accent)' : 'var(--border)'}` }}>
                    <h2 style={sectionTitle}>Current Plan</h2>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Syne', color: plan === 'pro-max' ? 'var(--purple)' : plan === 'pro' ? 'var(--accent-2)' : 'var(--text-2)' }}>
                                {plan.toUpperCase()} Plan
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
                                {plan === 'free' ? 'Free forever' : 'Monthly subscription via Stripe'}
                            </div>
                        </div>
                        {plan !== 'pro-max' && (
                            <Link to="/billing" className="btn btn-primary" style={{ fontSize: 13 }}>
                                Upgrade →
                            </Link>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}