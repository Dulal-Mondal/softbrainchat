import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSocketEvent } from '../hooks/useSocket';
import ContactPanel from '../components/ContactPanel';

const PLATFORMS = [
    { key: 'all', label: 'All messages', icon: '📥' },
    { key: 'messenger', label: 'Messenger', icon: '📘' },
    { key: 'instagram', label: 'Instagram', icon: '📸' },
    { key: 'whatsapp', label: 'WhatsApp', icon: '💬' },
];

export default function Inbox() {
    const [platform, setPlatform] = useState('all');
    const [conversations, setConversations] = useState([]);
    const [search, setSearch] = useState('');
    const [tagFilter, setTagFilter] = useState('');
    const [allTags, setAllTags] = useState([]);
    const [active, setActive] = useState(null);          // {senderId, channelId}
    const [contact, setContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const scrollRef = useRef(null);

    // ── Load conversation list ──
    const loadConversations = useCallback(async () => {
        try {
            const params = { platform, search };
            if (tagFilter) params.tag = tagFilter;
            const res = await api.get('/conversations', { params });
            setConversations(res.conversations || res.data?.conversations || []);
        } catch (err) { toast.error(err.message); }
    }, [platform, search, tagFilter]);

    useEffect(() => { loadConversations(); }, [loadConversations]);

    // ── Load all tags for filter ──
    useEffect(() => {
        api.get('/contacts/meta/tags')
            .then(res => setAllTags(res.tags || res.data?.tags || []))
            .catch(() => { });
    }, [conversations]);

    // ── Load active conversation ──
    const loadConversation = useCallback(async (senderId, channelId) => {
        try {
            const res = await api.get(`/conversations/${senderId}/${channelId}`);
            setContact(res.contact || res.data?.contact);
            setMessages(res.messages || res.data?.messages || []);
            setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 100);
        } catch (err) { toast.error(err.message); }
    }, []);

    const openConversation = (c) => {
        setActive({ senderId: c.senderId, channelId: c.channelId });
        loadConversation(c.senderId, c.channelId);
    };

    // ── Real-time updates ──
    useSocketEvent('meta:new_message', () => {
        loadConversations();
        if (active) loadConversation(active.senderId, active.channelId);
    });
    useSocketEvent('meta:message_updated', () => {
        if (active) loadConversation(active.senderId, active.channelId);
    });

    // ── Send reply ──
    const handleSend = async () => {
        if (!reply.trim() && !imageFile) return;
        setSending(true);
        try {
            let imageBase64 = null, imageMimeType = null;
            if (imageFile) {
                imageBase64 = await fileToBase64(imageFile);
                imageMimeType = imageFile.type;
            }
            await api.post(`/conversations/${active.senderId}/${active.channelId}/reply`, {
                text: reply, imageBase64, imageMimeType,
            });
            setReply(''); setImageFile(null);
            loadConversation(active.senderId, active.channelId);
            loadConversations();
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally { setSending(false); }
    };

    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const timeAgo = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = (now - d) / 1000;
        if (diff < 60) return 'now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return d.toLocaleDateString();
    };

    const isImageUrl = (t) => /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)/i.test(t) || t?.includes('cloudinary');

    return (
        <div style={{ height: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>

            {/* ── Top platform tabs ── */}
            <div style={{ display: 'flex', gap: 4, padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                {PLATFORMS.map(p => (
                    <button key={p.key} onClick={() => { setPlatform(p.key); setActive(null); }}
                        style={{
                            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans',sans-serif",
                            background: platform === p.key ? 'var(--accent-dim)' : 'transparent',
                            color: platform === p.key ? 'var(--accent-2)' : 'var(--text-2)',
                        }}>
                        {p.icon} {p.label}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                {/* ── LEFT: Conversation list ── */}
                <div style={{ width: 340, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
                    <div style={{ padding: 14 }}>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search..."
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border-2)', background: 'var(--bg-tertiary)', color: 'var(--text)', fontSize: 13, outline: 'none' }} />

                        {/* Tag filter chips */}
                        {allTags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                                <button onClick={() => setTagFilter('')}
                                    style={{
                                        padding: '3px 10px', borderRadius: 12, fontSize: 11, cursor: 'pointer',
                                        border: '1px solid var(--border)',
                                        background: !tagFilter ? 'var(--accent)' : 'transparent',
                                        color: !tagFilter ? '#fff' : 'var(--text-3)',
                                    }}>
                                    All
                                </button>
                                {allTags.map(tag => (
                                    <button key={tag} onClick={() => setTagFilter(tag === tagFilter ? '' : tag)}
                                        style={{
                                            padding: '3px 10px', borderRadius: 12, fontSize: 11, cursor: 'pointer',
                                            border: '1px solid var(--border)',
                                            background: tagFilter === tag ? 'var(--accent)' : 'transparent',
                                            color: tagFilter === tag ? '#fff' : 'var(--text-3)',
                                        }}>
                                        🏷️ {tag}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {conversations.length === 0 && (
                            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>কোনো conversation নেই</div>
                        )}
                        {conversations.map((c, i) => (
                            <div key={i} onClick={() => openConversation(c)}
                                style={{
                                    display: 'flex', gap: 10, padding: '12px 14px', cursor: 'pointer',
                                    borderBottom: '1px solid var(--border)',
                                    background: active?.senderId === c.senderId ? 'var(--accent-dim)' : 'transparent',
                                }}>
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    {c.senderProfilePic ? (
                                        <img src={c.senderProfilePic} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600 }}>
                                            {c.senderName?.[0]?.toUpperCase() || 'C'}
                                        </div>
                                    )}
                                    <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 13 }}>
                                        {PLATFORMS.find(p => p.key === c.platform)?.icon}
                                    </span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.senderName}</span>
                                        <span style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>{timeAgo(c.lastMessage.createdAt)}</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                                        {c.lastMessage.fromAI ? 'You: ' : ''}{c.lastMessage.text}
                                    </div>
                                </div>
                                {c.unreadCount > 0 && (
                                    <span style={{ background: 'var(--orange)', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 10, height: 'fit-content', alignSelf: 'center' }}>{c.unreadCount}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── CENTER: Chat window ── */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
                    {!active ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 14 }}>
                            একটা conversation select করুন
                        </div>
                    ) : (
                        <>
                            {/* Chat header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                                {contact?.profilePic ? (
                                    <img src={contact.profilePic} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                                        {contact?.name?.[0]?.toUpperCase() || 'C'}
                                    </div>
                                )}
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{contact?.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                                        {contact?.phone || `via ${contact?.platform}`}
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {messages.map((m) => {
                                    const isBroadcast = m.from === 'broadcast';
                                    // bubble background per type
                                    const bg = m.from === 'customer' ? 'var(--bg-tertiary)'
                                        : isBroadcast ? 'var(--purple-dim, #2a1f3d)'
                                            : m.from === 'human' ? 'var(--green-dim)'
                                                : 'var(--accent)';
                                    const color = m.from === 'customer' ? 'var(--text)'
                                        : isBroadcast ? 'var(--purple, #a78bfa)'
                                            : m.from === 'human' ? 'var(--green)'
                                                : '#fff';
                                    return (
                                        <div key={m._id} style={{ display: 'flex', justifyContent: m.from === 'customer' ? 'flex-start' : 'flex-end' }}>
                                            <div style={{
                                                maxWidth: '70%', padding: '9px 14px', borderRadius: 14, fontSize: 13.5, lineHeight: 1.5,
                                                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                                background: bg, color: color,
                                                border: isBroadcast ? '1px solid var(--purple, #a78bfa)' : 'none',
                                            }}>
                                                {isImageUrl(m.text)
                                                    ? <img src={m.text} style={{ maxWidth: 200, borderRadius: 8 }} />
                                                    : m.text}
                                                {m.from !== 'customer' && (
                                                    <div style={{ fontSize: 10, opacity: 0.8, marginTop: 3 }}>
                                                        {m.from === 'ai' ? '🤖 AI'
                                                            : isBroadcast ? m.repliedBy   /* "📢 Broadcast: নাম" */
                                                                : `👤 ${m.repliedBy}`} · {timeAgo(m.createdAt)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Reply box */}
                            <div style={{ padding: 14, borderTop: '1px solid var(--border)' }}>
                                {imageFile && (
                                    <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--accent-2)' }}>
                                        📎 {imageFile.name} <button onClick={() => setImageFile(null)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}>✕</button>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                                    <label style={{ cursor: 'pointer', fontSize: 20, padding: '6px' }}>
                                        📎
                                        <input type="file" accept="image/*" style={{ display: 'none' }}
                                            onChange={e => setImageFile(e.target.files[0])} />
                                    </label>
                                    <textarea value={reply} onChange={e => setReply(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                        placeholder={`Reply in ${contact?.platform}...`}
                                        style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-2)', background: 'var(--bg-tertiary)', color: 'var(--text)', fontSize: 13, outline: 'none', resize: 'none', minHeight: 20, maxHeight: 100, fontFamily: "'DM Sans',sans-serif" }} />
                                    <button onClick={handleSend} disabled={sending} className="btn btn-primary" style={{ padding: '10px 18px' }}>
                                        {sending ? '...' : '➤'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ── RIGHT: Contact panel (assign + lead + details) ── */}
                {active && contact && (
                    <ContactPanel
                        contact={contact}
                        onUpdate={() => loadConversation(active.senderId, active.channelId)}
                    />
                )}
            </div>
        </div>
    );
}