import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── বনিক-অনুপ্রাণিত landing page — SoftBrainChat features সহ ──
export default function Landing() {
    const { isLoggedIn } = useAuth();

    return (
        <div style={{ background: 'var(--bg-primary)', color: 'var(--text)', minHeight: '100vh' }}>

            {/* ══════════ NAVBAR ══════════ */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'rgba(11,13,18,0.85)', backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--border)',
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 24 }}>🧠</span>
                        <span style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>SoftBrainChat</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {isLoggedIn ? (
                            <Link to="/dashboard" className="btn btn-primary btn-sm">Dashboard →</Link>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-ghost btn-sm">লগইন</Link>
                                <Link to="/register" className="btn btn-primary btn-sm">ফ্রি শুরু করুন →</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ══════════ HERO ══════════ */}
            <section style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Glow background */}
                <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 800, height: 500, background: 'radial-gradient(ellipse, rgba(59,130,246,0.18), transparent 70%)', pointerEvents: 'none' }} />

                <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center', position: 'relative' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'var(--accent-dim)', border: '1px solid var(--accent)', fontSize: 13, color: 'var(--accent-2)', marginBottom: 24, fontWeight: 500 }}>
                        🇧🇩 বাংলাদেশের #১ AI বিজনেস চ্যাট সফটওয়্যার
                    </div>

                    <h1 style={{ fontFamily: 'Syne', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
                        আপনার ব্যবসার<br />
                        <span style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            AI বিক্রয় প্রতিনিধি
                        </span>
                    </h1>

                    <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'var(--text-2)', lineHeight: 1.7, maxWidth: 640, margin: '0 auto 32px' }}>
                        WhatsApp, Messenger ও Instagram-এ ২৪/৭ AI অটো-রিপ্লাই। কাস্টমার CRM, লিড ম্যানেজমেন্ট,
                        গ্রুপ ব্রডকাস্ট — সব একসাথে। আপনার ব্যবসা নিজে নিজেই কথা বলবে।
                    </p>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                        <Link to="/register" className="btn btn-primary btn-lg">বিনামূল্যে শুরু করুন →</Link>
                        <a href="#features" className="btn btn-outline btn-lg">ফিচার দেখুন</a>
                    </div>

                    <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', fontSize: 13, color: 'var(--text-3)' }}>
                        <span>✓ ক্রেডিট কার্ড লাগবে না</span>
                        <span>✓ Lifetime Free Plan</span>
                        <span>✓ বাংলা সাপোর্ট</span>
                    </div>
                </div>

                {/* Stats bar */}
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 60px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                        {[
                            { num: '৩x', label: 'দ্রুত রেসপন্স' },
                            { num: '২৪/৭', label: 'AI অটো-রিপ্লাই' },
                            { num: '৩টি', label: 'প্ল্যাটফর্ম' },
                            { num: '৯৯.৯%', label: 'আপটাইম' },
                        ].map((s, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                                <div style={{ fontFamily: 'Syne', fontSize: 30, fontWeight: 800, color: 'var(--accent-2)' }}>{s.num}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════ TRUST BAR ══════════ */}
            <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', padding: '20px 0', overflow: 'hidden' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>যেসব ব্যবসায় ব্যবহৃত হচ্ছে</div>
                    <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', fontSize: 14, color: 'var(--text-2)' }}>
                        <span>🛍️ ই-কমার্স</span>
                        <span>👗 ফ্যাশন</span>
                        <span>🍽️ রেস্তোরাঁ</span>
                        <span>💄 বিউটি</span>
                        <span>📚 কোচিং</span>
                        <span>🏪 রিটেইল</span>
                    </div>
                </div>
            </section>

            {/* ══════════ FEATURES ══════════ */}
            <section id="features" style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 24px' }}>
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <div style={{ fontSize: 13, color: 'var(--accent-2)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>ফিচারসমূহ</div>
                    <h2 style={{ fontFamily: 'Syne', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>
                        একটি প্ল্যাটফর্মে সব প্রয়োজন
                    </h2>
                    <p style={{ fontSize: 16, color: 'var(--text-2)' }}>AI চ্যাট থেকে CRM — ব্যবসার সব ডিজিটাল সমাধান এক জায়গায়।</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
                    {[
                        { icon: '🤖', title: 'AI অটো-রিপ্লাই', desc: 'WhatsApp, Messenger ও Instagram-এ কাস্টমারের প্রশ্নের তাৎক্ষণিক বুদ্ধিমান উত্তর। আপনার ব্যবসার তথ্য দিয়ে প্রশিক্ষিত।', badge: 'জনপ্রিয়' },
                        { icon: '💬', title: 'ইউনিফায়েড ইনবক্স', desc: 'তিন প্ল্যাটফর্মের সব মেসেজ এক জায়গায়। কাস্টমারের ছবি, অর্ডার, কথোপকথন — সব একসাথে দেখুন।' },
                        { icon: '📋', title: 'স্মার্ট CRM', desc: 'প্রতি কাস্টমারের প্রোফাইল অটো-তৈরি। নিজের প্রয়োজন অনুযায়ী কলাম বানান, AI কথোপকথন থেকে তথ্য বের করে।' },
                        { icon: '🎯', title: 'লিড কোয়ালিফিকেশন', desc: 'AI কথোপকথন পড়ে কাস্টমারের সমস্যা, বাজেট ও আগ্রহ বের করে। কোন লিড গরম, কোনটা ঠান্ডা — সব বুঝুন।' },
                        { icon: '📢', title: 'গ্রুপ ব্রডকাস্ট', desc: 'একসাথে হাজার কাস্টমারকে মেসেজ। গ্রুপ তৈরি করে টার্গেটেড ক্যাম্পেইন। WhatsApp টেমপ্লেট সাপোর্ট।' },
                        { icon: '📥', title: 'CSV/Excel ইমপোর্ট', desc: 'পুরনো কাস্টমার লিস্ট ইমপোর্ট করুন। বাংলাদেশি নম্বর অটো-ফরম্যাট। গ্রুপ ধরে সাজান।' },
                        { icon: '👥', title: 'টিম ও এজেন্ট', desc: 'একাধিক স্টাফ যোগ করুন। কথোপকথন এজেন্টদের অ্যাসাইন করুন। প্রতি এজেন্ট শুধু তার কাজ দেখবে।' },
                        { icon: '📦', title: 'অর্ডার ম্যানেজমেন্ট', desc: 'AI চ্যাট থেকেই অর্ডার নিন। স্ট্যাটাস ট্র্যাক করুন। কাস্টমারকে অটো আপডেট পাঠান।' },
                        { icon: '📊', title: 'গ্রাফিক্যাল অ্যানালিটিক্স', desc: 'মেসেজ, লিড, অর্ডার — সব রিপোর্ট সুন্দর চার্টে। ব্যবসার পূর্ণ চিত্র এক নজরে।' },
                    ].map((f, i) => (
                        <div key={i} className="card" style={{ position: 'relative' }}>
                            {f.badge && (
                                <span style={{ position: 'absolute', top: 16, right: 16, fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 12, background: 'var(--accent-dim)', color: 'var(--accent-2)' }}>{f.badge}</span>
                            )}
                            <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                            <h3 style={{ fontFamily: 'Syne', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                            <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.65 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════════ HOW IT WORKS ══════════ */}
            <section style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto', padding: '72px 24px' }}>
                    <div style={{ textAlign: 'center', marginBottom: 48 }}>
                        <h2 style={{ fontFamily: 'Syne', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>
                            ৩ ধাপে শুরু করুন
                        </h2>
                        <p style={{ fontSize: 16, color: 'var(--text-2)' }}>মিনিটেই সেটআপ, সাথে সাথে কাজ শুরু।</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
                        {[
                            { step: '১', icon: '🔗', title: 'চ্যানেল যুক্ত করুন', desc: 'WhatsApp, Messenger বা Instagram অ্যাকাউন্ট কয়েক ক্লিকে সংযুক্ত করুন।' },
                            { step: '২', icon: '📚', title: 'AI শেখান', desc: 'আপনার পণ্য, সেবা ও ব্যবসার তথ্য দিন। AI সেই অনুযায়ী উত্তর দেবে।' },
                            { step: '৩', icon: '🚀', title: 'বিক্রি শুরু', desc: 'কাস্টমার মেসেজ দিলে AI নিজেই উত্তর দেবে, অর্ডার নেবে, লিড সংগ্রহ করবে।' },
                        ].map((s, i) => (
                            <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
                                <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--accent-dim)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px', position: 'relative' }}>
                                    {s.icon}
                                    <span style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne' }}>{s.step}</span>
                                </div>
                                <h3 style={{ fontFamily: 'Syne', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                                <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6 }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════ PRICING ══════════ */}
            <section style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 24px' }}>
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <div style={{ fontSize: 13, color: 'var(--accent-2)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>মূল্য পরিকল্পনা</div>
                    <h2 style={{ fontFamily: 'Syne', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>
                        সহজ ও স্বচ্ছ মূল্য
                    </h2>
                    <p style={{ fontSize: 16, color: 'var(--text-2)' }}>বিনামূল্যে শুরু করুন, বড় হলে আপগ্রেড করুন।</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, maxWidth: 980, margin: '0 auto' }}>
                    {[
                        {
                            name: 'Free', price: '৳০', tag: 'সারাজীবন বিনামূল্যে', highlight: false,
                            features: ['১টি চ্যানেল', 'মাসে ১০০ মেসেজ', 'বেসিক AI রিপ্লাই', 'ইউনিফায়েড ইনবক্স', '১ জন ব্যবহারকারী']
                        },
                        {
                            name: 'Pro', price: '৳১৫০০', period: '/মাস', tag: 'সবচেয়ে জনপ্রিয়', highlight: true,
                            features: ['৩টি চ্যানেল', 'সীমাহীন মেসেজ', 'অ্যাডভান্সড AI + RAG', 'সম্পূর্ণ CRM', 'গ্রুপ ব্রডকাস্ট', 'লিড কোয়ালিফিকেশন', '৫ জন এজেন্ট']
                        },
                        {
                            name: 'Pro Max', price: '৳৩৫০০', period: '/মাস', tag: 'বড় ব্যবসার জন্য', highlight: false,
                            features: ['সব Pro ফিচার +', 'সীমাহীন চ্যানেল', 'WhatsApp টেমপ্লেট', 'কাস্টম LLM', 'সীমাহীন এজেন্ট', 'অগ্রাধিকার সাপোর্ট']
                        },
                    ].map((p, i) => (
                        <div key={i} className="card" style={{
                            position: 'relative',
                            border: p.highlight ? '2px solid var(--accent)' : '1px solid var(--border)',
                            transform: p.highlight ? 'scale(1.03)' : 'none',
                        }}>
                            {p.highlight && (
                                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '4px 14px', borderRadius: 12, whiteSpace: 'nowrap' }}>
                                    ⭐ {p.tag}
                                </div>
                            )}
                            {!p.highlight && (
                                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>{p.tag}</div>
                            )}
                            <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, marginBottom: 8, marginTop: p.highlight ? 8 : 0 }}>{p.name}</div>
                            <div style={{ marginBottom: 20 }}>
                                <span style={{ fontFamily: 'Syne', fontSize: 36, fontWeight: 800, color: p.highlight ? 'var(--accent-2)' : 'var(--text)' }}>{p.price}</span>
                                {p.period && <span style={{ fontSize: 14, color: 'var(--text-3)' }}>{p.period}</span>}
                            </div>
                            <Link to="/register" className={p.highlight ? 'btn btn-primary' : 'btn btn-outline'} style={{ width: '100%', marginBottom: 20 }}>
                                {p.price === '৳০' ? 'বিনামূল্যে শুরু' : '১৪ দিন ট্রায়াল'}
                            </Link>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {p.features.map((f, j) => (
                                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
                                        <span style={{ color: 'var(--green)' }}>✓</span> {f}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                {/* <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-3)', marginTop: 24 }}>
                    ১৪ দিনের ট্রায়াল। ক্রেডিট কার্ড লাগবে না। যেকোনো সময় বাতিল।
                </p> */}
            </section>

            {/* ══════════ TESTIMONIALS ══════════ */}
            <section style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 24px' }}>
                    <div style={{ textAlign: 'center', marginBottom: 48 }}>
                        <h2 style={{ fontFamily: 'Syne', fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>
                            ব্যবসায়ীরা কী বলছেন
                        </h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
                        {[
                            { text: 'রাতেও কাস্টমার মেসেজ দিলে AI নিজেই উত্তর দেয়, অর্ডার নেয়। আমার বিক্রি ৪০% বেড়েছে!', name: 'সাদিয়া আক্তার', biz: 'ফ্যাশন হাউস, ঢাকা' },
                            { text: 'তিন প্ল্যাটফর্মের মেসেজ এক জায়গায় দেখতে পারি। টিমকে কাজ ভাগ করে দিতে পারি। দারুণ সিস্টেম।', name: 'রফিকুল ইসলাম', biz: 'ইলেকট্রনিক্স, চট্টগ্রাম' },
                            { text: 'CSV দিয়ে পুরনো কাস্টমার ইমপোর্ট করে ব্রডকাস্ট করি। ঈদের অফার হাজার জনকে এক ক্লিকে পাঠাই।', name: 'মেহেদি হাসান', biz: 'বিউটি প্রোডাক্টস, সিলেট' },
                        ].map((t, i) => (
                            <div key={i} className="card">
                                <div style={{ color: 'var(--orange)', fontSize: 14, marginBottom: 12 }}>★★★★★</div>
                                <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, marginBottom: 16 }}>"{t.text}"</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700 }}>
                                        {t.name[0]}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.biz}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════════ FINAL CTA ══════════ */}
            <section style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px', textAlign: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', width: 500, height: 300, background: 'radial-gradient(ellipse, rgba(59,130,246,0.15), transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative' }}>
                    <h2 style={{ fontFamily: 'Syne', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
                        আজই আপনার ব্যবসা<br />ডিজিটাল করুন
                    </h2>
                    <p style={{ fontSize: 17, color: 'var(--text-2)', marginBottom: 32, lineHeight: 1.6 }}>
                        হাজার ব্যবসা ইতোমধ্যে AI দিয়ে কাস্টমার সামলাচ্ছে। আপনিও যোগ দিন।
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/register" className="btn btn-primary btn-lg">বিনামূল্যে শুরু করুন →</Link>
                        <a href="https://wa.me/8801848621196" className="btn btn-outline btn-lg" target="_blank" rel="noreferrer">💬 WhatsApp এ কথা বলুন</a>
                    </div>
                </div>
            </section>

            {/* ══════════ FOOTER ══════════ */}
            <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, marginBottom: 32 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <span style={{ fontSize: 22 }}>🧠</span>
                                <span style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 800 }}>SoftBrainChat</span>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
                                বাংলাদেশের ব্যবসার জন্য AI চ্যাট, অটো-রিপ্লাই ও CRM সমাধান।
                            </p>
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>প্রোডাক্ট</div>
                            {['AI চ্যাট', 'অটো-রিপ্লাই', 'CRM', 'ব্রডকাস্ট'].map(x => (
                                <div key={x} style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 8 }}>{x}</div>
                            ))}
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>কোম্পানি</div>
                            {['আমাদের সম্পর্কে', 'যোগাযোগ', 'শর্তাবলী', 'গোপনীয়তা'].map(x => (
                                <div key={x} style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 8 }}>{x}</div>
                            ))}
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>যোগাযোগ</div>
                            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 8 }}>📍 ঢাকা, বাংলাদেশ</div>
                            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 8 }}>💬 WhatsApp সাপোর্ট</div>
                            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>✉️ support@softbrainchat.com</div>
                        </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>
                        © 2026 SoftBrainChat · 🇧🇩 Made in Bangladesh
                    </div>
                </div>
            </footer>
        </div>
    );
}