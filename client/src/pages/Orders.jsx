// import { useEffect, useState, useCallback } from 'react';
// import api from '../services/api';
// import toast from 'react-hot-toast';
// import { Link } from 'react-router-dom';
// import OmsConfigPanel from '../components/orders/OmsConfigPanel';

// const STATUS_STYLE = {
//     pending: { bg: 'var(--orange-dim)', color: 'var(--orange)', label: '⏳ Pending' },
//     confirmed: { bg: 'var(--accent-dim)', color: 'var(--accent-2)', label: '✅ Confirmed' },
//     processing: { bg: 'var(--purple-dim)', color: 'var(--purple)', label: '⚙️ Processing' },
//     shipped: { bg: '#0d2e1f', color: '#2ecc8a', label: '🚚 Shipped' },
//     delivered: { bg: 'var(--green-dim)', color: 'var(--green)', label: '🎉 Delivered' },
//     cancelled: { bg: 'var(--red-dim)', color: 'var(--red)', label: '❌ Cancelled' },
// };

// const PLATFORM_ICON = { whatsapp: '💬', messenger: '📘', instagram: '📸' };

// export default function Orders() {
//     const [orders, setOrders] = useState([]);
//     const [stats, setStats] = useState({});
//     const [total, setTotal] = useState(0);
//     const [loading, setLoading] = useState(true);
//     const [search, setSearch] = useState('');
//     const [statusFilter, setStatusFilter] = useState('');
//     const [apiKeys, setApiKeys] = useState([]);
//     const [tab, setTab] = useState('orders');
//     const [newKeyName, setNewKeyName] = useState('');
//     const [newKey, setNewKey] = useState(null);

//     const loadOrders = useCallback(async () => {
//         setLoading(true);
//         try {
//             const params = {};
//             if (statusFilter) params.status = statusFilter;
//             if (search) params.search = search;
//             const data = await api.get('/orders', { params });
//             setOrders(data.orders || []);
//             setTotal(data.total || 0);
//             setStats(data.stats || {});
//         } catch (err) {
//             toast.error(err.message);
//         } finally {
//             setLoading(false);
//         }
//     }, [statusFilter, search]);

//     const loadApiKeys = useCallback(async () => {
//         try {
//             const data = await api.get('/orders/api-keys');
//             setApiKeys(data.keys || []);
//         } catch { }
//     }, []);

//     useEffect(() => {
//         const t = setTimeout(loadOrders, 300);
//         return () => clearTimeout(t);
//     }, [loadOrders]);

//     useEffect(() => {
//         if (tab === 'apikeys') loadApiKeys();
//     }, [tab, loadApiKeys]);

//     const updateStatus = async (orderId, status) => {
//         try {
//             await api.patch(`/orders/${orderId}/status`, { status });
//             toast.success(`Status updated to ${status}`);
//             loadOrders();
//         } catch (err) { toast.error(err.message); }
//     };

//     const deleteOrder = async (orderId) => {
//         if (!confirm('এই order delete করবেন?')) return;
//         try {
//             await api.delete(`/orders/${orderId}`);
//             toast.success('Order deleted');
//             loadOrders();
//         } catch (err) { toast.error(err.message); }
//     };

//     const createApiKey = async (e) => {
//         e.preventDefault();
//         if (!newKeyName.trim()) return;
//         try {
//             const data = await api.post('/orders/api-keys', { name: newKeyName });
//             setNewKey(data.apiKey);
//             setNewKeyName('');
//             toast.success('API Key created!');
//             loadApiKeys();
//         } catch (err) { toast.error(err.message); }
//     };

//     const revokeApiKey = async (keyId) => {
//         if (!confirm('এই API key revoke করবেন?')) return;
//         try {
//             await api.delete(`/orders/api-keys/${keyId}`);
//             toast.success('API key revoked');
//             loadApiKeys();
//         } catch (err) { toast.error(err.message); }
//     };

//     const td = { padding: '12px 14px', fontSize: 13, borderBottom: '1px solid var(--border)', verticalAlign: 'middle' };
//     const th = { padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.6px', borderBottom: '1px solid var(--border)', background: 'var(--bg-tertiary)', whiteSpace: 'nowrap' };

//     return (
//         <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 28 }}>

//             {/* Header */}
//             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
//                 <div>
//                     <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700 }}>📦 Orders</h1>
//                     <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
//                         Orders and OMS management from Meta chat
//                     </p>
//                 </div>
//                 <Link to="/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
//             </div>

//             {/* Stats */}
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 24 }}>
//                 {Object.entries(STATUS_STYLE).map(([key, s]) => (
//                     <div key={key}
//                         onClick={() => setStatusFilter(prev => prev === key ? '' : key)}
//                         style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', textAlign: 'center', cursor: 'pointer', transition: 'border .15s', ...(statusFilter === key && { borderColor: s.color }) }}>
//                         <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Syne', color: s.color }}>{stats[key] || 0}</div>
//                         <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{s.label}</div>
//                     </div>
//                 ))}
//             </div>

