import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import { billingService } from '../services/billingService';
import toast from 'react-hot-toast';

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        period: 'forever',
        color: 'var(--border)',
        accent: 'var(--text-2)',
        features: [
            'AI Chat (LLM access)',
            '100 messages/month',
            '1 Knowledge file',
            'Basic RAG',
        ],
        missing: ['Meta Auto-Reply', 'Custom LLM keys', 'Chat Flows'],
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 29,
        period: 'month',
        color: 'var(--accent)',
        accent: 'var(--accent-2)',
        popular: true,
        features: [
            'Everything in Free',
            '5,000 messages/month',
            'Meta Auto-Reply (3 channels)',
            '20 files + 10 URLs (RAG)',
            'Custom LLM API keys',
            'Chat Flows (5)',
        ],
        missing: ['Advanced Chat Flows', 'Priority support'],
    },
    {
        id: 'pro-max',
        name: 'Pro Max',
        price: 79,
        period: 'month',
        color: 'var(--purple)',
        accent: 'var(--purple)',
        features: [
            'Everything in Pro',
            'Unlimited messages',
            'Unlimited Meta channels',
            'Unlimited files & URLs',
            'Unlimited Chat Flows',
            'Priority support',
        ],
        missing: [],
    },
];

export default function Billing() {
    const { user, refreshUser } = useAuth();
    const { plan: currentPlan } = usePlan();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(null);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        loadStatus();

        // Stripe success/cancel redirect
        if (searchParams.get('success')) {
            toast.success('Payment successful! Plan upgraded 🎉');
            refreshUser();
        }
        if (searchParams.get('canceled')) {
            toast.error('Payment canceled');
        }
    }, []);

    const loadStatus = async () => {
        try {
            const data = await billingService.getStatus();
            setStatus(data);
        } catch { }
    };

    const handleUpgrade = async (planId) => {
        if (planId === 'free') return;
        setLoading(planId);
        try {
            const data = await billingService.createCheckout(planId);
            window.location.href = data.url;
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(null);
        }
    };

    const handleManage = async () => {
        setLoading('portal');
        try {
            const data = await billingService.createPortal();
            window.location.href = data.url;
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 32 }}>

            {/* Header */}
            <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700 }}>💳 Billing</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
                        Current plan:{' '}
                        <strong style={{ color: 'var(--accent-2)' }}>{currentPlan.toUpperCase()}</strong>
                    </p>
                </div>
                <Link to="/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
            </div>

            {/* Active subscription info */}
            {status?.subscription && currentPlan !== 'free' && (
                <div style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12,
                    padding: '14px 18px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                            Active Subscription — {currentPlan.toUpperCase()}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>
                            {status.subscription.cancelAtPeriodEnd
                                ? `Cancels on ${new Date(status.subscription.currentPeriodEnd).toLocaleDateString()}`
                                : `Renews on ${new Date(status.subscription.currentPeriodEnd).toLocaleDateString()}`
                            }
                        </div>
                    </div>
                    <button
                        onClick={handleManage}
                        className="btn btn-outline btn-sm"
                        disabled={loading === 'portal'}
                    >
                        {loading === 'portal' ? 'Loading...' : 'Manage Subscription'}
                    </button>
                </div>
            )}

            {/* Plan cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, maxWidth: 900, margin: '0 auto' }}>
                {PLANS.map(p => {
                    const isCurrent = currentPlan === p.id;
                    const isDowngrade = PLANS.findIndex(x => x.id === currentPlan) > PLANS.findIndex(x => x.id === p.id);

                    return (
                        <div key={p.id} style={{
                            background: 'var(--bg-secondary)',
                            border: `1px solid ${isCurrent ? p.color : 'var(--border)'}`,
                            borderRadius: 16,
                            padding: 26,
                            position: 'relative',
                            boxShadow: isCurrent ? `0 0 0 1px ${p.color}33` : 'none',
                        }}>
                            {p.popular && !isCurrent && (
                                <div style={{
                                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                                    background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 600,
                                    padding: '3px 14px', borderRadius: 10, whiteSpace: 'nowrap',
                                }}>
                                    Most Popular
                                </div>
                            )}
                            {isCurrent && (
                                <div style={{
                                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                                    background: p.color, color: '#fff', fontSize: 10, fontWeight: 600,
                                    padding: '3px 14px', borderRadius: 10, whiteSpace: 'nowrap',
                                }}>
                                    Current Plan
                                </div>
                            )}

                            <div style={{ fontFamily: 'Syne', fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{p.name}</div>
                            <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'Syne', color: p.color, lineHeight: 1 }}>
                                ${p.price}
                                <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-3)', fontFamily: "'DM Sans',sans-serif" }}>
                                    {' '}/ {p.period}
                                </span>
                            </div>

                            <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
                                {p.features.map((f, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text)' }}>
                                        <span style={{ color: 'var(--green)', flexShrink: 0, marginTop: 1 }}>✓</span> {f}
                                    </div>
                                ))}
                                {p.missing.map((f, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-3)' }}>
                                        <span style={{ flexShrink: 0, marginTop: 1 }}>✗</span> {f}
                                    </div>
                                ))}
                            </div>

                            {isCurrent ? (
                                <button className="btn btn-outline" style={{ width: '100%' }} disabled>
                                    Current Plan
                                </button>
                            ) : isDowngrade ? (
                                <button className="btn btn-outline" style={{ width: '100%', opacity: .5 }} disabled>
                                    Downgrade via Portal
                                </button>
                            ) : p.id === 'free' ? (
                                <button className="btn btn-outline" style={{ width: '100%', opacity: .5 }} disabled>
                                    Free Plan
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleUpgrade(p.id)}
                                    className="btn btn-primary"
                                    style={{ width: '100%', background: p.color }}
                                    disabled={!!loading}
                                >
                                    {loading === p.id ? 'Redirecting...' : `Upgrade to ${p.name} →`}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-3)' }}>
                Payments are processed securely by Stripe. Cancel anytime.
            </p>
        </div>
    );
}