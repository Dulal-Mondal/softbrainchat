import { Link } from 'react-router-dom';

const FEATURES = [
    { icon: '🤖', title: 'RAG-Powered AI Chat', desc: 'LangChain + Pinecone দিয়ে নিজের documents থেকে accurate AI উত্তর পাবেন।' },
    { icon: '💬', title: 'Meta Auto-Reply', desc: 'WhatsApp, Messenger, Instagram এ customer কে AI automatically reply দেবে।' },
    { icon: '📁', title: 'Knowledge Base', desc: 'PDF, DOCX, TXT upload বা website URL দিন — AI সেটা থেকে শিখবে।' },
    { icon: '🔌', title: 'Custom LLM Providers', desc: 'OpenAI, Anthropic, Gemini — নিজের API key দিয়ে যেকোনো model ব্যবহার করুন।' },
    { icon: '🔔', title: 'Smart Notifications', desc: 'AI উত্তর না দিতে পারলে notify করবে। Human review queue এ চলে যাবে।' },
    { icon: '🛡️', title: 'Multi-User + Admin', desc: 'Admin dashboard থেকে সব user manage করুন, plan override করুন।' },
];

const PLANS = [
    {
        name: 'Free',
        price: '$0',
        period: 'forever',
        popular: false,
        accent: 'var(--border)',
        features: [
            { ok: true, text: 'AI Chat (LLM access)' },
            { ok: true, text: '100 messages/month' },
            { ok: true, text: '1 Knowledge file' },
            { ok: false, text: 'Meta Auto-Reply' },
            { ok: false, text: 'Custom LLM keys' },
            { ok: false, text: 'Chat Flows' },
        ],
        cta: 'Get Started',
        link: '/register?plan=free',
        btn: 'btn-outline',
    },
    {
        name: 'Pro',
        price: '$29',
        period: 'month',
        popular: true,
        accent: 'var(--accent)',
        features: [
            { ok: true, text: 'Everything in Free' },
            { ok: true, text: '5,000 messages/month' },
            { ok: true, text: 'Meta Auto-Reply (3 channels)' },
            { ok: true, text: '20 files + 10 URLs (RAG)' },
            { ok: true, text: 'Custom LLM API keys' },
            { ok: true, text: 'Chat Flows (5)' },
        ],
        cta: 'Start Pro',
        link: '/register?plan=pro',
        btn: 'btn-primary',
    },
    {
        name: 'Pro Max',
        price: '$79',
        period: 'month',
        popular: false,
        accent: 'var(--purple)',
        features: [
            { ok: true, text: 'Everything in Pro' },
            { ok: true, text: 'Unlimited messages' },
            { ok: true, text: 'Unlimited Meta channels' },
            { ok: true, text: 'Unlimited RAG files & URLs' },
            { ok: true, text: 'Unlimited Chat Flows' },
            { ok: true, text: 'Priority support' },
        ],
        cta: 'Go Pro Max',
        link: '/register?plan=pro-max',
        btn: 'btn-primary',
    },
];