//             {/* Tabs */}
//             <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
//                 {[
//                     { id: 'orders', label: `📋 Orders (${total})` },
//                     { id: 'oms', label: '🔗 OMS Integration' },
//                     { id: 'apikeys', label: '🔑 OMS API Keys' },
//                 ].map(t => (
//                     <button key={t.id} onClick={() => setTab(t.id)} style={{
//                         padding: '7px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
//                         border: 'none', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
//                         background: tab === t.id ? 'var(--accent-dim)' : 'transparent',
//                         color: tab === t.id ? 'var(--accent-2)' : 'var(--text-2)',
//                     }}>
//                         {t.label}
//                     </button>
//                 ))}
//             </div>

//             {/* ── ORDERS TAB ─────────────────────────────────────────── */}
//             {tab === 'orders' && (
//                 <>
//                     {/* Search + filter */}
//                     <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
//                         <input className="input" style={{ maxWidth: 300, fontSize: 13 }}
//                             value={search} onChange={e => setSearch(e.target.value)}
//                             placeholder="Search name, phone, product..." />
//                         {statusFilter && (
//                             <button className="btn btn-outline btn-sm" onClick={() => setStatusFilter('')}>
//                                 Clear filter ✕
//                             </button>
//                         )}
//                     </div>

//                     {/* Table */}
//                     <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', overflowX: 'auto' }}>
//                         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                             <thead>
//                                 <tr>
//                                     <th style={th}>Order</th>
//                                     <th style={th}>Customer</th>
//                                     <th style={th}>Product</th>
//                                     <th style={th}>Platform</th>
//                                     <th style={th}>Status</th>
//                                     <th style={th}>OMS Sync</th>
//                                     <th style={th}>Date</th>
//                                     <th style={th}>Actions</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {loading ? (
//                                     <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>Loading...</td></tr>
//                                 ) : orders.length === 0 ? (
//                                     <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>
//                                         <div style={{ fontSize: 32, marginBottom: 10 }}>📦</div>
//                                         There is no order.
//                                     </td></tr>
//                                 ) : orders.map(order => {
//                                     const st = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
//                                     return (
//                                         <tr key={order._id}
//                                             onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
//                                             onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

//                                             <td style={td}>
//                                                 <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: 'var(--accent-2)' }}>{order.orderId}</div>
//                                             </td>

//                                             <td style={td}>
//                                                 <div style={{ fontWeight: 500 }}>{order.customer?.name}</div>
//                                                 <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{order.customer?.phone}</div>
//                                                 <div style={{ fontSize: 11, color: 'var(--text-3)', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.customer?.address}</div>
//                                             </td>

//                                             <td style={td}>
//                                                 <div style={{ fontWeight: 500 }}>{order.product?.name}</div>
//                                                 <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
//                                                     {order.product?.price && `${order.product.price} · `}
//                                                     Qty: {order.product?.quantity || 1}
//                                                 </div>
//                                             </td>

//                                             <td style={{ ...td, textAlign: 'center', fontSize: 18 }}>
//                                                 {PLATFORM_ICON[order.platform] || '📱'}
//                                             </td>

//                                             <td style={td}>
//                                                 <select
//                                                     value={order.status}
//                                                     onChange={e => updateStatus(order.orderId, e.target.value)}
//                                                     style={{
//                                                         background: st.bg, color: st.color, border: `1px solid ${st.color}`,
//                                                         borderRadius: 7, padding: '4px 8px', fontSize: 11, fontWeight: 600,
//                                                         cursor: 'pointer', outline: 'none', fontFamily: "'DM Sans', sans-serif",
//                                                     }}>
//                                                     {Object.entries(STATUS_STYLE).map(([k, s]) => (
//                                                         <option key={k} value={k}>{s.label}</option>
//                                                     ))}
//                                                 </select>
//                                             </td>

//                                             <td style={{ ...td, textAlign: 'center' }}>
//                                                 {order.omsSynced ? (
//                                                     <span style={{ fontSize: 11, color: 'var(--green)' }}>✓ Synced</span>
//                                                 ) : order.omsError ? (
//                                                     <span style={{ fontSize: 11, color: 'var(--red)' }} title={order.omsError}>✗ Error</span>
//                                                 ) : (
//                                                     <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>
//                                                 )}
//                                             </td>

//                                             <td style={{ ...td, fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
//                                                 {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
//                                             </td>

//                                             <td style={td}>
//                                                 <button className="btn btn-danger btn-sm" style={{ fontSize: 11 }} onClick={() => deleteOrder(order.orderId)}>
//                                                     Delete
//                                                 </button>
//                                             </td>
//                                         </tr>
//                                     );
//                                 })}
//                             </tbody>
//                         </table>
//                     </div>
//                 </>
//             )}

//             {/* ── OMS INTEGRATION TAB ────────────────────────────────── */}
//             {tab === 'oms' && (
//                 <div style={{ maxWidth: 700, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
//                     <OmsConfigPanel />
//                 </div>
//             )}

//             {/* ── API KEYS TAB ──────────────────────────────────────── */}
//             {tab === 'apikeys' && (
//                 <div style={{ maxWidth: 700 }}>

