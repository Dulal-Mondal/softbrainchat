import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import api from '../services/api';

export default function Dashboard() {
    const { user } = useAuth();
    const { plan } = usePlan();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/analytics/dashboard')
            .then(res => setStats(res.stats || res.data?.stats))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const S = stats || {
        messages: { total: 0, aiReplied: 0, humanReplied: 0, reviewNeeded: 0, aiRate: 0 },
        byPlatform: { whatsapp: 0, messenger: 0, instagram: 0 },
        daily: [], channels: 0,
        contacts: { total: 0, leadStages: {} },
        orders: { total: 0, byStatus: {} },
        broadcasts: { total: 0, sent: 0 },
    };

    // ── KPI cards ──
    const kpis = [
        { label: 'Total Messages', value: S.messages.total, icon: '💬', color: 'var(--accent-2)' },
        { label: 'AI Handled', value: `${S.messages.aiRate}%`, icon: '🤖', color: 'var(--green)' },
        { label: 'Contacts', value: S.contacts.total, icon: '👤', color: 'var(--purple)' },
        { label: 'Orders', value: S.orders.total, icon: '📦', color: 'var(--orange)' },
        { label: 'Channels', value: S.channels, icon: '📲', color: 'var(--accent-2)' },
        { label: 'Broadcast Sent', value: S.broadcasts.sent, icon: '📢', color: 'var(--green)' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 32 }}>

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700 }}>
                    Welcome, {user?.name || 'User'}! 👋
                </h1>
                <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>
                    Analytics Overview · <span style={{ color: 'var(--accent-2)', fontWeight: 500 }}>{plan?.toUpperCase()} plan</span>
                </p>
            </div>

            {loading ? (
                <div style={{ color: 'var(--text-3)', fontSize: 14 }}>📊 Analytics load হচ্ছে...</div>
            ) : (
                <>
                    {/* ── KPI Cards ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
                        {kpis.map((k, i) => (
                            <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ fontSize: 28, width: 50, height: 50, borderRadius: 12, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {k.icon}
                                </div>
                                <div>
                                    <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Syne', color: k.color }}>{k.value}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{k.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Charts row 1 ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
                        {/* Daily messages line chart */}
                        <div className="card">
                            <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>📈 গত 7 দিনের Messages</h3>
                            <LineChart data={S.daily} />
                        </div>

                        {/* Platform donut */}
                        <div className="card">
                            <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>📱 Platform</h3>
                            <PlatformDonut data={S.byPlatform} />
                        </div>
                    </div>

                    {/* ── Charts row 2 ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                        {/* Message status bars */}
                        <div className="card">
                            <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>💬 Message Status</h3>
                            <BarRow label="🤖 AI Replied" value={S.messages.aiReplied} total={S.messages.total} color="var(--green)" />
                            <BarRow label="👤 Human Replied" value={S.messages.humanReplied} total={S.messages.total} color="var(--accent-2)" />
                            <BarRow label="⚠️ Need Review" value={S.messages.reviewNeeded} total={S.messages.total} color="var(--orange)" />
                        </div>

                        {/* Lead stages */}
                        <div className="card">
                            <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>📊 Lead Pipeline</h3>
                            {['new', 'contacted', 'qualified', 'won', 'lost'].map(stage => (
                                <BarRow key={stage}
                                    label={stage.charAt(0).toUpperCase() + stage.slice(1)}
                                    value={S.contacts.leadStages[stage] || 0}
                                    total={S.contacts.total}
                                    color={{ new: 'var(--text-3)', contacted: 'var(--accent-2)', qualified: 'var(--orange)', won: 'var(--green)', lost: 'var(--red)' }[stage]}
                                />
                            ))}
                        </div>
                    </div>

                    {/* ── Quick Access ── */}
                    <h2 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Quick Access</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                        {[
                            { icon: '📥', label: 'Inbox', link: '/inbox' },
                            { icon: '📋', label: 'CRM', link: '/crm' },
                            { icon: '📢', label: 'Broadcast', link: '/broadcast' },
                            { icon: '📦', label: 'Orders', link: '/orders' },
                            { icon: '👥', label: 'Team', link: '/agents' },
                            { icon: '📲', label: 'Meta Reply', link: '/meta' },
                        ].map((c, i) => (
                            <Link key={i} to={c.link} className="card" style={{ textDecoration: 'none', color: 'var(--text)', textAlign: 'center', padding: 16 }}>
                                <div style={{ fontSize: 26, marginBottom: 6 }}>{c.icon}</div>
                                <div style={{ fontFamily: 'Syne', fontSize: 13, fontWeight: 600 }}>{c.label}</div>
                            </Link>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ── Line Chart (SVG) ──
function LineChart({ data }) {
    if (!data || data.length === 0) return <div style={{ color: 'var(--text-3)', fontSize: 13, padding: 20 }}>কোনো data নেই</div>;
    const W = 500, H = 180, pad = 30;
    const max = Math.max(...data.map(d => d.total), 1);
    const stepX = (W - pad * 2) / (data.length - 1 || 1);
    const pts = data.map((d, i) => ({
        x: pad + i * stepX,
        y: H - pad - (d.total / max) * (H - pad * 2),
        yAi: H - pad - (d.ai / max) * (H - pad * 2),
        ...d,
    }));
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const lineAi = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yAi}`).join(' ');
    const area = `${line} L ${pts[pts.length - 1].x} ${H - pad} L ${pts[0].x} ${H - pad} Z`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
            <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill="url(#grad)" />
            <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d={lineAi} fill="none" stroke="var(--green)" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
            {pts.map((p, i) => (
                <g key={i}>
                    <circle cx={p.x} cy={p.y} r="3.5" fill="var(--accent)" />
                    <text x={p.x} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--text-3)">{p.date}</text>
                    <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fill="var(--text-2)">{p.total || ''}</text>
                </g>
            ))}
            <text x={pad} y={14} fontSize="9" fill="var(--accent)">— Total</text>
            <text x={pad + 55} y={14} fontSize="9" fill="var(--green)">--- AI</text>
        </svg>
    );
}

// ── Platform Donut (SVG) ──
function PlatformDonut({ data }) {
    const items = [
        { key: 'whatsapp', label: 'WhatsApp', color: '#25D366', icon: '💬' },
        { key: 'messenger', label: 'Messenger', color: '#0084FF', icon: '📘' },
        { key: 'instagram', label: 'Instagram', color: '#E1306C', icon: '📸' },
    ];
    const total = items.reduce((s, it) => s + (data[it.key] || 0), 0);
    if (total === 0) return <div style={{ color: 'var(--text-3)', fontSize: 13, padding: 20, textAlign: 'center' }}>কোনো message নেই</div>;

    let offset = 0;
    const R = 55, C = 2 * Math.PI * R;
    return (
        <div>
            <svg viewBox="0 0 160 160" style={{ width: 140, height: 140, margin: '0 auto', display: 'block' }}>
                {items.map(it => {
                    const val = data[it.key] || 0;
                    const frac = val / total;
                    const dash = frac * C;
                    const seg = (
                        <circle key={it.key} cx="80" cy="80" r={R} fill="none" stroke={it.color} strokeWidth="18"
                            strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-offset}
                            transform="rotate(-90 80 80)" />
                    );
                    offset += dash;
                    return seg;
                })}
                <text x="80" y="78" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--text)" fontFamily="Syne">{total}</text>
                <text x="80" y="95" textAnchor="middle" fontSize="9" fill="var(--text-3)">messages</text>
            </svg>
            <div style={{ marginTop: 12 }}>
                {items.map(it => (
                    <div key={it.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 5 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: it.color }} />
                        <span style={{ flex: 1, color: 'var(--text-2)' }}>{it.icon} {it.label}</span>
                        <span style={{ fontWeight: 600 }}>{data[it.key] || 0}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Horizontal Bar ──
function BarRow({ label, value, total, color }) {
    const pct = total ? Math.round((value / total) * 100) : 0;
    return (
        <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: 'var(--text-2)' }}>{label}</span>
                <span style={{ fontWeight: 600 }}>{value} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>({pct}%)</span></span>
            </div>
            <div style={{ height: 7, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width .5s' }} />
            </div>
        </div>
    );
}