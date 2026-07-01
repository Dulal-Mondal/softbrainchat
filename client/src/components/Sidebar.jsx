import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import api from '../services/api';
import toast from 'react-hot-toast';

// প্রতি nav item এর সাথে permission key (agent এর জন্য)
// permission null = owner (সব দেখে)
const NAV_SECTIONS = [
    {
        title: 'Main',
        items: [
            { to: '/dashboard', icon: '🏠', label: 'Dashboard', perm: null },   // সবাই দেখে
            { to: '/inbox', icon: '📥', label: 'Inbox', perm: 'inbox' },
            { to: '/crm', icon: '📋', label: 'CRM', perm: 'crm' },
        ],
    },
    {
        title: 'Marketing',
        items: [
            { to: '/broadcast', icon: '📢', label: 'Broadcast', perm: 'broadcast' },
            { to: '/import-contacts', icon: '📤', label: 'Import', perm: 'import' },
        ],
    },
    {
        title: 'AI & Channels',
        items: [
            { to: '/chat', icon: '💬', label: 'AI Chat', perm: 'business' },
            { to: '/meta', icon: '📲', label: 'Meta Reply', perm: 'meta' },
            { to: '/orders', icon: '📦', label: 'Orders', perm: 'orders' },
        ],
    },
    {
        title: 'Setup',
        items: [
            { to: '/business-setup', icon: '🏪', label: 'Business', perm: 'business' },
            { to: '/crm-setup', icon: '⚙️', label: 'CRM Setup', perm: 'crm' },
            { to: '/agents', icon: '👥', label: 'Team', perm: 'ownerOnly' },
            { to: '/settings', icon: '🔧', label: 'Settings', perm: null },
            { to: '/billing', icon: '💳', label: 'Billing', perm: 'ownerOnly' },
        ],
    },
];

export default function Sidebar({ collapsed, onToggle }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [access, setAccess] = useState({ isAgent: false, permissions: null });
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        api.get('/agents/my-access')
            .then(res => {
                const d = res.success ? res : res.data;
                setAccess({ isAgent: d.isAgent, permissions: d.permissions });
            })
            .catch(() => setAccess({ isAgent: false, permissions: null }))
            .finally(() => setLoaded(true));
    }, []);

    // এই item দেখাবে কিনা
    const canSee = (item) => {
        // owner হলে সব দেখে
        if (!access.isAgent) return true;
        // agent হলে:
        if (item.perm === null) return true;          // সবাই দেখে (Dashboard, Settings)
        if (item.perm === 'ownerOnly') return false;  // agent দেখবে না (Team, Billing)
        return (access.permissions || []).includes(item.perm);
    };

    const handleLogout = async () => {
        if (!confirm('Logout করবেন?')) return;
        try { await signOut(auth); navigate('/login'); }
        catch (err) { toast.error(err.message); }
    };

    const W = collapsed ? 64 : 230;

    // filter করা sections (খালি section বাদ)
    const visibleSections = NAV_SECTIONS
        .map(s => ({ ...s, items: s.items.filter(canSee) }))
        .filter(s => s.items.length > 0);

    return (
        <div style={{
            width: W, minWidth: W, height: '100vh', position: 'sticky', top: 0,
            background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', transition: 'width .2s ease', overflow: 'hidden',
        }}>
            {/* Logo + toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', padding: collapsed ? '16px 0' : '16px 18px', borderBottom: '1px solid var(--border)' }}>
                {!collapsed && (
                    <span style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: 'var(--accent-2)', whiteSpace: 'nowrap' }}>
                        SoftBrainChat
                    </span>
                )}
                <button onClick={onToggle} style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 18, padding: 4 }}>
                    {collapsed ? '☰' : '«'}
                </button>
            </div>

            {/* Agent badge */}
            {!collapsed && access.isAgent && loaded && (
                <div style={{ margin: '10px 12px 0', padding: '6px 10px', background: 'var(--accent-dim)', borderRadius: 8, fontSize: 10, color: 'var(--accent-2)', textAlign: 'center' }}>
                    👤 Agent Account
                </div>
            )}

            {/* Nav */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '10px 8px' }}>
                {visibleSections.map((section, si) => (
                    <div key={si} style={{ marginBottom: 14 }}>
                        {!collapsed && (
                            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, padding: '4px 12px', fontWeight: 600 }}>
                                {section.title}
                            </div>
                        )}
                        {section.items.map(item => (
                            <NavLink key={item.to} to={item.to} title={collapsed ? item.label : ''}
                                style={({ isActive }) => ({
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: collapsed ? '11px 0' : '10px 12px',
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    borderRadius: 8, marginBottom: 2, textDecoration: 'none',
                                    fontSize: 13.5, fontWeight: 500,
                                    background: isActive ? 'var(--accent-dim)' : 'transparent',
                                    color: isActive ? 'var(--accent-2)' : 'var(--text-2)',
                                    whiteSpace: 'nowrap',
                                })}>
                                <span style={{ fontSize: 17 }}>{item.icon}</span>
                                {!collapsed && <span>{item.label}</span>}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </div>

            {/* User + logout */}
            <div style={{ borderTop: '1px solid var(--border)', padding: collapsed ? '10px 0' : '12px' }}>
                {!collapsed ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, flexShrink: 0 }}>
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                        </div>
                        <button onClick={handleLogout} title="Logout" style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16 }}>🚪</button>
                    </div>
                ) : (
                    <button onClick={handleLogout} title="Logout" style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 18, padding: 4 }}>🚪</button>
                )}
            </div>
        </div>
    );
}