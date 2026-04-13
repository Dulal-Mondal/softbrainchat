import { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const PlanContext = createContext(null);

// Client-side feature flags — server side এ ও enforce হয়
const PLAN_FEATURES = {
    'free': { metaReply: false, customLLM: false, chatFlows: false },
    'pro': { metaReply: true, customLLM: true, chatFlows: true },
    'pro-max': { metaReply: true, customLLM: true, chatFlows: true },
};

export function PlanProvider({ children }) {
    const { user } = useAuth();

    const plan = user?.effectivePlan || 'free';
    const features = PLAN_FEATURES[plan] || PLAN_FEATURES['free'];
    const limits = user?.planLimits || {};
    const usage = user?.usage || { messagesThisMonth: 0 };

    const canAccess = (feature) => !!features[feature];

    const usagePercent = () => {
        const max = limits.messagesPerMonth;
        if (!max || max === Infinity) return 0;
        return Math.min(100, Math.round((usage.messagesThisMonth / max) * 100));
    };

    return (
        <PlanContext.Provider value={{ plan, features, limits, usage, canAccess, usagePercent }}>
            {children}
        </PlanContext.Provider>
    );
}

export function usePlan() {
    const ctx = useContext(PlanContext);
    if (!ctx) throw new Error('usePlan must be used inside PlanProvider');
    return ctx;
}

export default PlanContext;