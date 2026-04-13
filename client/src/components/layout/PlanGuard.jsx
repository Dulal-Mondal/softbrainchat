import { Link } from 'react-router-dom';
import { usePlan } from '../../context/PlanContext';

// Usage: <PlanGuard feature="metaReply"><MetaPage /></PlanGuard>
export default function PlanGuard({ feature, children }) {
    const { plan, canAccess } = usePlan();

    if (feature && !canAccess(feature)) {
        return (
            <div style={{
                padding: 40,
                textAlign: 'center',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                margin: 24,
            }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>🔒</div>
                <h3 style={{ fontFamily: 'Syne', fontSize: 18, marginBottom: 8 }}>
                    এই feature টি আপনার plan এ নেই
                </h3>
                <p style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 22, lineHeight: 1.6 }}>
                    আপনি এখন <strong>{plan}</strong> plan এ আছেন।
                    Upgrade করলে এই feature use করতে পারবেন।
                </p>
                <Link
                    to="/billing"
                    className="btn btn-primary"
                    style={{ padding: '10px 28px' }}
                >
                    Upgrade করুন →
                </Link>
            </div>
        );
    }

    return children;
}