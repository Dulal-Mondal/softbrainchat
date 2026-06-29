const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Conversation থেকে lead data extract করো ──────────────────
// messages: [{ from: 'customer'|'ai'|'human', text }]
async function analyzeLeadFromConversation(messages) {
    // শুধু text গুলো নাও, একটা transcript বানাও
    const transcript = messages
        .filter(m => m.text && !m.text.startsWith('http'))   // image URL বাদ
        .map(m => {
            const who = m.from === 'customer' ? 'Customer' : 'Business';
            return `${who}: ${m.text}`;
        })
        .join('\n');

    if (!transcript || transcript.length < 20) {
        return null;   // যথেষ্ট conversation নেই
    }

    const systemPrompt = `তুমি একজন sales analyst। নিচের customer conversation থেকে lead qualification data বের করো।

শুধু একটা JSON object দাও (অন্য কিছু না):
{
  "problem": "customer এর মূল সমস্যা/প্রয়োজন কী (এক লাইনে, বাংলায়)। না বুঝলে খালি string",
  "urgency": "high / medium / low / unknown — কত দ্রুত তার দরকার",
  "budget": "customer এর budget বা price নিয়ে কথা বললে সেটা, নাহলে খালি string",
  "interest": "hot / warm / cold — customer কতটা আগ্রহী",
  "summary": "এই lead সম্পর্কে এক বাক্যে সারসংক্ষেপ (বাংলায়)",
  "score": 0-100 সংখ্যা (lead কতটা ভালো — আগ্রহ, urgency, budget মিলিয়ে)
}

কোনো তথ্য না পেলে সেই field খালি string বা "unknown" দাও।`;

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',   // সস্তা ও দ্রুত
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: transcript },
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' },
        });

        const raw = completion.choices[0].message.content;
        const data = JSON.parse(raw);

        return {
            problem: data.problem || '',
            urgency: data.urgency || 'unknown',
            budget: data.budget || '',
            interest: data.interest || 'cold',
            summary: data.summary || '',
            score: Math.min(100, Math.max(0, Number(data.score) || 0)),
        };
    } catch (err) {
        console.warn('Lead analysis failed:', err.message);
        return null;
    }
}

module.exports = { analyzeLeadFromConversation };