//                     {newKey && (
//                         <div style={{ background: 'var(--green-dim)', border: '1px solid var(--green)', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
//                             <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, marginBottom: 8 }}>
//                                 ✅ API Key created! Copy it now — it won't be visible again.
//                             </div>
//                             <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
//                                 <code style={{ flex: 1, background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: 6, fontSize: 12, fontFamily: "'DM Mono', monospace", wordBreak: 'break-all', color: 'var(--text)' }}>
//                                     {newKey.key}
//                                 </code>
//                                 <button className="btn btn-primary btn-sm" onClick={() => { navigator.clipboard.writeText(newKey.key); toast.success('Copied!'); }}>
//                                     Copy
//                                 </button>
//                                 <button className="btn btn-outline btn-sm" onClick={() => setNewKey(null)}>✕</button>
//                             </div>
//                         </div>
//                     )}

//                     <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
//                         <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>📖 How to use OMS API</h3>
//                         <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>
//                             <strong>Base URL:</strong>{' '}
//                             <code style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 4 }}>
//                                 {window.location.origin}/api/v1
//                             </code>
//                         </div>
//                         <div style={{ fontSize: 12 }}>
//                             {[
//                                 { method: 'GET', path: '/orders', desc: 'সব pending orders নিয়ে আসো' },
//                                 { method: 'GET', path: '/orders/:order_id', desc: 'Single order details' },
//                                 { method: 'PATCH', path: '/orders/:order_id', desc: 'Order status update করো' },
//                                 { method: 'GET', path: '/ping', desc: 'API connection test করো' },
//                             ].map((e, i) => (
//                                 <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
//                                     <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: e.method === 'GET' ? 'var(--green)' : 'var(--orange)', minWidth: 50 }}>{e.method}</span>
//                                     <code style={{ color: 'var(--accent-2)', flex: 1 }}>{e.path}</code>
//                                     <span style={{ color: 'var(--text-3)' }}>{e.desc}</span>
//                                 </div>
//                             ))}
//                         </div>
//                         <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-2)' }}>
//                             <strong>Header:</strong>{' '}
//                             <code style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 4 }}>X-API-Key: sbc_your_key_here</code>
//                         </div>
//                         <Link to="/api-docs" className="btn btn-outline btn-sm" style={{ marginTop: 14, display: 'inline-block' }}>
//                             📚 Full API Documentation →
//                         </Link>
//                     </div>

//                     <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
//                         <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 14 }}>➕ Create new API Key</h3>
//                         <form onSubmit={createApiKey} style={{ display: 'flex', gap: 10 }}>
//                             <input className="input" style={{ flex: 1, fontSize: 13 }}
//                                 value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
//                                 placeholder="Key এর নাম দিন (e.g. My OMS Software)" required />
//                             <button type="submit" className="btn btn-primary">Create Key</button>
//                         </form>
//                     </div>

//                     <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
//                         {apiKeys.map(k => (
//                             <div key={k._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10 }}>
//                                 <div style={{ flex: 1 }}>
//                                     <div style={{ fontSize: 14, fontWeight: 600 }}>{k.name}</div>
//                                     <code style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: "'DM Mono', monospace" }}>{k.key}</code>
//                                 </div>
//                                 <div style={{ textAlign: 'center', minWidth: 60 }}>
//                                     <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-2)' }}>{k.requestCount}</div>
//                                     <div style={{ fontSize: 10, color: 'var(--text-3)' }}>requests</div>
//                                 </div>
//                                 <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: k.isActive ? 'var(--green-dim)' : 'var(--red-dim)', color: k.isActive ? 'var(--green)' : 'var(--red)' }}>
//                                     {k.isActive ? 'Active' : 'Revoked'}
//                                 </span>
//                                 {k.isActive && (
//                                     <button className="btn btn-danger btn-sm" style={{ fontSize: 11 }} onClick={() => revokeApiKey(k._id)}>
//                                         Revoke
//                                     </button>
//                                 )}
//                             </div>
//                         ))}
//                         {apiKeys.length === 0 && (
//                             <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: 30 }}>
//                                 No any API key.Create api key.
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }








// import { useEffect, useState, useCallback } from 'react';
// import api from '../services/api';
// import toast from 'react-hot-toast';
// import { Link } from 'react-router-dom';
// import OmsConfigPanel from '../components/orders/OmsConfigPanel';

// const STATUS_STYLE = {
//     pending: { bg: 'var(--orange-dim)', color: 'var(--orange)', label: '⏳ Pending' },
//     confirmed: { bg: 'var(--accent-dim)', color: 'var(--accent-2)', label: '✅ Confirmed' },
//     processing: { bg: 'var(--purple-dim)', color: 'var(--purple)', label: '⚙️ Processing' },
//     shipped: { bg: '#0d2e1f', color: '#2ecc8a', label: '🚚 Shipped' },
//     delivered: { bg: 'var(--green-dim)', color: 'var(--green)', label: '🎉 Delivered' },
//     cancelled: { bg: 'var(--red-dim)', color: 'var(--red)', label: '❌ Cancelled' },
// };

// const PLATFORM_ICON = { whatsapp: '💬', messenger: '📘', instagram: '📸' };

