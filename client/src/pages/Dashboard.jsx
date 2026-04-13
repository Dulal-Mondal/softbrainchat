import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';

export default function Dashboard() {
    const { user } = useAuth();
    const { plan, usage, limits } = usePlan();

    const cards = [
        { icon: '💬', label: 'AI Chat', sub: 'RAG-powered', link: '/chat' },
        { icon: '📲', label: 'Meta Auto-Reply', sub: 'WhatsApp/IG/FB', link: '/meta' },
        { icon: '⚙️', label: 'Settings', sub: 'Model & KB', link: '/settings' },
        { icon: '💳', label: 'Billing', sub: 'Plan & payment', link: '/billing' },
    ];

    const usedPct = limits.messagesPerMonth === Infinity
        ? 0
        : Math.round((usage.messagesThisMonth / limits.messagesPerMonth) * 100);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 32 }}>

            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700 }}>
                    স্বাগতম, {user?.name || 'User'}! 👋
                </h1>
                <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>
                    SoftBrainChat Dashboard ·{' '}
                    <span style={{ color: 'var(--accent-2)', fontWeight: 500 }}>
                        {plan.toUpperCase()} plan
                    </span>
                </p>
            </div>

            {/* Usage stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
                {[
                    { val: usage.messagesThisMonth || 0, lbl: 'Messages This Month' },
                    { val: limits.messagesPerMonth === Infinity ? '∞' : limits.messagesPerMonth, lbl: 'Monthly Limit' },
                    { val: limits.metaChannels === Infinity ? '∞' : limits.metaChannels, lbl: 'Meta Channels' },
                    { val: limits.knowledgeFiles === Infinity ? '∞' : limits.knowledgeFiles, lbl: 'Knowledge Files' },
                ].map((s, i) => (
                    <div key={i} className="card-sm" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Syne', color: 'var(--accent-2)' }}>
                            {s.val}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{s.lbl}</div>
                    </div>
                ))}
            </div>

            {/* Usage bar */}
            {limits.messagesPerMonth !== Infinity && (
                <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>
                        Monthly usage — {usedPct}%
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${usedPct}%` }} />
                    </div>
                </div>
            )}

            {/* Quick access cards */}
            <h2 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 600, marginBottom: 14 }}>
                Quick Access
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {cards.map((c, i) => (
                    <Link
                        key={i}
                        to={c.link}
                        className="card"
                        style={{ textDecoration: 'none', color: 'var(--text)', transition: 'border-color .15s' }}
                    >
                        <div style={{ fontSize: 28, marginBottom: 10 }}>{c.icon}</div>
                        <div style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600 }}>{c.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{c.sub}</div>
                    </Link>
                ))}
            </div>
        </div>
    );
}