// Email service — SendGrid দিয়ে invite পাঠায়
// ⚠️ npm install @sendgrid/mail  (server এ)
// ⚠️ env: SENDGRID_API_KEY, EMAIL_FROM, CLIENT_URL

let sgMail = null;
try {
    sgMail = require('@sendgrid/mail');
    if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
} catch (e) {
    console.warn('⚠️ @sendgrid/mail not installed — email disabled');
}

const FROM = process.env.EMAIL_FROM || 'noreply@softbrainchat.com';
const CLIENT_URL = process.env.CLIENT_URL || 'https://softbrainchat-ai.vercel.app';

// ── Agent invite email পাঠাও ──
async function sendAgentInvite({ toEmail, agentName, ownerName, ownerEmail, inviteToken }) {
    if (!sgMail || !process.env.SENDGRID_API_KEY) {
        console.warn('SendGrid not configured — invite email skipped');
        return { sent: false, reason: 'email not configured' };
    }

    const inviteLink = `${CLIENT_URL}/accept-invite?token=${inviteToken}`;

    const html = `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 20px;">
    <div style="text-align:center; margin-bottom: 24px;">
      <span style="font-size: 32px;">🧠</span>
      <h1 style="font-size: 22px; color: #1a1f2b; margin: 8px 0;">SoftBrainChat</h1>
    </div>
    <div style="background: #f7f8fa; border-radius: 12px; padding: 28px;">
      <h2 style="font-size: 18px; color: #1a1f2b; margin-top: 0;">আপনি আমন্ত্রিত! 🎉</h2>
      <p style="font-size: 14px; color: #59616f; line-height: 1.6;">
        হ্যালো ${agentName},<br><br>
        <strong>${ownerName}</strong> আপনাকে SoftBrainChat এ তাদের team এ agent হিসেবে যোগ করেছেন।
        নিচের button এ click করে আপনার password তৈরি করুন এবং শুরু করুন।
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${inviteLink}" style="display: inline-block; background: #3b82f6; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">
          Invite Accept করুন →
        </a>
      </div>
      <p style="font-size: 12px; color: #8b93a3; line-height: 1.6;">
        অথবা এই link browser এ paste করুন:<br>
        <a href="${inviteLink}" style="color: #3b82f6; word-break: break-all;">${inviteLink}</a>
      </p>
    </div>
    <p style="font-size: 11px; color: #8b93a3; text-align: center; margin-top: 20px;">
      যদি আপনি এই invite আশা না করে থাকেন, এই email উপেক্ষা করুন।<br>
      © 2026 SoftBrainChat
    </p>
  </div>`;

    try {
        const msg = {
            to: toEmail,
            from: { email: FROM, name: `${ownerName} · SoftBrainChat` },   // ভেতরে client এর নাম দেখায়
            subject: `${ownerName} আপনাকে SoftBrainChat team এ যোগ করেছেন`,
            html,
            // ── spam কমানোর জন্য plain text version + settings ──
            text: `হ্যালো ${agentName},\n\n${ownerName} আপনাকে SoftBrainChat team এ agent হিসেবে যোগ করেছেন।\n\nInvite accept করতে এই link এ যান:\n${inviteLink}\n\nএখানে আপনার password তৈরি করে login করুন।\n\n© 2026 SoftBrainChat`,
            mailSettings: {
                bypassListManagement: { enable: false },
            },
            trackingSettings: {
                clickTracking: { enable: false, enableText: false },   // click tracking off → কম spam
                openTracking: { enable: false },
            },
        };
        // Reply-To = client এর email (agent reply করলে সরাসরি client পাবে)
        if (ownerEmail) {
            msg.replyTo = { email: ownerEmail, name: ownerName };
        }
        await sgMail.send(msg);
        return { sent: true, inviteLink };
    } catch (err) {
        console.error('SendGrid error:', err.response?.body || err.message);
        return { sent: false, reason: err.message, inviteLink };
    }
}

module.exports = { sendAgentInvite };