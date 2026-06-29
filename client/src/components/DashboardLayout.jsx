import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

            {/* Body — সব page এখানে render হবে */}
            <div style={{ flex: 1, minWidth: 0, overflowX: 'hidden' }}>
                <Outlet />
            </div>
        </div>
    );
}