import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const STAGE_STYLE = {
    new: { bg: 'var(--bg-tertiary)', color: 'var(--text-3)', label: 'New' },
    contacted: { bg: 'var(--accent-dim)', color: 'var(--accent-2)', label: 'Contacted' },
    qualified: { bg: 'var(--orange-dim)', color: 'var(--orange)', label: 'Qualified' },
    won: { bg: 'var(--green-dim)', color: 'var(--green)', label: 'Won' },
    lost: { bg: 'var(--red-dim)', color: 'var(--red)', label: 'Lost' },
};
const PLATFORM_ICON = { whatsapp: '💬', messenger: '📘', instagram: '📸' };

function scoreColor(s) {
    if (s >= 70) return 'var(--green)';
    if (s >= 40) return 'var(--orange)';
    return 'var(--text-3)';
}

export default function Leads() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stage, setStage] = useState('');
    const [minScore, setMinScore] = useState('');
    const [search, setSearch] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (stage) params.stage = stage;
            if (minScore) params.minScore = minScore;
            const res = await api.get('/contacts/leads', { params });
            setLeads(res.leads || res.data?.leads || []);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally { setLoading(false); }
    }, [stage, minScore]);

    useEffect(() => { load(); }, [load]);

    const filtered = leads.filter(l =>
        !search ||
        l.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.phone?.includes(search)
    );

    // ── CSV export (filter করা lead গুলো) ──
    const exportCSV = () => {
        if (filtered.length === 0) { toast.error('কোনো lead নেই'); return; }

        const headers = ['Name', 'Phone', 'Platform', 'Channel', 'Stage', 'Score',
            'Interest', 'Budget', 'Urgency', 'Problem', 'Summary', 'Tags', 'Assigned To'];

        const rows = filtered.map(l => {
            const row = [
                l.name || '',
                l.phone || l.senderId || '',
                l.platform || '',
                l.channelId?.name || '',
                l.lead?.stage || '',
                l.lead?.score ?? '',
                l.lead?.interest || '',
                l.lead?.budget || '',
                l.lead?.urgency || '',
                (l.lead?.problem || '').replace(/[\r\n]+/g, ' '),
                (l.lead?.summary || '').replace(/[\r\n]+/g, ' '),
                (l.tags || []).join('; '),
                l.assignedTo?.name || '',
            ];
            return row.map(v => {
                const s = String(v);
                return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
            }).join(',');
        });

        const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`✅ ${filtered.length}টি lead export হলো`);
    };

    const th = { textAlign: 'left', padding: '10px 12px', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' };
    const td = { padding: '10px 12px', fontSize: 13, borderBottom: '1px solid var(--border)', verticalAlign: 'middle' };

    // stats
    const hotCount = leads.filter(l => (l.lead?.score || 0) >= 70).length;
    const avgScore = leads.length ? Math.round(leads.reduce((s, l) => s + (l.lead?.score || 0), 0) / leads.length) : 0;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700 }}>🎯 Leads</h1>
                    <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>
                        AI যে lead সংগ্রহ করেছে — filter করে export করুন
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={exportCSV} className="btn btn-primary btn-sm">📥 Export CSV</button>
                    <Link to="/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20, maxWidth: 500 }}>
                <div className="card" style={{ textAlign: 'center', padding: 16 }}>
                    <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Syne', color: 'var(--accent-2)' }}>{leads.length}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Total Leads</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: 16 }}>
                    <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Syne', color: 'var(--green)' }}>{hotCount}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>🔥 Hot (70+)</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: 16 }}>
                    <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Syne', color: 'var(--orange)' }}>{avgScore}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Avg Score</div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 নাম বা phone..."
                    style={{ maxWidth: 220, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-2)', background: 'var(--bg-tertiary)', color: 'var(--text)', fontSize: 13, outline: 'none' }} />

                <select value={stage} onChange={e => setStage(e.target.value)}
                    style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-2)', background: 'var(--bg-tertiary)', color: 'var(--text)', fontSize: 13 }}>
                    <option value="">সব stage</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                </select>

                <select value={minScore} onChange={e => setMinScore(e.target.value)}
                    style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-2)', background: 'var(--bg-tertiary)', color: 'var(--text)', fontSize: 13 }}>
                    <option value="">যেকোনো score</option>
                    <option value="70">🔥 Hot (70+)</option>
                    <option value="40">Warm (40+)</option>
                    <option value="1">Cold (1+)</option>
                </select>

                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)' }}>{filtered.length} lead</span>
            </div>

            {/* Table */}
            {loading ? (
                <div style={{ color: 'var(--text-2)', padding: 20 }}>Loading...</div>
            ) : filtered.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>কোনো lead নেই</div>
                    <div style={{ fontSize: 13 }}>customer রা message দিলে AI নিজে lead সংগ্রহ করবে</div>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={th}>Customer</th>
                                <th style={th}>Score</th>
                                <th style={th}>Stage</th>
                                <th style={th}>Interest</th>
                                <th style={th}>Budget</th>
                                <th style={th}>Urgency</th>
                                <th style={th}>Summary</th>
                                <th style={th}>Channel</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(l => {
                                const st = STAGE_STYLE[l.lead?.stage] || STAGE_STYLE.new;
                                const score = l.lead?.score || 0;
                                return (
                                    <tr key={l._id}>
                                        <td style={td}>
                                            <div style={{ fontWeight: 600 }}>{l.name || '—'}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                                                {PLATFORM_ICON[l.platform]} {l.phone || l.senderId}
                                            </div>
                                        </td>
                                        <td style={td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', background: scoreColor(score) }}>
                                                    {score}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={td}>
                                            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: st.bg, color: st.color }}>{st.label}</span>
                                        </td>
                                        <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{l.lead?.interest || '—'}</td>
                                        <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{l.lead?.budget || '—'}</td>
                                        <td style={{ ...td, fontSize: 12, color: 'var(--text-2)' }}>{l.lead?.urgency || '—'}</td>
                                        <td style={{ ...td, fontSize: 12, color: 'var(--text-2)', maxWidth: 240 }}>
                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.lead?.summary || '—'}</div>
                                        </td>
                                        <td style={{ ...td, fontSize: 11, color: 'var(--text-3)' }}>{l.channelId?.name || '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}