import { useState } from 'react';
import { metaService } from '../../services/metaService';
import toast from 'react-hot-toast';

const PLATFORM_ICON = { whatsapp: '💬', messenger: '📘', instagram: '📸' };
const PLATFORM_COLOR = { whatsapp: 'var(--green)', messenger: 'var(--accent)', instagram: '#E1306C' };

export default function ChannelCard({ channel, onUpdate, onDelete }) {
    const [autoReply, setAutoReply] = useState(channel.autoReplyEnabled);
    const [saving, setSaving] = useState(false);

    const toggleAutoReply = async () => {
        setSaving(true);
        try {
            await metaService.updateChannel(channel._id, { autoReplyEnabled: !autoReply });
            setAutoReply(v => !v);
            toast.success(`Auto-reply ${!autoReply ? 'চালু' : 'বন্ধ'} হয়েছে`);
            onUpdate?.();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`"${channel.name}" channel delete করবেন?`)) return;
        try {
            await metaService.deleteChannel(channel._id);
            toast.success('Channel deleted');
            onDelete?.();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const color = PLATFORM_COLOR[channel.platform];

    return (
        <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderLeft: `3px solid ${color}`,
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
        }}>
            {/* Icon */}
            <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: `${color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
            }}>
                {PLATFORM_ICON[channel.platform]}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    {channel.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                    {channel.platform} · {channel.stats?.totalMessages || 0} messages ·{' '}
                    <span style={{ color: 'var(--green)' }}>{channel.stats?.aiReplied || 0} AI replied</span>
                    {channel.stats?.humanReplied > 0 && (
                        <span style={{ color: 'var(--orange)' }}> · {channel.stats.humanReplied} human reviewed</span>
                    )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
                    Model: {channel.model} · RAG: {channel.ragEnabled ? 'ON' : 'OFF'}
                </div>
            </div>

            {/* Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Auto-reply</span>
                <div
                    onClick={!saving ? toggleAutoReply : undefined}
                    style={{
                        width: 40, height: 22, borderRadius: 11,
                        background: autoReply ? 'var(--accent)' : 'var(--border-2)',
                        position: 'relative', cursor: saving ? 'wait' : 'pointer',
                        transition: 'background .2s', flexShrink: 0,
                    }}
                >
                    <div style={{
                        width: 18, height: 18, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 2,
                        left: autoReply ? 20 : 2,
                        transition: 'left .2s',
                    }} />
                </div>
            </div>

            {/* Delete */}
            <button
                onClick={handleDelete}
                style={{
                    background: 'none', border: 'none', color: 'var(--text-3)',
                    cursor: 'pointer', fontSize: 16, padding: 4, borderRadius: 6,
                    transition: 'color .15s',
                }}
                title="Delete channel"
            >
                🗑️
            </button>
        </div>
    );
}