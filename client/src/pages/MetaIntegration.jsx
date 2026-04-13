import { useEffect, useState, useCallback } from 'react';
import { metaService } from '../services/metaService';
import ChannelCard from '../components/meta/ChannelCard';
import MetaApiForm from '../components/meta/MetaApiForm';
import ReviewModal from '../components/meta/ReviewModal';
import { usePlan } from '../context/PlanContext';
import toast from 'react-hot-toast';

const STATUS_STYLE = {
    pending: { bg: 'var(--bg-tertiary)', color: 'var(--text-3)', label: 'Pending' },
    ai_replied: { bg: 'var(--green-dim)', color: 'var(--green)', label: 'AI Replied' },
    review_needed: { bg: 'var(--orange-dim)', color: 'var(--orange)', label: 'Review Needed' },
    human_replied: { bg: 'var(--accent-dim)', color: 'var(--accent-2)', label: 'Human Replied' },
    failed: { bg: 'var(--red-dim)', color: 'var(--red)', label: 'Failed' },
};
const PLATFORM_ICON = { whatsapp: '💬', messenger: '📘', instagram: '📸' };

export default function MetaIntegration() {
    const { plan, canAccess } = usePlan();
    const [channels, setChannels] = useState([]);
    const [messages, setMessages] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [reviewing, setReviewing] = useState(null);
    const [tab, setTab] = useState('overview');
    const [msgFilter, setMsgFilter] = useState('');

    const loadChannels = useCallback(async () => {
        try { const d = await metaService.getChannels(); setChannels(d.channels); }
        catch (err) { toast.error(err.message); }
    }, []);

    const loadMessages = useCallback(async () => {
        try { const d = await metaService.getMessages(msgFilter ? { status: msgFilter } : {}); setMessages(d.messages); }
        catch { }
    }, [msgFilter]);

    useEffect(() => { loadChannels(); loadMessages(); }, [loadChannels, loadMessages]);

    if (!canAccess('metaReply')) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                <div style={{ textAlign: 'center', maxWidth: 400 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📲</div>
                    <h2 style={{ fontFamily: 'Syne', fontSize: 22, marginBottom: 10 }}>Meta Auto-Reply</h2>
                    <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                        WhatsApp, Messenger ও Instagram এ AI auto-reply পাঠাতে Pro plan দরকার।
                        আপনি এখন <strong>{plan}</strong> plan এ আছেন।
                    </p>
                    <a href="/billing" className="btn btn-primary" style={{ textDecoration: 'none', padding: '10px 28px' }}>Pro তে Upgrade করুন →</a>
                </div>
            </div>
        );
    }

    const needReview = messages.filter(m => m.status === 'review_needed').length;
    const aiReplied = messages.filter(m => m.status === 'ai_replied').length;
    const aiRate = messages.length ? Math.round((aiReplied / messages.length) * 100) : 0;

    const S = {
        page: { minHeight: '100vh', background: 'var(--bg-primary)', padding: 28 },
        stat: { background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' },
        sval: { fontSize: 26, fontWeight: 700, fontFamily: 'Syne', color: 'var(--accent-2)' },
        slbl: { fontSize: 11, color: 'var(--text-3)', marginTop: 3 },
        msgRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 8 },
    };

    return (
        <div style={S.page}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700 }}>📲 Meta Auto-Reply</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>WhatsApp · Messenger · Instagram</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Channel</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
                <div style={S.stat}><div style={S.sval}>{channels.length}</div><div style={S.slbl}>Channels</div></div>
                <div style={S.stat}><div style={S.sval}>{messages.length}</div><div style={S.slbl}>Messages</div></div>
                <div style={S.stat}><div style={{ ...S.sval, color: 'var(--green)' }}>{aiRate}%</div><div style={S.slbl}>AI Handled</div></div>
                <div style={S.stat}><div style={{ ...S.sval, color: needReview > 0 ? 'var(--orange)' : 'var(--text-3)' }}>{needReview}</div><div style={S.slbl}>Need Review</div></div>
            </div>

            <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
                {['overview', 'messages'].map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', border: 'none', fontFamily: "'DM Sans',sans-serif", fontWeight: 500, background: tab === t ? 'var(--accent-dim)' : 'none', color: tab === t ? 'var(--accent-2)' : 'var(--text-2)' }}>
                        {t === 'overview' ? 'Channels' : 'Messages'}{t === 'messages' && needReview > 0 && <span style={{ background: 'var(--orange)', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, marginLeft: 4 }}>{needReview}</span>}
                    </button>
                ))}
            </div>

            {tab === 'overview' && (
                channels.length === 0
                    ? <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: 14 }}>Channel নেই। "+ Add Channel" দিয়ে শুরু করুন।</div>
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{channels.map(ch => <ChannelCard key={ch._id} channel={ch} onUpdate={loadChannels} onDelete={loadChannels} />)}</div>
            )}

            {tab === 'messages' && (
                <div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                        {['', 'review_needed', 'ai_replied', 'human_replied'].map(f => (
                            <button key={f} onClick={() => setMsgFilter(f)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer', border: '1px solid var(--border)', fontFamily: "'DM Sans',sans-serif", background: msgFilter === f ? 'var(--accent-dim)' : 'var(--bg-secondary)', color: msgFilter === f ? 'var(--accent-2)' : 'var(--text-2)' }}>
                                {f === '' ? 'All' : STATUS_STYLE[f]?.label}
                            </button>
                        ))}
                    </div>
                    {messages.map(msg => {
                        const st = STATUS_STYLE[msg.status] || STATUS_STYLE.pending;
                        return (
                            <div key={msg._id} style={S.msgRow}>
                                <span style={{ fontSize: 18 }}>{PLATFORM_ICON[msg.platform]}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 500 }}>{msg.senderName} <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: 12 }}>via {msg.platform}</span></div>
                                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.customerMessage}</div>
                                </div>
                                <div style={{ fontSize: 10, padding: '3px 10px', borderRadius: 10, background: st.bg, color: st.color, border: `1px solid ${st.color}`, whiteSpace: 'nowrap' }}>{st.label}</div>
                                <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {msg.status === 'review_needed' && <button className="btn btn-sm" onClick={() => setReviewing(msg)} style={{ background: 'var(--orange-dim)', color: 'var(--orange)', border: '1px solid var(--orange)', whiteSpace: 'nowrap' }}>Review</button>}
                            </div>
                        );
                    })}
                </div>
            )}

            {showForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
                        <MetaApiForm onSuccess={() => { setShowForm(false); loadChannels(); }} onCancel={() => setShowForm(false)} />
                    </div>
                </div>
            )}

            {reviewing && <ReviewModal message={reviewing} onClose={() => setReviewing(null)} onSuccess={() => { setReviewing(null); loadMessages(); }} />}
        </div>
    );
}