// export default function Orders() {
//     const [orders, setOrders] = useState([]);
//     const [stats, setStats] = useState({});
//     const [total, setTotal] = useState(0);
//     const [loading, setLoading] = useState(true);
//     const [search, setSearch] = useState('');
//     const [statusFilter, setStatusFilter] = useState('');
//     const [apiKeys, setApiKeys] = useState([]);
//     const [tab, setTab] = useState('orders');
//     const [newKeyName, setNewKeyName] = useState('');
//     const [newKey, setNewKey] = useState(null);

//     const loadOrders = useCallback(async () => {
//         setLoading(true);
//         try {
//             const params = {};
//             if (statusFilter) params.status = statusFilter;
//             if (search) params.search = search;
//             const data = await api.get('/orders', { params });
//             setOrders(data.orders || []);
//             setTotal(data.total || 0);
//             setStats(data.stats || {});
//         } catch (err) {
//             toast.error(err.message);
//         } finally {
//             setLoading(false);
//         }
//     }, [statusFilter, search]);

//     const loadApiKeys = useCallback(async () => {
//         try {
//             const data = await api.get('/orders/api-keys');
//             setApiKeys(data.keys || []);
//         } catch { }
//     }, []);

//     useEffect(() => {
//         const t = setTimeout(loadOrders, 300);
//         return () => clearTimeout(t);
//     }, [loadOrders]);

//     useEffect(() => {
//         if (tab === 'apikeys') loadApiKeys();
//     }, [tab, loadApiKeys]);

//     const updateStatus = async (orderId, status) => {
//         try {
//             await api.patch(`/orders/${orderId}/status`, { status });
//             toast.success(`Status updated to ${status}`);
//             loadOrders();
//         } catch (err) { toast.error(err.message); }
//     };

//     const deleteOrder = async (orderId) => {
//         if (!confirm('এই order delete করবেন?')) return;
//         try {
//             await api.delete(`/orders/${orderId}`);
//             toast.success('Order deleted');
//             loadOrders();
//         } catch (err) { toast.error(err.message); }
//     };

//     const createApiKey = async (e) => {
//         e.preventDefault();
//         if (!newKeyName.trim()) return;
//         try {
//             const data = await api.post('/orders/api-keys', { name: newKeyName });
//             setNewKey(data.apiKey);
//             setNewKeyName('');
//             toast.success('API Key created!');
//             loadApiKeys();
//         } catch (err) { toast.error(err.message); }
//     };

//     const revokeApiKey = async (keyId) => {
//         if (!confirm('এই API key revoke করবেন?')) return;
//         try {
//             await api.delete(`/orders/api-keys/${keyId}`);
//             toast.success('API key revoked');
//             loadApiKeys();
//         } catch (err) { toast.error(err.message); }
//     };

//     const td = { padding: '12px 14px', fontSize: 13, borderBottom: '1px solid var(--border)', verticalAlign: 'middle' };
//     const th = { padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.6px', borderBottom: '1px solid var(--border)', background: 'var(--bg-tertiary)', whiteSpace: 'nowrap' };

//     return (
//         <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 28 }}>

//             {/* Header */}
//             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
//                 <div>
//                     <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700 }}>📦 Orders</h1>
//                     <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
//                         Meta chat থেকে আসা orders এবং OMS management
//                     </p>
//                 </div>
//                 <Link to="/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
//             </div>

//             {/* Stats */}
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 24 }}>
//                 {Object.entries(STATUS_STYLE).map(([key, s]) => (
//                     <div key={key}
//                         onClick={() => setStatusFilter(prev => prev === key ? '' : key)}
//                         style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', textAlign: 'center', cursor: 'pointer', transition: 'border .15s', ...(statusFilter === key && { borderColor: s.color }) }}>
//                         <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Syne', color: s.color }}>{stats[key] || 0}</div>
//                         <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{s.label}</div>
//                     </div>
//                 ))}
//             </div>

//             {/* Tabs */}
//             <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
//                 {[
//                     { id: 'orders', label: `📋 Orders (${total})` },
//                     { id: 'oms', label: '🔗 OMS Integration' },
//                     { id: 'apikeys', label: '🔑 OMS API Keys' },
//                 ].map(t => (
//                     <button key={t.id} onClick={() => setTab(t.id)} style={{
//                         padding: '7px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
//                         border: 'none', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
//                         background: tab === t.id ? 'var(--accent-dim)' : 'transparent',
//                         color: tab === t.id ? 'var(--accent-2)' : 'var(--text-2)',
//                     }}>
//                         {t.label}
//                     </button>
//                 ))}
//             </div>

//             {/* ── ORDERS TAB ─────────────────────────────────────────── */}
//             {tab === 'orders' && (
//                 <>
//                     {/* Search + filter */}
//                     <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
//                         <input className="input" style={{ maxWidth: 300, fontSize: 13 }}
//                             value={search} onChange={e => setSearch(e.target.value)}
//                             placeholder="Search name, phone, product..." />
//                         {statusFilter && (
//                             <button className="btn btn-outline btn-sm" onClick={() => setStatusFilter('')}>
//                                 Clear filter ✕
//                             </button>
//                         )}
//                     </div>

