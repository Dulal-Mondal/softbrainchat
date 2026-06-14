import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const FORMAT_OPTIONS = [
    { id: 'softbrainchat', label: 'SoftBrainChat Default', desc: 'সবচেয়ে সহজ — যেকোনো custom OMS এ কাজ করে' },
    { id: 'woocommerce', label: 'WooCommerce', desc: 'WordPress WooCommerce store এর জন্য' },
    { id: 'shopify', label: 'Shopify', desc: 'Shopify store এর জন্য' },
    { id: 'custom', label: 'Custom Field Mapping', desc: 'নিজের OMS এর field নামে map করো' },
];

const AUTH_OPTIONS = [
    { id: 'api_key_header', label: 'API Key (Header)' },
    { id: 'bearer_token', label: 'Bearer Token' },
    { id: 'basic_auth', label: 'Basic Auth (User/Pass)' },
    { id: 'none', label: 'No Authentication' },
];

export default function OmsConfigPanel() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    // Form fields
    const [enabled, setEnabled] = useState(false);
    const [apiUrl, setApiUrl] = useState('');
    const [authType, setAuthType] = useState('api_key_header');
    const [apiKey, setApiKey] = useState('');
    const [apiKeyHeader, setApiKeyHeader] = useState('X-API-Key');
    const [bearerToken, setBearerToken] = useState('');
    const [basicUsername, setBasicUsername] = useState('');
    const [basicPassword, setBasicPassword] = useState('');
    const [payloadFormat, setPayloadFormat] = useState('softbrainchat');

    useEffect(() => { loadConfig(); }, []);

    const loadConfig = async () => {
        try {
            const data = await api.get('/orders/oms-config');
            const c = data.config;
            setConfig(c);
            setEnabled(c.enabled || false);
            setApiUrl(c.apiUrl || '');
            setAuthType(c.authType || 'api_key_header');
            setApiKey(c.apiKey || '');
            setApiKeyHeader(c.apiKeyHeader || 'X-API-Key');
            setBearerToken(c.bearerToken || '');
            setBasicUsername(c.basicUsername || '');
            setBasicPassword(c.basicPassword || '');
            setPayloadFormat(c.payloadFormat || 'softbrainchat');
        } catch (err) {
            console.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch('/orders/oms-config', {
                enabled, apiUrl, authType, apiKey, apiKeyHeader,
                bearerToken, basicUsername, basicPassword, payloadFormat,
            });
            toast.success('OMS config saved!');
            loadConfig();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const data = await api.post('/orders/oms-config/test');
            setTestResult({ success: data.success, message: data.message });
        } catch (err) {
            setTestResult({ success: false, message: err.message });
        } finally {
            setTesting(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '8px 12px', borderRadius: 8,
        border: '1px solid var(--border-2)', background: 'var(--bg-tertiary)',
        color: 'var(--text)', fontSize: 13, outline: 'none',
        fontFamily: "'DM Sans', sans-serif",
    };
    const labelStyle = {
        display: 'block', fontSize: 12,
        color: 'var(--text-2)', marginBottom: 5, fontWeight: 500,
    };
    const sectionStyle = {
        background: 'var(--bg-tertiary)', borderRadius: 10,
        padding: '14px 16px', marginBottom: 14,
    };

    if (loading) return <div style={{ padding: 20, color: 'var(--text-3)', fontSize: 13 }}>Loading...</div>;

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                    <h3 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 600 }}>🔗 OMS Integration</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>
                        Order confirm হলে automatically আপনার OMS software এ পাঠাবে
                    </p>
                </div>

                {/* Last sync status */}
                {config?.lastSyncAt && (
                    <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-3)' }}>
                        Last sync: {new Date(config.lastSyncAt).toLocaleString()}<br />
                        <span style={{ color: config.lastSyncStatus === 'success' ? 'var(--green)' : 'var(--red)' }}>
                            {config.lastSyncStatus === 'success' ? '✓ Success' : `✗ ${config.lastSyncError}`}
                        </span>
                    </div>
                )}
            </div>

            <form onSubmit={handleSave}>

                {/* Enable toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    <div onClick={() => setEnabled(v => !v)}
                        style={{ width: 44, height: 24, borderRadius: 12, background: enabled ? 'var(--accent)' : 'var(--border-2)', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: enabled ? 22 : 2, transition: 'left .2s' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>OMS Integration {enabled ? 'চালু' : 'বন্ধ'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                            {enabled ? 'নতুন order confirm হলে OMS এ পাঠাবে' : 'এখন OMS এ কিছু পাঠাবে না'}
                        </div>
                    </div>
                </div>

                {/* OMS API URL */}
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>OMS API URL *</label>
                    <input style={inputStyle} value={apiUrl} onChange={e => setApiUrl(e.target.value)}
                        placeholder="https://your-oms.com/api/orders" required={enabled} />
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                        Order confirm হলে এই URL এ POST request যাবে
                    </div>
                </div>

                {/* Payload Format */}
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>OMS Software Type</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
                        {FORMAT_OPTIONS.map(f => (
                            <div key={f.id} onClick={() => setPayloadFormat(f.id)}
                                style={{
                                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                                    border: payloadFormat === f.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                                    background: payloadFormat === f.id ? 'var(--accent-dim)' : 'var(--bg-tertiary)',
                                    transition: 'all .15s',
                                }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: payloadFormat === f.id ? 'var(--accent-2)' : 'var(--text)' }}>
                                    {f.label}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{f.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Auth Type */}
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Authentication</label>
                    <select value={authType} onChange={e => setAuthType(e.target.value)}
                        style={{ ...inputStyle, cursor: 'pointer' }}>
                        {AUTH_OPTIONS.map(a => (
                            <option key={a.id} value={a.id}>{a.label}</option>
                        ))}
                    </select>
                </div>

                {/* Auth fields */}
                {authType === 'api_key_header' && (
                    <div style={sectionStyle}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                            <div>
                                <label style={labelStyle}>Header Name</label>
                                <input style={inputStyle} value={apiKeyHeader} onChange={e => setApiKeyHeader(e.target.value)}
                                    placeholder="X-API-Key" />
                            </div>
                            <div>
                                <label style={labelStyle}>API Key</label>
                                <input type="password" style={inputStyle} value={apiKey} onChange={e => setApiKey(e.target.value)}
                                    placeholder={config?.apiKey ? 'নতুন key দিতে চাইলে লিখুন' : 'your-api-key'} />
                            </div>
                        </div>
                    </div>
                )}

                {authType === 'bearer_token' && (
                    <div style={sectionStyle}>
                        <label style={labelStyle}>Bearer Token</label>
                        <input type="password" style={inputStyle} value={bearerToken} onChange={e => setBearerToken(e.target.value)}
                            placeholder={config?.bearerToken ? 'নতুন token দিতে চাইলে লিখুন' : 'your-bearer-token'} />
                    </div>
                )}

                {authType === 'basic_auth' && (
                    <div style={sectionStyle}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <label style={labelStyle}>Username / Consumer Key</label>
                                <input style={inputStyle} value={basicUsername} onChange={e => setBasicUsername(e.target.value)}
                                    placeholder="username" />
                            </div>
                            <div>
                                <label style={labelStyle}>Password / Consumer Secret</label>
                                <input type="password" style={inputStyle} value={basicPassword} onChange={e => setBasicPassword(e.target.value)}
                                    placeholder="password" />
                            </div>
                        </div>
                        {payloadFormat === 'woocommerce' && (
                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
                                💡 WooCommerce: API Key তে <code>ck_xxx:cs_xxx</code> format এ দিন
                            </div>
                        )}
                    </div>
                )}

                {/* Test result */}
                {testResult && (
                    <div style={{
                        padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13,
                        background: testResult.success ? 'var(--green-dim)' : 'var(--red-dim)',
                        color: testResult.success ? 'var(--green)' : 'var(--red)',
                        border: `1px solid ${testResult.success ? 'var(--green)' : 'var(--red)'}`,
                    }}>
                        {testResult.message}
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-outline" onClick={handleTest} disabled={testing || !apiUrl}
                        style={{ flex: 1 }}>
                        {testing ? 'Testing...' : '🔌 Connection Test'}
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 2 }}>
                        {saving ? 'Saving...' : 'Save OMS Config'}
                    </button>
                </div>
            </form>
        </div>
    );
}