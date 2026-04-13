import { useState } from 'react';
import { metaService } from '../../services/metaService';
import toast from 'react-hot-toast';

const PLATFORMS = [
    { id: 'whatsapp', label: 'WhatsApp Business', icon: '💬' },
    { id: 'messenger', label: 'Facebook Messenger', icon: '📘' },
    { id: 'instagram', label: 'Instagram DMs', icon: '📸' },
];

export default function MetaApiForm({ onSuccess, onCancel }) {
    const [platform, setPlatform] = useState('whatsapp');
    const [name, setName] = useState('');
    const [appId, setAppId] = useState('');
    const [appSecret, setAppSecret] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [phoneNumberId, setPhoneNumberId] = useState('');
    const [pageId, setPageId] = useState('');
    const [loading, setLoading] = useState(false);
    const [created, setCreated] = useState(null); // webhook info দেখাবো

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await metaService.addChannel({
                platform, name, appId, appSecret, accessToken,
                ...(platform === 'whatsapp' ? { phoneNumberId } : { pageId }),
            });
            setCreated(data.channel);
            toast.success('Channel added successfully!');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '8px 12px', borderRadius: 8,
        border: '1px solid var(--border-2)', background: 'var(--bg-tertiary)',
        color: 'var(--text)', fontSize: 13, outline: 'none',
        fontFamily: "'DM Mono', monospace",
    };

    const labelStyle = {
        display: 'block', fontSize: 12, color: 'var(--text-2)',
        marginBottom: 5, fontWeight: 500,
    };

    // ── Webhook info screen (after creation) ─────────────────────────────────
    if (created) {
        return (
            <div style={{ padding: 20 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
                <h3 style={{ fontFamily: 'Syne', fontSize: 16, marginBottom: 16 }}>
                    Channel Added! Webhook configure করুন
                </h3>

                <div style={{ marginBottom: 14 }}>
                    <div style={labelStyle}>Webhook URL (Meta console এ paste করুন)</div>
                    <div style={{ ...inputStyle, padding: '8px 12px', background: 'var(--bg-secondary)', wordBreak: 'break-all', fontSize: 12 }}>
                        {created.webhookUrl}
                    </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <div style={labelStyle}>Verify Token</div>
                    <div style={{ ...inputStyle, padding: '8px 12px', background: 'var(--bg-secondary)', fontSize: 13 }}>
                        {created.webhookVerifyToken}
                    </div>
                </div>

                <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--accent-2)', marginBottom: 20, lineHeight: 1.6 }}>
                    <strong>কিভাবে setup করবেন:</strong><br />
                    1. Meta Developer console → App → Webhooks<br />
                    2. উপরের Webhook URL ও Verify Token paste করুন<br />
                    3. Subscribe করুন: <code>messages</code>, <code>messaging_postbacks</code>
                </div>

                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { onSuccess?.(); }}>
                    Done
                </button>
            </div>
        );
    }

    // ── Add Channel Form ──────────────────────────────────────────────────────
    return (
        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
            <h3 style={{ fontFamily: 'Syne', fontSize: 16, marginBottom: 18 }}>
                নতুন Meta Channel Add করুন
            </h3>

            {/* Platform */}
            <div style={{ marginBottom: 16 }}>
                <div style={labelStyle}>Platform</div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {PLATFORMS.map(p => (
                        <div key={p.id}
                            onClick={() => setPlatform(p.id)}
                            style={{
                                flex: 1, padding: '10px 8px', borderRadius: 8, cursor: 'pointer',
                                textAlign: 'center', fontSize: 12, fontWeight: 500,
                                border: platform === p.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                                background: platform === p.id ? 'var(--accent-dim)' : 'var(--bg-tertiary)',
                                color: platform === p.id ? 'var(--accent-2)' : 'var(--text-2)',
                                transition: 'all .15s',
                            }}>
                            <div style={{ fontSize: 20, marginBottom: 4 }}>{p.icon}</div>
                            {p.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Channel Name */}
            <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Channel Name</label>
                <input value={name} onChange={e => setName(e.target.value)} required
                    placeholder="e.g. My Business WhatsApp" style={inputStyle} />
            </div>

            {/* App ID */}
            <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Meta App ID</label>
                <input value={appId} onChange={e => setAppId(e.target.value)} required
                    placeholder="1234567890" style={inputStyle} />
            </div>

            {/* App Secret */}
            <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>App Secret</label>
                <input type="password" value={appSecret} onChange={e => setAppSecret(e.target.value)} required
                    placeholder="••••••••••••" style={inputStyle} />
            </div>

            {/* Platform-specific fields */}
            {platform === 'whatsapp' && (
                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Phone Number ID</label>
                    <input value={phoneNumberId} onChange={e => setPhoneNumberId(e.target.value)} required
                        placeholder="WhatsApp Phone Number ID" style={inputStyle} />
                </div>
            )}

            {(platform === 'messenger' || platform === 'instagram') && (
                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Page ID</label>
                    <input value={pageId} onChange={e => setPageId(e.target.value)} required
                        placeholder="Facebook Page ID" style={inputStyle} />
                </div>
            )}

            {/* Access Token */}
            <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Page Access Token (Long-lived)</label>
                <input value={accessToken} onChange={e => setAccessToken(e.target.value)} required
                    placeholder="EAAxxxxxxxx..." style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onCancel}>
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                    {loading ? 'Adding...' : 'Add Channel →'}
                </button>
            </div>
        </form>
    );
}