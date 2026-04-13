import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import PlanOverrideModal from '../components/admin/PlanOverrideModal';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PLAN_STYLE = {
    'free': { bg: '#0d2e1f', color: '#2ecc8a', label: 'Free' },
    'pro': { bg: 'var(--accent-dim)', color: 'var(--accent-2)', label: 'Pro' },
    'pro-max': { bg: 'var(--purple-dim)', color: 'var(--purple)', label: 'Pro Max' },
};

export default function AdminPanel() {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [planFilter, setPlanFilter] = useState('');
    const [overriding, setOverriding] = useState(null);

    useEffect(() => { if (!isAdmin) navigate('/dashboard'); }, [isAdmin, navigate]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [s, u] = await Promise.all([
                adminService.getStats(),
                adminService.getAllUsers({ search, plan: planFilter }),
            ]);
            setStats(s.stats);
            setUsers(u.users);
            setTotal(u.total);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [search, planFilter]);

    useEffect(() => {
        const t = setTimeout(loadData, 300);
        return () => clearTimeout(t);
    }, [loadData]);

    const handleDelete = async (u) => {
        if (!confirm(`"${u.email}" delete করবেন?`)) return;
        try {
            await adminService.deleteUser(u._id);
            toast.success('User deleted');
            loadData();
        } catch (err) { toast.error(err.message); }
    };

    const handleRoleToggle = async (u) => {
        const newRole = u.role === 'admin' ? 'user' : 'admin';
        if (!confirm(`${u.email} কে ${newRole} করবেন?`)) return;
        try {
            await adminService.updateRole(u._id, newRole);
            toast.success(`Role updated to ${newRole}`);
            loadData();
        } catch (err) { toast.error(err.message); }
    };

    if (!isAdmin) return null;

    const th = { fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.6px', padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', background: 'var(--bg-tertiary)' };
    const td = { padding: '12px 12px', fontSize: 13, borderBottom: '1px solid var(--border)', verticalAlign: 'middle' };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 28 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700 }}>🛡️ Admin Panel</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
                        Logged in as <strong>{user?.email}</strong>
                    </p>
                </div>
                <Link to="/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
            </div>

            {/* Stats */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 28 }}>
                    {[
                        { val: stats.total, lbl: 'Total Users', color: 'var(--accent-2)' },
                        { val: stats.free, lbl: 'Free', color: 'var(--text-2)' },
                        { val: stats.pro, lbl: 'Pro', color: 'var(--accent-2)' },
                        { val: stats['pro-max'], lbl: 'Pro Max', color: 'var(--purple)' },
                        { val: `$${stats.mrr}`, lbl: 'Est. MRR', color: 'var(--green)' },
                    ].map((s, i) => (
                        <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', textAlign: 'center' }}>
                            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Syne', color: s.color }}>{s.val}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{s.lbl}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <input className="input" style={{ maxWidth: 260, fontSize: 13 }}
                    value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..." />
                <div style={{ display: 'flex', gap: 6 }}>
                    {['', 'free', 'pro', 'pro-max'].map(p => (
                        <button key={p} onClick={() => setPlanFilter(p)}
                            style={{
                                padding: '6px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer', border: '1px solid var(--border)', fontFamily: "'DM Sans',sans-serif",
                                background: planFilter === p ? 'var(--accent-dim)' : 'var(--bg-secondary)', color: planFilter === p ? 'var(--accent-2)' : 'var(--text-2)'
                            }}>
                            {p === '' ? 'All Plans' : p.toUpperCase()}
                        </button>
                    ))}
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)' }}>{total} users</span>
            </div>

            {/* Table */}
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={th}>User</th>
                            <th style={th}>Plan</th>
                            <th style={th}>Effective Plan</th>
                            <th style={th}>Usage This Month</th>
                            <th style={th}>Role</th>
                            <th style={th}>Joined</th>
                            <th style={th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>Loading...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>No users found</td></tr>
                        ) : users.map(u => {
                            const ps = PLAN_STYLE[u.plan] || PLAN_STYLE.free;
                            const eps = PLAN_STYLE[u.effectivePlan] || PLAN_STYLE.free;
                            const hasOverride = u.planOverride?.active;
                            const limit = u.planLimits?.messagesPerMonth;
                            const used = u.usage?.messagesThisMonth || 0;
                            const pct = limit === Infinity ? 0 : Math.min(100, Math.round((used / (limit || 100)) * 100));

                            return (
                                <tr key={u._id}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                                    {/* User */}
                                    <td style={td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                                                {(u.name?.[0] || u.email?.[0] || '?').toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{u.name || '—'}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{u.email}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Plan */}
                                    <td style={td}>
                                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: ps.bg, color: ps.color }}>
                                            {ps.label}
                                        </span>
                                    </td>

                                    {/* Effective */}
                                    <td style={td}>
                                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: eps.bg, color: eps.color, border: hasOverride ? `1px dashed ${eps.color}` : 'none' }}>
                                            {eps.label}
                                        </span>
                                        {hasOverride && <div style={{ fontSize: 10, color: 'var(--orange)', marginTop: 3 }}>⚡ Override active</div>}
                                    </td>

                                    {/* Usage */}
                                    <td style={td}>
                                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>
                                            {used}{limit !== Infinity ? ` / ${limit}` : ' (∞)'}
                                        </div>
                                        {limit !== Infinity && (
                                            <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', width: 80 }}>
                                                <div style={{ height: '100%', borderRadius: 2, background: pct > 80 ? 'var(--orange)' : 'var(--accent)', width: `${pct}%` }} />
                                            </div>
                                        )}
                                    </td>

                                    {/* Role */}
                                    <td style={td}>
                                        <button onClick={() => handleRoleToggle(u)} disabled={u._id === user?._id}
                                            style={{
                                                fontSize: 11, padding: '3px 10px', borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border)', fontFamily: "'DM Sans',sans-serif",
                                                background: u.role === 'admin' ? 'var(--orange-dim)' : 'var(--bg-tertiary)', color: u.role === 'admin' ? 'var(--orange)' : 'var(--text-2)',
                                                opacity: u._id === user?._id ? 0.4 : 1
                                            }}>
                                            {u.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                                        </button>
                                    </td>

                                    {/* Joined */}
                                    <td style={{ ...td, fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                                        {new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                                    </td>

                                    {/* Actions */}
                                    <td style={td}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => setOverriding(u)} className="btn btn-outline btn-sm" style={{ fontSize: 11 }}>
                                                ⚡ Override
                                            </button>
                                            <button onClick={() => handleDelete(u)} className="btn btn-danger btn-sm"
                                                disabled={u._id === user?._id} style={{ fontSize: 11, opacity: u._id === user?._id ? 0.4 : 1 }}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {overriding && (
                <PlanOverrideModal user={overriding} onClose={() => setOverriding(null)} onSuccess={loadData} />
            )}
        </div>
    );
}