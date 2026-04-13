import { useState } from 'react';
import { metaService } from '../../services/metaService';
import toast from 'react-hot-toast';

const PLATFORM_ICON = { whatsapp: '💬', messenger: '📘', instagram: '📸' };

export default function ReviewModal({ message, onClose, onSuccess }) {
    const [reply, setReply] = useState(message.aiReply || '');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!reply.trim()) { toast.error('Reply লিখুন'); return; }
        setLoading(true);
        try {
            await metaService.humanReply(message._id, reply);
            toast.success('Reply sent!');
            onSuccess?.();
            onClose();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20,
        }}>
            <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 16, padding: 24,
                width: '100%', maxWidth: 520,
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <h3 style={{ fontFamily: 'Syne', fontSize: 16 }}>
                        {PLATFORM_ICON[message.platform]} Human Review
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 18 }}>✕</button>
                </div>

                {/* Customer message */}
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.6px' }}>
                        {message.senderName} এর message
                    </div>
                    <div style={{
                        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                        borderRadius: 8, padding: 12, fontSize: 13, color: 'var(--text)',
                        lineHeight: 1.6,
                    }}>
                        {message.customerMessage}
                    </div>
                </div>

                {/* AI reply (editable) */}
                <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.6px' }}>
                        Reply (AI draft — edit করতে পারবেন)
                    </div>
                    <textarea
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                        rows={5}
                        style={{
                            width: '100%', background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-2)', borderRadius: 8,
                            padding: 12, color: 'var(--text)', fontSize: 13,
                            resize: 'vertical', outline: 'none', lineHeight: 1.6,
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                        placeholder="Customer কে reply লিখুন..."
                    />
                    {message.sources?.length > 0 && (
                        <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {message.sources.map((s, i) => (
                                <span key={i} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'var(--purple-dim)', color: 'var(--purple)', border: '1px solid var(--purple)' }}>
                                    {s.file || s.url}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {!message.aiConfident && (
                    <div style={{
                        background: 'var(--orange-dim)', border: '1px solid var(--orange)',
                        borderRadius: 8, padding: 10, fontSize: 12, color: 'var(--orange)',
                        marginBottom: 16, marginTop: 8,
                    }}>
                        ⚠️ AI এই প্রশ্নের উত্তর দিতে পারেনি। আপনার reply টি customer কে সরাসরি পাঠানো হবে।
                    </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSend} disabled={loading}>
                        {loading ? 'Sending...' : `Send via ${message.platform} →`}
                    </button>
                </div>
            </div>
        </div>
    );
}