//                     {/* Table */}
//                     <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', overflowX: 'auto' }}>
//                         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
//                             <thead>
//                                 <tr>
//                                     <th style={th}>Order</th>
//                                     <th style={th}>Customer</th>
//                                     <th style={th}>Product</th>
//                                     <th style={th}>Platform</th>
//                                     <th style={th}>Status</th>
//                                     <th style={th}>OMS Sync</th>
//                                     <th style={th}>Date</th>
//                                     <th style={th}>Actions</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {loading ? (
//                                     <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>Loading...</td></tr>
//                                 ) : orders.length === 0 ? (
//                                     <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>
//                                         <div style={{ fontSize: 32, marginBottom: 10 }}>📦</div>
//                                         কোনো order নেই
//                                     </td></tr>
//                                 ) : orders.map(order => {
//                                     const st = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
//                                     return (
//                                         <tr key={order._id}
//                                             onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
//                                             onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

//                                             <td style={td}>
//                                                 <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: 'var(--accent-2)' }}>{order.orderId}</div>
//                                             </td>

//                                             <td style={td}>
//                                                 <div style={{ fontWeight: 500 }}>{order.customer?.name}</div>
//                                                 <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{order.customer?.phone}</div>
//                                                 <div style={{ fontSize: 11, color: 'var(--text-3)', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.customer?.address}</div>
//                                             </td>

//                                             <td style={td}>
//                                                 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//                                                     {order.product?.image && !order.product.image.startsWith('whatsapp-media:') && (
//                                                         <img
//                                                             src={order.product.image}
//                                                             alt={order.product?.name}
//                                                             style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
//                                                         />
//                                                     )}
//                                                     <div>
//                                                         <div style={{ fontWeight: 500 }}>{order.product?.name}</div>
//                                                         <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
//                                                             {order.product?.code && `Code: ${order.product.code} · `}
//                                                             {order.product?.size && `Size: ${order.product.size} · `}
//                                                             {order.product?.price && `${order.product.price} · `}
//                                                             Qty: {order.product?.quantity || 1}
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </td>

//                                             <td style={{ ...td, textAlign: 'center', fontSize: 18 }}>
//                                                 {PLATFORM_ICON[order.platform] || '📱'}
//                                             </td>

//                                             <td style={td}>
//                                                 <select
//                                                     value={order.status}
//                                                     onChange={e => updateStatus(order.orderId, e.target.value)}
//                                                     style={{
//                                                         background: st.bg, color: st.color, border: `1px solid ${st.color}`,
//                                                         borderRadius: 7, padding: '4px 8px', fontSize: 11, fontWeight: 600,
//                                                         cursor: 'pointer', outline: 'none', fontFamily: "'DM Sans', sans-serif",
//                                                     }}>
//                                                     {Object.entries(STATUS_STYLE).map(([k, s]) => (
//                                                         <option key={k} value={k}>{s.label}</option>
//                                                     ))}
//                                                 </select>
//                                             </td>

//                                             <td style={{ ...td, textAlign: 'center' }}>
//                                                 {order.omsSynced ? (
//                                                     <span style={{ fontSize: 11, color: 'var(--green)' }}>✓ Synced</span>
//                                                 ) : order.omsError ? (
//                                                     <span style={{ fontSize: 11, color: 'var(--red)' }} title={order.omsError}>✗ Error</span>
//                                                 ) : (
//                                                     <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>
//                                                 )}
//                                             </td>

//                                             <td style={{ ...td, fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
//                                                 {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
//                                             </td>

//                                             <td style={td}>
//                                                 <button className="btn btn-danger btn-sm" style={{ fontSize: 11 }} onClick={() => deleteOrder(order.orderId)}>
//                                                     Delete
//                                                 </button>
//                                             </td>
//                                         </tr>
//                                     );
//                                 })}
//                             </tbody>
//                         </table>
//                     </div>
//                 </>
//             )}

//             {/* ── OMS INTEGRATION TAB ────────────────────────────────── */}
//             {tab === 'oms' && (
//                 <div style={{ maxWidth: 700, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
//                     <OmsConfigPanel />
//                 </div>
//             )}

//             {/* ── API KEYS TAB ──────────────────────────────────────── */}
//             {tab === 'apikeys' && (
//                 <div style={{ maxWidth: 700 }}>

//                     {newKey && (
//                         <div style={{ background: 'var(--green-dim)', border: '1px solid var(--green)', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
//                             <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, marginBottom: 8 }}>
//                                 ✅ API Key তৈরি হয়েছে! এখনই copy করুন — এরপর আর দেখা যাবে না।
//                             </div>
//                             <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
//                                 <code style={{ flex: 1, background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: 6, fontSize: 12, fontFamily: "'DM Mono', monospace", wordBreak: 'break-all', color: 'var(--text)' }}>
//                                     {newKey.key}
//                                 </code>
//                                 <button className="btn btn-primary btn-sm" onClick={() => { navigator.clipboard.writeText(newKey.key); toast.success('Copied!'); }}>
//                                     Copy
//                                 </button>
//                                 <button className="btn btn-outline btn-sm" onClick={() => setNewKey(null)}>✕</button>
//                             </div>
//                         </div>
//                     )}

