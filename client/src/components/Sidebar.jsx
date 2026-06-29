import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import toast from 'react-hot-toast';

// ── Sidebar এর সব menu item ──
const NAV_SECTIONS = [
    {
        title: 'Main',
        items: [
            { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
            { to: '/inbox', icon: '📥', label: 'Inbox' },
            { to: '/crm', icon: '📋', label: 'CRM' },
        ],
    },
    {
        title: 'Marketing',
        items: [
            { to: '/broadcast', icon: '📢', label: 'Broadcast' },
            { to: '/import-contacts', icon: '📤', label: 'Import' },
        ],
    },
    {
        title: 'AI & Channels',
        items: [
            { to: '/chat', icon: '💬', label: 'AI Chat' },
            { to: '/meta', icon: '📲', label: 'Meta Reply' },
            { to: '/orders', icon: '📦', label: 'Orders' },
        ],
    },
    {
        title: 'Setup',
        items: [
            { to: '/business-setup', icon: '🏪', label: 'Business' },
            { to: '/crm-setup', icon: '⚙️', label: 'CRM Setup' },
            { to: '/agents', icon: '👥', label: 'Team' },
            { to: '/settings', icon: '🔧', label: 'Settings' },
            { to: '/billing', icon: '💳', label: 'Billing' },
        ],
    },
];

export default function Sidebar({ collapsed, onToggle }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        if (!confirm('Logout করবেন?')) return;
        try {
            await signOut(auth);
            navigate('/login');
        } catch (err) { toast.error(err.message); }
    };

    const W = collapsed ? 64 : 230;

    return (
        <div style={{
            width: W, minWidth: W, height: '100vh', position: 'sticky', top: 0,
            background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', transition: 'width .2s ease',
            overflow: 'hidden',
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

            {/* Nav */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '10px 8px' }}>
                {NAV_SECTIONS.map((section, si) => (
                    <div key={si} style={{ marginBottom: 14 }}>
                        {!collapsed && (
                            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, padding: '4px 12px', fontWeight: 600 }}>
                                {section.title}
                            </div>
                        )}
                        {section.items.map(item => (
                            <NavLink key={item.to} to={item.to}
                                title={collapsed ? item.label : ''}
                                style={({ isActive }) => ({
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: collapsed ? '11px 0' : '10px 12px',
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    borderRadius: 8, marginBottom: 2, textDecoration: 'none',
                                    fontSize: 13.5, fontWeight: 500,
                                    background: isActive ? 'var(--accent-dim)' : 'transparent',
                                    color: isActive ? 'var(--accent-2)' : 'var(--text-2)',
                                    transition: 'background .15s',
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