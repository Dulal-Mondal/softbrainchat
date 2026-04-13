import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import { useChat } from '../hooks/useChat';
import { knowledgeService } from '../services/knowledgeService';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

const BUILTIN_MODELS = [
    { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI' },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenAI' },
    { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
];

export default function Chat() {
    const { user } = useAuth();
    const { plan, limits, usage } = usePlan();

    const {
        messages, loading, history, notification, setNotification,
        loadHistory, loadChat, sendMessage, newChat, correctMessage, deleteChat,
    } = useChat();

    const [input, setInput] = useState('');
    const [model, setModel] = useState(user?.preferences?.defaultModel || 'gpt-4o');
    const [ragEnabled, setRagEnabled] = useState(true);
    const [kbItems, setKbItems] = useState([]);
    const [correcting, setCorrecting] = useState(null);
    const [correction, setCorrection] = useState('');
    const [addingUrl, setAddingUrl] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => { loadHistory(); loadKB(); }, []);
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const loadKB = async () => {
        try { const d = await knowledgeService.getAll(); setKbItems(d.items); } catch { }
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim()) return;
        const msg = input.trim();
        setInput('');
        await sendMessage({ message: msg, model, ragEnabled });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';
        try {
            toast.loading('Uploading...', { id: 'kbu' });
            await knowledgeService.uploadFile(file);
            toast.success('Uploaded! Indexing in background...', { id: 'kbu' });
            loadKB();
        } catch (err) {
            toast.error(err.message, { id: 'kbu' });
        }
    };

    const handleAddUrl = async (e) => {
        e.preventDefault();
        if (!urlInput.trim()) return;
        try {
            toast.loading('Scraping URL...', { id: 'kburl' });
            await knowledgeService.addUrl(urlInput.trim());
            toast.success('URL added! Indexing in background...', { id: 'kburl' });
            setUrlInput(''); setAddingUrl(false); loadKB();
        } catch (err) { toast.error(err.message, { id: 'kburl' }); }
    };

    const usedPct = limits.messagesPerMonth === Infinity ? 0
        : Math.min(100, Math.round((usage.messagesThisMonth / limits.messagesPerMonth) * 100));

    const indexedKB = kbItems.filter(k => k.status === 'indexed');
    const allModels = [
        ...BUILTIN_MODELS,
        ...(user?.llmProviders || []).map(p => ({ id: p.name, label: `🔌 ${p.name}`, provider: 'Custom' })),
    ];

    // ── Styles ───────────────────────────────────────────────────
    const S = {
        wrap: { display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' },
        sidebar: { width: 220, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' },
        main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        topbar: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 },
        msgArea: { flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 },
        row: (role) => ({ display: 'flex', gap: 10, alignSelf: role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '78%', flexDirection: role === 'user' ? 'row-reverse' : 'row' }),
        avatar: (role) => ({ width: 28, height: 28, borderRadius: '50%', background: role === 'user' ? 'var(--accent-dim)' : 'var(--bg-tertiary)', color: role === 'user' ? 'var(--accent-2)' : 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0, marginTop: 2 }),
        bubble: (role) => ({ padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.6, background: role === 'user' ? 'var(--accent)' : 'var(--bg-secondary)', color: role === 'user' ? '#fff' : 'var(--text)', border: role === 'user' ? 'none' : '1px solid var(--border)' }),
        inputWrap: { display: 'flex', gap: 8, alignItems: 'flex-end', background: 'var(--bg-tertiary)', border: '1px solid var(--border-2)', borderRadius: 12, padding: '8px 12px' },
        textarea: { flex: 1, background: 'none', border: 'none', color: 'var(--text)', fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: 'none', resize: 'none', lineHeight: 1.5, maxHeight: 120 },
        sendBtn: { width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    };

    return (
        <div style={S.wrap}>

            {/* ── SIDEBAR ─────────────────────────────────────────── */}
            <div style={S.sidebar}>
                <div style={{ padding: 10 }}>
                    <button onClick={newChat} className="btn btn-primary" style={{ width: '100%', fontSize: 13 }}>+ New Chat</button>
                </div>

                <div className="section-label">Recent Chats</div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 6px' }}>
                    {history.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '8px 8px' }}>No chats yet</div>}
                    {history.map(c => (
                        <div key={c._id}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 8px', borderRadius: 7, fontSize: 12, color: 'var(--text-2)', cursor: 'pointer', marginBottom: 2 }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            onClick={() => loadChat(c._id)}>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                            <span onClick={e => { e.stopPropagation(); deleteChat(c._id); }} style={{ color: 'var(--text-3)', fontSize: 14, opacity: .6 }} title="Delete">✕</span>
                        </div>
                    ))}
                </div>

                <div className="section-label">Knowledge Base</div>
                <div style={{ padding: '0 8px 6px' }}>
                    {kbItems.slice(0, 5).map(k => (
                        <div key={k._id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 4px', fontSize: 11, color: 'var(--text-2)' }}>
                            <span>{k.type === 'file' ? '📄' : '🌐'}</span>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.name.split('/').pop().substring(0, 22)}</span>
                            <span style={{ fontSize: 10, color: k.status === 'indexed' ? 'var(--green)' : k.status === 'failed' ? 'var(--red)' : 'var(--orange)' }}>
                                {k.status === 'indexed' ? '✓' : k.status === 'failed' ? '✗' : '…'}
                            </span>
                        </div>
                    ))}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 4px', fontSize: 12, color: 'var(--accent-2)', cursor: 'pointer' }}>
                        <input type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={handleFileUpload} />
                        + Upload File
                    </label>
                    {addingUrl ? (
                        <form onSubmit={handleAddUrl} style={{ display: 'flex', gap: 4, padding: '4px 0' }}>
                            <input className="input" style={{ fontSize: 11, padding: '5px 8px', flex: 1 }} value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..." autoFocus />
                            <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '4px 8px', fontSize: 11 }}>+</button>
                            <button type="button" className="btn btn-outline btn-sm" style={{ padding: '4px 6px', fontSize: 11 }} onClick={() => setAddingUrl(false)}>✕</button>
                        </form>
                    ) : (
                        <div onClick={() => setAddingUrl(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 4px', fontSize: 12, color: 'var(--accent-2)', cursor: 'pointer' }}>
                            + Add URL
                        </div>
                    )}
                </div>

                <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>
                        {plan.toUpperCase()} · {limits.messagesPerMonth === Infinity ? 'Unlimited' : `${usage.messagesThisMonth}/${limits.messagesPerMonth} msgs`}
                    </div>
                    {limits.messagesPerMonth !== Infinity && (
                        <div className="progress-track"><div className="progress-fill" style={{ width: `${usedPct}%` }} /></div>
                    )}
                </div>
            </div>

            {/* ── MAIN ────────────────────────────────────────────── */}
            <div style={S.main}>

                {/* Top bar */}
                <div style={S.topbar}>
                    <select value={model} onChange={e => setModel(e.target.value)}
                        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 10px', borderRadius: 7, fontSize: 12, outline: 'none' }}>
                        {allModels.map(m => <option key={m.id} value={m.id}>{m.label} ({m.provider})</option>)}
                    </select>

                    <div onClick={() => setRagEnabled(v => !v)} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                        border: `1px solid ${ragEnabled ? 'var(--green)' : 'var(--border)'}`,
                        background: ragEnabled ? 'var(--green-dim)' : 'var(--bg-tertiary)',
                        color: ragEnabled ? 'var(--green)' : 'var(--text-3)', transition: 'all .15s',
                    }}>
                        🧠 RAG {ragEnabled ? 'ON' : 'OFF'}
                    </div>

                    {ragEnabled && indexedKB.length > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{indexedKB.length} source{indexedKB.length > 1 ? 's' : ''} active</span>
                    )}
                </div>

                {/* Messages */}
                <div style={S.msgArea}>
                    {messages.length === 0 && (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
                            <div style={{ fontSize: 40 }}>🧠</div>
                            <h2 style={{ fontFamily: 'Syne', fontSize: 20, color: 'var(--text)' }}>SoftBrainChat AI</h2>
                            <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', maxWidth: 340, lineHeight: 1.6 }}>
                                আপনার business সম্পর্কে যেকোনো প্রশ্ন করুন।
                                {indexedKB.length > 0 && ` RAG active — ${indexedKB.length}টি knowledge source থেকে উত্তর দেবে।`}
                            </p>
                        </div>
                    )}

                    {messages.map(msg => (
                        <div key={msg._id} style={S.row(msg.role)}>
                            <div style={S.avatar(msg.role)}>
                                {msg.role === 'user' ? (user?.name?.[0]?.toUpperCase() || 'U') : 'AI'}
                            </div>
                            <div>
                                <div style={S.bubble(msg.role)}>
                                    {msg.loading
                                        ? <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>Thinking...</span>
                                        : <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    }
                                </div>
                                {msg.role === 'assistant' && !msg.loading && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 5, alignItems: 'center' }}>
                                        {msg.sources?.map((src, i) => (
                                            <span key={i} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'var(--purple-dim)', color: 'var(--purple)', border: '1px solid var(--purple)' }}>
                                                {src.file || src.url}
                                            </span>
                                        ))}
                                        {msg.corrected
                                            ? <span style={{ fontSize: 11, color: 'var(--green)' }}>✓ Corrected</span>
                                            : <button onClick={() => { setCorrecting(msg._id); setCorrection(msg.content); }}
                                                style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-2)', cursor: 'pointer' }}>
                                                ✏️ Correct
                                            </button>
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                {/* Notification */}
                {notification && (
                    <div style={{ margin: '0 16px 8px', padding: '9px 14px', background: 'var(--orange-dim)', border: '1px solid var(--orange)', borderRadius: 8, fontSize: 12, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        🔔 {notification}
                        <button onClick={() => setNotification(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--orange)', cursor: 'pointer', fontSize: 14 }}>✕</button>
                    </div>
                )}

                {/* Correction panel */}
                {correcting && (
                    <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>✏️ AI এর reply correct করুন:</div>
                        <textarea value={correction} onChange={e => setCorrection(e.target.value)}
                            style={{ width: '100%', minHeight: 80, background: 'var(--bg-tertiary)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5 }} />
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button className="btn btn-primary btn-sm" onClick={() => { correctMessage(correcting, correction); setCorrecting(null); }}>Save Correction</button>
                            <button className="btn btn-outline btn-sm" onClick={() => setCorrecting(null)}>Cancel</button>
                        </div>
                    </div>
                )}

                {/* Input */}
                <div style={{ padding: '10px 16px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
                    <div style={S.inputWrap}>
                        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                            placeholder="আপনার business সম্পর্কে যেকোনো প্রশ্ন করুন..." rows={1} disabled={loading} style={S.textarea} />
                        <label style={{ cursor: 'pointer', color: 'var(--text-3)', fontSize: 18, flexShrink: 0, lineHeight: 1 }} title="Upload to KB">
                            <input type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={handleFileUpload} />
                            📎
                        </label>
                        <button onClick={handleSend} disabled={loading || !input.trim()} style={{ ...S.sendBtn, opacity: loading || !input.trim() ? 0.5 : 1 }}>↑</button>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5, textAlign: 'center' }}>
                        Enter to send · Shift+Enter for new line
                    </div>
                </div>
            </div>
        </div>
    );
}