//                     <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
//                         <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>📖 OMS API কিভাবে ব্যবহার করবেন</h3>
//                         <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>
//                             <strong>Base URL:</strong>{' '}
//                             <code style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 4 }}>
//                                 {window.location.origin}/api/v1
//                             </code>
//                         </div>
//                         <div style={{ fontSize: 12 }}>
//                             {[
//                                 { method: 'GET', path: '/orders', desc: 'সব pending orders নিয়ে আসো' },
//                                 { method: 'GET', path: '/orders/:order_id', desc: 'Single order details' },
//                                 { method: 'PATCH', path: '/orders/:order_id', desc: 'Order status update করো' },
//                                 { method: 'GET', path: '/ping', desc: 'API connection test করো' },
//                             ].map((e, i) => (
//                                 <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
//                                     <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: e.method === 'GET' ? 'var(--green)' : 'var(--orange)', minWidth: 50 }}>{e.method}</span>
//                                     <code style={{ color: 'var(--accent-2)', flex: 1 }}>{e.path}</code>
//                                     <span style={{ color: 'var(--text-3)' }}>{e.desc}</span>
//                                 </div>
//                             ))}
//                         </div>
//                         <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-2)' }}>
//                             <strong>Header:</strong>{' '}
//                             <code style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 4 }}>X-API-Key: sbc_your_key_here</code>
//                         </div>
//                         <Link to="/api-docs" className="btn btn-outline btn-sm" style={{ marginTop: 14, display: 'inline-block' }}>
//                             📚 Full API Documentation →
//                         </Link>
//                     </div>

//                     <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
//                         <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 14 }}>➕ নতুন API Key তৈরি করুন</h3>
//                         <form onSubmit={createApiKey} style={{ display: 'flex', gap: 10 }}>
//                             <input className="input" style={{ flex: 1, fontSize: 13 }}
//                                 value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
//                                 placeholder="Key এর নাম দিন (e.g. My OMS Software)" required />
//                             <button type="submit" className="btn btn-primary">Create Key</button>
//                         </form>
//                     </div>

//                     <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
//                         {apiKeys.map(k => (
//                             <div key={k._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10 }}>
//                                 <div style={{ flex: 1 }}>
//                                     <div style={{ fontSize: 14, fontWeight: 600 }}>{k.name}</div>
//                                     <code style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: "'DM Mono', monospace" }}>{k.key}</code>
//                                 </div>
//                                 <div style={{ textAlign: 'center', minWidth: 60 }}>
//                                     <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-2)' }}>{k.requestCount}</div>
//                                     <div style={{ fontSize: 10, color: 'var(--text-3)' }}>requests</div>
//                                 </div>
//                                 <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: k.isActive ? 'var(--green-dim)' : 'var(--red-dim)', color: k.isActive ? 'var(--green)' : 'var(--red)' }}>
//                                     {k.isActive ? 'Active' : 'Revoked'}
//                                 </span>
//                                 {k.isActive && (
//                                     <button className="btn btn-danger btn-sm" style={{ fontSize: 11 }} onClick={() => revokeApiKey(k._id)}>
//                                         Revoke
//                                     </button>
//                                 )}
//                             </div>
//                         ))}
//                         {apiKeys.length === 0 && (
//                             <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: 30 }}>
//                                 কোনো API key নেই। উপরে তৈরি করুন।
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }




import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import OmsConfigPanel from '../components/orders/OmsConfigPanel';
import { useSocketEvent } from '../hooks/useSocket';

const STATUS_STYLE = {
    pending: { bg: 'var(--orange-dim)', color: 'var(--orange)', label: '⏳ Pending' },
    confirmed: { bg: 'var(--accent-dim)', color: 'var(--accent-2)', label: '✅ Confirmed' },
    processing: { bg: 'var(--purple-dim)', color: 'var(--purple)', label: '⚙️ Processing' },
    shipped: { bg: '#0d2e1f', color: '#2ecc8a', label: '🚚 Shipped' },
    delivered: { bg: 'var(--green-dim)', color: 'var(--green)', label: '🎉 Delivered' },
    cancelled: { bg: 'var(--red-dim)', color: 'var(--red)', label: '❌ Cancelled' },
};