export default function Landing() {
    return (
        <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', color: 'var(--text)' }}>

            {/* ── Navbar ── */}
            <nav style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 40px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}>
                <span style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, color: 'var(--accent-2)' }}>
                    SoftBrainChat
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
                    <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section style={{ textAlign: 'center', padding: '72px 20px 56px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--accent-dim)',
                    border: '1px solid var(--accent)',
                    borderRadius: 20,
                    padding: '4px 16px',
                    fontSize: 12,
                    color: 'var(--accent-2)',
                    marginBottom: 22,
                }}>
                    AI Platform of Softbrain AI
                </div>

                <h1 style={{
                    fontFamily: 'Syne',
                    fontSize: 46,
                    fontWeight: 700,
                    lineHeight: 1.12,
                    marginBottom: 18,
                    color: 'var(--text)',
                }}>
                    AI Chat + Auto Social<br />Replies, One Platform
                </h1>

                <p style={{
                    fontSize: 16,
                    color: 'var(--text-2)',
                    maxWidth: 520,
                    margin: '0 auto 34px',
                    lineHeight: 1.7,
                }}>
                    RAG-powered AI chatbot আপনার business এর জন্য —
                    WhatsApp, Messenger ও Instagram এ automatic customer reply সহ।
                </p>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/register" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: 15 }}>
                        Start Free →
                    </Link>
                    <Link to="/login" className="btn btn-outline" style={{ padding: '12px 28px', fontSize: 15 }}>
                        Login
                    </Link>

                    <Link to="/privacy-policy" className="btn btn-outline" style={{ padding: '12px 28px', fontSize: 15 }}>
                        Privacy-policy
                    </Link>
                </div>
            </section>

            {/* ── Features ── */}
            <section style={{ padding: '64px 40px', maxWidth: 1000, margin: '0 auto' }}>
                <h2 style={{ fontFamily: 'Syne', fontSize: 30, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
                    Everything You Need
                </h2>
                <p style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: 14, marginBottom: 40 }}>
                    Two powerful modules, one unified platform
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {FEATURES.map((f, i) => (
                        <div key={i} className="card" style={{ padding: 22 }}>
                            <div style={{ fontSize: 30, marginBottom: 12 }}>{f.icon}</div>
                            <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                                {f.title}
                            </h3>
                            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>
                                {f.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Pricing ── */}
            <section style={{ padding: '20px 40px 80px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                    <h2 style={{ fontFamily: 'Syne', fontSize: 30, fontWeight: 700, textAlign: 'center', marginBottom: 8, paddingTop: 48 }}>
                        Simple Pricing
                    </h2>
                    <p style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: 14, marginBottom: 40 }}>
                        Start free, upgrade when you grow
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
                        {PLANS.map((p, i) => (
                            <div
                                key={i}
                                style={{
                                    background: 'var(--bg-primary)',
                                    border: `1px solid ${p.popular ? p.accent : 'var(--border)'}`,
                                    borderRadius: 16,
                                    padding: 26,
                                    position: 'relative',
                                }}
                            >
                                {p.popular && (
                                    <div style={{
                                        position: 'absolute',
                                        top: -12,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'var(--accent)',
                                        color: '#fff',
                                        fontSize: 10,
                                        fontWeight: 600,
                                        padding: '4px 14px',
                                        borderRadius: 10,
                                        whiteSpace: 'nowrap',
                                    }}>
                                        Most Popular
                                    </div>
                                )}

                                <div style={{ fontFamily: 'Syne', fontSize: 17, fontWeight: 600, marginBottom: 6 }}>
                                    {p.name}
                                </div>
                                <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'Syne', color: p.accent, lineHeight: 1 }}>
                                    {p.price}
                                    <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-3)', fontFamily: "'DM Sans', sans-serif" }}>
                                        {' '}/ {p.period}
                                    </span>
                                </div>

                                <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {p.features.map((f, j) => (
                                        <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: f.ok ? 'var(--text)' : 'var(--text-3)' }}>
                                            <span style={{ color: f.ok ? 'var(--green)' : 'var(--text-3)', flexShrink: 0, fontSize: 13, marginTop: 1 }}>
                                                {f.ok ? '✓' : '✗'}
                                            </span>
                                            {f.text}
                                        </div>
                                    ))}
                                </div>

                                <Link
                                    to={p.link}
                                    className={`btn ${p.btn}`}
                                    style={{ width: '100%', display: 'block', textAlign: 'center', padding: 10 }}
                                >
                                    {p.cta}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer style={{
                borderTop: '1px solid var(--border)',
                padding: '20px 40px',
                textAlign: 'center',
                fontSize: 12,
                color: 'var(--text-3)',
                background: 'var(--bg-primary)',
            }}>
                © 2026 SoftBrainChat — All rights reserved.
            </footer>
        </div>
    );
}