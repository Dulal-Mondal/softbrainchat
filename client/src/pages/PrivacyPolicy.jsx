// PrivacyPolicy.jsx — Add this to your React Router as /privacy-policy route

import { useEffect } from "react";

export default function PrivacyPolicy() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const sections = [
        {
            title: "Information We Collect",
            content:
                "We collect information you provide when using SoftBrainChat, including messages sent through connected social media channels (Facebook Messenger, WhatsApp, Instagram), account registration details, and usage data. We also receive data from Meta platforms when you connect your Facebook Pages to our service.",
        },
        {
            title: "How We Use Your Information",
            content:
                "We use collected information to provide AI-powered auto-reply services, process and respond to messages through connected channels, improve our platform's performance and accuracy, manage your account, and send service-related communications.",
        },
        {
            title: "Data Sharing",
            content:
                "We do not sell your personal data. We share data only with: Meta platforms (Facebook, WhatsApp, Instagram) to deliver messaging services, AI service providers (such as OpenAI) to generate responses, and cloud infrastructure providers for hosting. All third-party providers are bound by data protection agreements.",
        },
        {
            title: "Meta Platform Data",
            content:
                "SoftBrainChat integrates with Meta's Messenger API. Messages received through Facebook Pages are processed to generate AI responses. We store conversation history only as long as necessary to provide the service. You may disconnect your Facebook Page at any time from the SoftBrainChat dashboard.",
        },
        {
            title: "Data Retention",
            content:
                "We retain your data for as long as your account is active or as needed to provide services. You may request deletion of your data at any time by contacting us. Upon account deletion, your data will be permanently removed within 30 days.",
        },
        {
            title: "Your Rights",
            content:
                "You have the right to access, correct, or delete your personal data. You may also request data portability or restrict processing. To exercise these rights, contact us at the email below. We will respond within 30 days.",
        },
        {
            title: "Cookies",
            content:
                "We use essential cookies for authentication and session management. We do not use tracking or advertising cookies. You may disable cookies in your browser settings, though this may affect platform functionality.",
        },
        {
            title: "Security",
            content:
                "We implement industry-standard security measures including encrypted data transmission (HTTPS), secure token storage, and regular security audits. However, no method of transmission over the internet is 100% secure.",
        },
        {
            title: "Children's Privacy",
            content:
                "SoftBrainChat is not directed to children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.",
        },
        {
            title: "Changes to This Policy",
            content:
                "We may update this Privacy Policy periodically. We will notify you of significant changes via email or a prominent notice on our platform. Continued use of the service after changes constitutes acceptance of the updated policy.",
        },
        {
            title: "Contact Us",
            content:
                "For privacy-related questions or requests, contact us at: dm640183@gmail.com",
        },
    ];

    return (
        <div style={styles.page}>
            <div style={styles.bg} />
            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.logoRow}>
                        <div style={styles.logoIcon}>
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                <circle cx="14" cy="14" r="14" fill="url(#lg)" />
                                <path d="M8 14c0-3.314 2.686-6 6-6s6 2.686 6 6-2.686 6-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                                <circle cx="14" cy="14" r="2" fill="#fff" />
                                <defs>
                                    <linearGradient id="lg" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#6366f1" />
                                        <stop offset="1" stopColor="#06b6d4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <span style={styles.logoText}>SoftBrainChat</span>
                    </div>
                    <div style={styles.badge}>Privacy Policy</div>
                    <h1 style={styles.title}>Your Privacy Matters</h1>
                    <p style={styles.subtitle}>
                        This policy explains how SoftBrainChat collects, uses, and protects
                        your information when you use our AI-powered messaging platform.
                    </p>
                    <p style={styles.date}>
                        Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                </div>

                {/* Sections */}
                <div style={styles.sections}>
                    {sections.map((section, i) => (
                        <div key={i} style={styles.section}>
                            <div style={styles.sectionNumber}>{String(i + 1).padStart(2, "0")}</div>
                            <div style={styles.sectionContent}>
                                <h2 style={styles.sectionTitle}>{section.title}</h2>
                                <p style={styles.sectionText}>{section.content}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    <p style={styles.footerText}>
                        © {new Date().getFullYear()} SoftBrainChat. All rights reserved.
                    </p>
                    <a href="/" style={styles.footerLink}>← Back to Home</a>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#0a0a0f",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        position: "relative",
        overflow: "hidden",
    },
    bg: {
        position: "fixed",
        inset: 0,
        background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(6,182,212,0.08) 0%, transparent 50%)",
        pointerEvents: "none",
        zIndex: 0,
    },
    container: {
        position: "relative",
        zIndex: 1,
        maxWidth: "780px",
        margin: "0 auto",
        padding: "60px 24px 80px",
    },
    header: {
        marginBottom: "60px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        paddingBottom: "48px",
    },
    logoRow: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "28px",
    },
    logoIcon: {
        display: "flex",
        alignItems: "center",
    },
    logoText: {
        fontSize: "18px",
        fontWeight: "600",
        color: "#e2e8f0",
        fontFamily: "'Georgia', serif",
        letterSpacing: "-0.01em",
    },
    badge: {
        display: "inline-block",
        padding: "4px 14px",
        borderRadius: "20px",
        background: "rgba(99,102,241,0.15)",
        border: "1px solid rgba(99,102,241,0.3)",
        color: "#a5b4fc",
        fontSize: "12px",
        fontFamily: "monospace",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: "20px",
    },
    title: {
        fontSize: "clamp(32px, 5vw, 52px)",
        fontWeight: "700",
        color: "#f1f5f9",
        margin: "0 0 16px",
        lineHeight: "1.15",
        letterSpacing: "-0.02em",
    },
    subtitle: {
        fontSize: "17px",
        color: "#94a3b8",
        lineHeight: "1.7",
        margin: "0 0 20px",
        maxWidth: "600px",
    },
    date: {
        fontSize: "13px",
        color: "#475569",
        fontFamily: "monospace",
    },
    sections: {
        display: "flex",
        flexDirection: "column",
        gap: "0",
    },
    section: {
        display: "flex",
        gap: "28px",
        padding: "36px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        alignItems: "flex-start",
    },
    sectionNumber: {
        flexShrink: 0,
        width: "36px",
        fontSize: "11px",
        fontFamily: "monospace",
        color: "#334155",
        paddingTop: "4px",
        letterSpacing: "0.05em",
    },
    sectionContent: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: "18px",
        fontWeight: "600",
        color: "#e2e8f0",
        margin: "0 0 12px",
        letterSpacing: "-0.01em",
    },
    sectionText: {
        fontSize: "15px",
        color: "#94a3b8",
        lineHeight: "1.75",
        margin: 0,
    },
    footer: {
        marginTop: "60px",
        paddingTop: "32px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
    },
    footerText: {
        fontSize: "13px",
        color: "#334155",
        margin: 0,
    },
    footerLink: {
        fontSize: "13px",
        color: "#6366f1",
        textDecoration: "none",
    },
};