const PLATFORM_ICON = { whatsapp: '💬', messenger: '📘', instagram: '📸' };

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({});
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [apiKeys, setApiKeys] = useState([]);
    const [tab, setTab] = useState('orders');
    const [newKeyName, setNewKeyName] = useState('');
    const [newKey, setNewKey] = useState(null);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (search) params.search = search;
            const data = await api.get('/orders', { params });
            setOrders(data.orders || []);
            setTotal(data.total || 0);
            setStats(data.stats || {});
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, search]);

    const loadApiKeys = useCallback(async () => {
        try {
            const data = await api.get('/orders/api-keys');
            setApiKeys(data.keys || []);
        } catch { }
    }, []);

    useEffect(() => {
        const t = setTimeout(loadOrders, 300);
        return () => clearTimeout(t);
    }, [loadOrders]);

    useEffect(() => {
        if (tab === 'apikeys') loadApiKeys();
    }, [tab, loadApiKeys]);

    // ── Real-time: নতুন order বা update এলে auto reload ────────
    useSocketEvent('order:new', () => {
        loadOrders();
        toast.success('🛒 নতুন order এসেছে!');
    });
    useSocketEvent('order:updated', () => loadOrders());

    const updateStatus = async (orderId, status) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status });
            toast.success(`Status updated to ${status}`);
            loadOrders();
        } catch (err) { toast.error(err.message); }
    };

    const deleteOrder = async (orderId) => {
        if (!confirm('এই order delete করবেন?')) return;
        try {
            await api.delete(`/orders/${orderId}`);
            toast.success('Order deleted');
            loadOrders();
        } catch (err) { toast.error(err.message); }
    };

    const createApiKey = async (e) => {
        e.preventDefault();
        if (!newKeyName.trim()) return;
        try {
            const data = await api.post('/orders/api-keys', { name: newKeyName });
            setNewKey(data.apiKey);
            setNewKeyName('');
            toast.success('API Key created!');
            loadApiKeys();
        } catch (err) { toast.error(err.message); }
    };

    const revokeApiKey = async (keyId) => {
        if (!confirm('এই API key revoke করবেন?')) return;
        try {
            await api.delete(`/orders/api-keys/${keyId}`);
            toast.success('API key revoked');
            loadApiKeys();
        } catch (err) { toast.error(err.message); }
    };

    const td = { padding: '12px 14px', fontSize: 13, borderBottom: '1px solid var(--border)', verticalAlign: 'middle' };
    const th = { padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.6px', borderBottom: '1px solid var(--border)', background: 'var(--bg-tertiary)', whiteSpace: 'nowrap' };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 28 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700 }}>📦 Orders</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
                        Meta chat থেকে আসা orders এবং OMS management
                    </p>
                </div>
                <Link to="/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 24 }}>
                {Object.entries(STATUS_STYLE).map(([key, s]) => (
                    <div key={key}
                        onClick={() => setStatusFilter(prev => prev === key ? '' : key)}
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', textAlign: 'center', cursor: 'pointer', transition: 'border .15s', ...(statusFilter === key && { borderColor: s.color }) }}>
                        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Syne', color: s.color }}>{stats[key] || 0}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
                {[
                    { id: 'orders', label: `📋 Orders (${total})` },
                    { id: 'oms', label: '🔗 OMS Integration' },
                    { id: 'apikeys', label: '🔑 OMS API Keys' },
                ].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                        padding: '7px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                        border: 'none', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                        background: tab === t.id ? 'var(--accent-dim)' : 'transparent',
                        color: tab === t.id ? 'var(--accent-2)' : 'var(--text-2)',
                    }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── ORDERS TAB ─────────────────────────────────────────── */}
            {tab === 'orders' && (
                <>
                    {/* Search + filter */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                        <input className="input" style={{ maxWidth: 300, fontSize: 13 }}
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search name, phone, product..." />
                        {statusFilter && (
                            <button className="btn btn-outline btn-sm" onClick={() => setStatusFilter('')}>
                                Clear filter ✕
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={th}>Order</th>
                                    <th style={th}>Customer</th>
                                    <th style={th}>Product</th>
                                    <th style={th}>Platform</th>
                                    <th style={th}>Status</th>
                                    <th style={th}>OMS Sync</th>
                                    <th style={th}>Date</th>
                                    <th style={th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>Loading...</td></tr>
                                ) : orders.length === 0 ? (
                                    <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: 'var(--text-3)', padding: 40 }}>
                                        <div style={{ fontSize: 32, marginBottom: 10 }}>📦</div>
                                        কোনো order নেই
                                    </td></tr>
                                ) : orders.map(order => {
                                    const st = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
                                    return (
                                        <tr key={order._id}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                                            <td style={td}>
                                                <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: 'var(--accent-2)' }}>{order.orderId}</div>
                                            </td>

                                            <td style={td}>
                                                <div style={{ fontWeight: 500 }}>{order.customer?.name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{order.customer?.phone}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-3)', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.customer?.address}</div>
                                            </td>

                                            <td style={td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    {order.product?.image && !order.product.image.startsWith('whatsapp-media:') && (
                                                        <img
                                                            src={order.product.image}
                                                            alt={order.product?.name}
                                                            style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
                                                        />
                                                    )}
                                                    <div>
                                                        <div style={{ fontWeight: 500 }}>{order.product?.name}</div>
                                                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                                                            {order.product?.code && `Code: ${order.product.code} · `}
                                                            {order.product?.size && `Size: ${order.product.size} · `}
                                                            {order.product?.price && `${order.product.price} · `}
                                                            Qty: {order.product?.quantity || 1}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td style={{ ...td, textAlign: 'center', fontSize: 18 }}>
                                                {PLATFORM_ICON[order.platform] || '📱'}
                                            </td>

                                            <td style={td}>
                                                <select
                                                    value={order.status}
                                                    onChange={e => updateStatus(order.orderId, e.target.value)}
                                                    style={{
                                                        background: st.bg, color: st.color, border: `1px solid ${st.color}`,
                                                        borderRadius: 7, padding: '4px 8px', fontSize: 11, fontWeight: 600,
                                                        cursor: 'pointer', outline: 'none', fontFamily: "'DM Sans', sans-serif",
                                                    }}>
                                                    {Object.entries(STATUS_STYLE).map(([k, s]) => (
                                                        <option key={k} value={k}>{s.label}</option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td style={{ ...td, textAlign: 'center' }}>
                                                {order.omsSynced ? (
                                                    <span style={{ fontSize: 11, color: 'var(--green)' }}>✓ Synced</span>
                                                ) : order.omsError ? (
                                                    <span style={{ fontSize: 11, color: 'var(--red)' }} title={order.omsError}>✗ Error</span>
                                                ) : (
                                                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>
                                                )}
                                            </td>

                                            <td style={{ ...td, fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                                                {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </td>

                                            <td style={td}>
                                                <button className="btn btn-danger btn-sm" style={{ fontSize: 11 }} onClick={() => deleteOrder(order.orderId)}>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ── OMS INTEGRATION TAB ────────────────────────────────── */}
            {tab === 'oms' && (
                <div style={{ maxWidth: 700, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                    <OmsConfigPanel />
                </div>
            )}

            {/* ── API KEYS TAB ──────────────────────────────────────── */}
            {tab === 'apikeys' && (
                <div style={{ maxWidth: 700 }}>

                    {newKey && (
                        <div style={{ background: 'var(--green-dim)', border: '1px solid var(--green)', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
                            <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, marginBottom: 8 }}>
                                ✅ API Key তৈরি হয়েছে! এখনই copy করুন — এরপর আর দেখা যাবে না।
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <code style={{ flex: 1, background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: 6, fontSize: 12, fontFamily: "'DM Mono', monospace", wordBreak: 'break-all', color: 'var(--text)' }}>
                                    {newKey.key}
                                </code>
                                <button className="btn btn-primary btn-sm" onClick={() => { navigator.clipboard.writeText(newKey.key); toast.success('Copied!'); }}>
                                    Copy
                                </button>
                                <button className="btn btn-outline btn-sm" onClick={() => setNewKey(null)}>✕</button>
                            </div>
                        </div>
                    )}

                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                        <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>📖 OMS API কিভাবে ব্যবহার করবেন</h3>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>
                            <strong>Base URL:</strong>{' '}
                            <code style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 4 }}>
                                {window.location.origin}/api/v1
                            </code>
                        </div>
                        <div style={{ fontSize: 12 }}>
                            {[
                                { method: 'GET', path: '/orders', desc: 'সব pending orders নিয়ে আসো' },
                                { method: 'GET', path: '/orders/:order_id', desc: 'Single order details' },
                                { method: 'PATCH', path: '/orders/:order_id', desc: 'Order status update করো' },
                                { method: 'GET', path: '/ping', desc: 'API connection test করো' },
                            ].map((e, i) => (
                                <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: e.method === 'GET' ? 'var(--green)' : 'var(--orange)', minWidth: 50 }}>{e.method}</span>
                                    <code style={{ color: 'var(--accent-2)', flex: 1 }}>{e.path}</code>
                                    <span style={{ color: 'var(--text-3)' }}>{e.desc}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-2)' }}>
                            <strong>Header:</strong>{' '}
                            <code style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 4 }}>X-API-Key: sbc_your_key_here</code>
                        </div>
                        <Link to="/api-docs" className="btn btn-outline btn-sm" style={{ marginTop: 14, display: 'inline-block' }}>
                            📚 Full API Documentation →
                        </Link>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                        <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 14 }}>➕ নতুন API Key তৈরি করুন</h3>
                        <form onSubmit={createApiKey} style={{ display: 'flex', gap: 10 }}>
                            <input className="input" style={{ flex: 1, fontSize: 13 }}
                                value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                                placeholder="Key এর নাম দিন (e.g. My OMS Software)" required />
                            <button type="submit" className="btn btn-primary">Create Key</button>
                        </form>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {apiKeys.map(k => (
                            <div key={k._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{k.name}</div>
                                    <code style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: "'DM Mono', monospace" }}>{k.key}</code>
                                </div>
                                <div style={{ textAlign: 'center', minWidth: 60 }}>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-2)' }}>{k.requestCount}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>requests</div>
                                </div>
                                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: k.isActive ? 'var(--green-dim)' : 'var(--red-dim)', color: k.isActive ? 'var(--green)' : 'var(--red)' }}>
                                    {k.isActive ? 'Active' : 'Revoked'}
                                </span>
                                {k.isActive && (
                                    <button className="btn btn-danger btn-sm" style={{ fontSize: 11 }} onClick={() => revokeApiKey(k._id)}>
                                        Revoke
                                    </button>
                                )}
                            </div>
                        ))}
                        {apiKeys.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'var(--text-3)', padding: 30 }}>
                                কোনো API key নেই। উপরে তৈরি করুন।
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}