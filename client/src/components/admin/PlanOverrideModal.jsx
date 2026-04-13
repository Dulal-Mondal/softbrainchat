import { useState } from 'react';
import { adminService } from '../../services/adminService';
import toast from 'react-hot-toast';

const PLANS = [
    { id: 'free', label: 'Free', color: 'var(--green)' },
    { id: 'pro', label: 'Pro', color: 'var(--accent)' },
    { id: 'pro-max', label: 'Pro Max', color: 'var(--purple)' },
];

export default function PlanOverrideModal({ user, onClose, onSuccess }) {
    const currentOverride = user.planOverride?.active ? user.planOverride : null;

    const [plan, setPlan] = useState(currentOverride?.plan || 'pro');
    const [reason, setReason] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGrant = async () => {
        setLoading(true);
        try {
            await adminService.setPlanOverride(user._id, {
                plan,
                reason,
                expiresAt: expiresAt || null,
            });
            toast.success(`${user.email} কে ${plan} access দেওয়া হয়েছে`);
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async () => {
        if (!confirm('Override remove করবেন?')) return;
        setLoading(true);
        try {
            await adminService.removePlanOverride(user._id);
            toast.success('Override removed');
            onSuccess();
            onClose();
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
        fontFamily: "'DM Sans', sans-serif",
    };

    const labelStyle = {
        display: 'block', fontSize: 12,
        color: 'var(--text-2)', marginBottom: 5, fontWeight: 500,
    };

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20,
        }}>
            <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 16, padding: 24,
                width: '100%', maxWidth: 460,
            }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                        <h3 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 600 }}>
                            Plan Override
                        </h3>
                        <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>
                            {user.email}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 20 }}>✕</button>
                </div>

                {/* Current status */}
                <div style={{
                    background: 'var(--bg-tertiary)', borderRadius: 8,
                    padding: '10px 14px', marginBottom: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 3 }}>Current Plan</div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{user.plan}</span>
                    </div>
                    {currentOverride && (
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 3 }}>Active Override</div>
                            <span style={{
                                fontSize: 12, fontWeight: 600, padding: '2px 10px',
                                borderRadius: 10, background: 'var(--accent-dim)', color: 'var(--accent-2)',
                            }}>
                                {currentOverride.plan}
                            </span>
                        </div>
                    )}
                </div>

                {/* Plan selector */}
                <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Grant Plan</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                        {PLANS.map(p => (
                            <div
                                key={p.id}
                                onClick={() => setPlan(p.id)}
                                style={{
                                    padding: '10px 8px', borderRadius: 8, cursor: 'pointer',
                                    textAlign: 'center', fontSize: 13, fontWeight: 500,
                                    border: plan === p.id ? `2px solid ${p.color}` : '1px solid var(--border)',
                                    background: plan === p.id ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                                    color: plan === p.id ? p.color : 'var(--text-2)',
                                    transition: 'all .15s',
                                }}
                            >
                                {p.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reason */}
                <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Reason (optional)</label>
                    <input
                        style={inputStyle}
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="e.g. Partner deal, Testing, Support case"
                    />
                </div>

                {/* Expiry */}
                <div style={{ marginBottom: 22 }}>
                    <label style={labelStyle}>Expires At (blank = permanent)</label>
                    <input
                        type="date"
                        style={inputStyle}
                        value={expiresAt}
                        onChange={e => setExpiresAt(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                    {currentOverride && (
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={handleRemove}
                            disabled={loading}
                            style={{ flex: 1 }}
                        >
                            Remove Override
                        </button>
                    )}
                    <button className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleGrant}
                        disabled={loading}
                        style={{ flex: 2 }}
                    >
                        {loading ? 'Saving...' : `Grant ${plan} Access`}
                    </button>
                </div>
            </div>
        </div>
    );
}