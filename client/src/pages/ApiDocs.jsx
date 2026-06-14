import { useState } from 'react';
import { Link } from 'react-router-dom';

const BASE_URL = 'https://softbrainchat.onrender.com';

const ENDPOINTS = [
    {
        method: 'GET',
        path: '/api/v1/ping',
        title: 'Connection Test',
        desc: 'API connection এবং API key valid কিনা test করুন।',
        params: [],
        response: `{
  "success": true,
  "message": "SoftBrainChat OMS API is running",
  "api_key": "My OMS Software",
  "timestamp": "2026-04-20T10:30:00.000Z"
}`,
    },
    {
        method: 'GET',
        path: '/api/v1/orders',
        title: 'List Orders',
        desc: 'সব orders নিয়ে আসুন। Filter এবং pagination supported।',
        params: [
            { name: 'status', type: 'string', desc: 'pending | confirmed | processing | shipped | delivered | cancelled | all', default: 'pending' },
            { name: 'platform', type: 'string', desc: 'whatsapp | messenger | instagram', default: 'all' },
            { name: 'from', type: 'date', desc: 'Start date (ISO 8601): 2026-04-01', default: '-' },
            { name: 'to', type: 'date', desc: 'End date (ISO 8601): 2026-04-30', default: '-' },
            { name: 'page', type: 'number', desc: 'Page number', default: '1' },
            { name: 'limit', type: 'number', desc: 'Per page (max 100)', default: '50' },
        ],
        response: `{
  "success": true,
  "total": 45,
  "page": 1,
  "limit": 50,
  "orders": [
    {
      "order_id": "ORD-1713600000-123",
      "status": "pending",
      "platform": "messenger",
      "customer": {
        "name": "Rahim Uddin",
        "phone": "01711234567",
        "address": "বাড়ি ৫, রোড ৩, ধানমন্ডি, ঢাকা"
      },
      "product": {
        "name": "Organic Honey 500g",
        "price": "৳450",
        "quantity": 1
      },
      "notes": "",
      "ordered_at": "2026-04-20T10:30:00.000Z",
      "updated_at": "2026-04-20T10:30:00.000Z"
    }
  ]
}`,
    },
    {
        method: 'GET',
        path: '/api/v1/orders/:order_id',
        title: 'Get Single Order',
        desc: 'একটি নির্দিষ্ট order এর সম্পূর্ণ তথ্য নিন।',
        params: [
            { name: 'order_id', type: 'string', desc: 'Order ID (e.g. ORD-1713600000-123)', default: '-' },
        ],
        response: `{
  "success": true,
  "order": {
    "order_id": "ORD-1713600000-123",
    "status": "pending",
    "platform": "messenger",
    "customer": {
      "name": "Rahim Uddin",
      "phone": "01711234567",
      "address": "বাড়ি ৫, রোড ৩, ধানমন্ডি, ঢাকা"
    },
    "product": {
      "name": "Organic Honey 500g",
      "price": "৳450",
      "quantity": 1
    },
    "notes": "",
    "ordered_at": "2026-04-20T10:30:00.000Z",
    "updated_at": "2026-04-20T10:30:00.000Z"
  }
}`,
    },
    {
        method: 'PATCH',
        path: '/api/v1/orders/:order_id',
        title: 'Update Order Status',
        desc: 'Order এর status update করুন এবং OMS order ID sync করুন।',
        params: [
            { name: 'status', type: 'string', desc: 'confirmed | processing | shipped | delivered | cancelled', default: '-' },
            { name: 'oms_order_id', type: 'string', desc: 'আপনার OMS এর order ID (optional)', default: '-' },
            { name: 'notes', type: 'string', desc: 'Internal notes (optional)', default: '-' },
        ],
        response: `{
  "success": true,
  "order_id": "ORD-1713600000-123",
  "status": "shipped",
  "updated_at": "2026-04-20T11:00:00.000Z"
}`,
    },
];

const METHOD_COLOR = {
    GET: { bg: '#0d2e1f', color: '#2ecc8a' },
    PATCH: { bg: 'var(--orange-dim)', color: 'var(--orange)' },
    POST: { bg: 'var(--accent-dim)', color: 'var(--accent-2)' },
};

const CODE_EXAMPLES = {
    curl: (endpoint, apiKey) => {
        const url = `${BASE_URL}${endpoint.path.replace(':order_id', 'ORD-1713600000-123')}`;
        if (endpoint.method === 'GET') {
            return `curl -X GET "${url}" \\
  -H "X-API-Key: ${apiKey || 'sbc_your_api_key_here'}"`;
        }
        return `curl -X PATCH "${url}" \\
  -H "X-API-Key: ${apiKey || 'sbc_your_api_key_here'}" \\
  -H "Content-Type: application/json" \\
  -d '{"status": "shipped", "oms_order_id": "YOUR-OMS-123"}'`;
    },

    javascript: (endpoint, apiKey) => {
        const url = `${BASE_URL}${endpoint.path.replace(':order_id', 'ORD-1713600000-123')}`;
        if (endpoint.method === 'GET') {
            return `const response = await fetch("${url}", {
  headers: {
    "X-API-Key": "${apiKey || 'sbc_your_api_key_here'}"
  }
});
const data = await response.json();
console.log(data.orders);`;
        }
        return `const response = await fetch("${url}", {
  method: "PATCH",
  headers: {
    "X-API-Key": "${apiKey || 'sbc_your_api_key_here'}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    status: "shipped",
    oms_order_id: "YOUR-OMS-123"
  })
});
const data = await response.json();`;
    },

    php: (endpoint, apiKey) => {
        const url = `${BASE_URL}${endpoint.path.replace(':order_id', 'ORD-1713600000-123')}`;
        if (endpoint.method === 'GET') {
            return `$curl = curl_init();
curl_setopt_array($curl, [
  CURLOPT_URL => "${url}",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "X-API-Key: ${apiKey || 'sbc_your_api_key_here'}"
  ],
]);
$response = curl_exec($curl);
$data = json_decode($response, true);`;
        }
        return `$curl = curl_init();
curl_setopt_array($curl, [
  CURLOPT_URL => "${url}",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => "PATCH",
  CURLOPT_HTTPHEADER => [
    "X-API-Key: ${apiKey || 'sbc_your_api_key_here'}",
    "Content-Type: application/json"
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "status" => "shipped",
    "oms_order_id" => "YOUR-OMS-123"
  ]),
]);
$response = curl_exec($curl);`;
    },

    python: (endpoint, apiKey) => {
        const url = `${BASE_URL}${endpoint.path.replace(':order_id', 'ORD-1713600000-123')}`;
        if (endpoint.method === 'GET') {
            return `import requests

response = requests.get(
  "${url}",
  headers={"X-API-Key": "${apiKey || 'sbc_your_api_key_here'}"}
)
data = response.json()
print(data["orders"])`;
        }
        return `import requests

response = requests.patch(
  "${url}",
  headers={
    "X-API-Key": "${apiKey || 'sbc_your_api_key_here'}",
    "Content-Type": "application/json"
  },
  json={
    "status": "shipped",
    "oms_order_id": "YOUR-OMS-123"
  }
)
data = response.json()`;
    },
};

export default function ApiDocs() {
    const [apiKey, setApiKey] = useState('');
    const [lang, setLang] = useState('curl');
    const [activeTab, setActiveTab] = useState({});
    const [copiedCode, setCopiedCode] = useState('');

    const copyCode = (code, id) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(''), 2000);
    };

    const codeStyle = {
        background: '#0d1117',
        color: '#e6edf3',
        borderRadius: 8,
        padding: '14px 16px',
        fontSize: 12,
        fontFamily: "'DM Mono', 'Fira Code', monospace",
        overflowX: 'auto',
        lineHeight: 1.6,
        whiteSpace: 'pre',
    };

    const langStyle = (l) => ({
        padding: '5px 12px', borderRadius: 6, fontSize: 12,
        cursor: 'pointer', border: 'none',
        fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
        background: lang === l ? 'var(--accent)' : 'var(--bg-tertiary)',
        color: lang === l ? '#fff' : 'var(--text-2)',
    });

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>

            {/* Header */}
            <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700 }}>
                        🔌 SoftBrainChat OMS API
                    </h1>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
                        আপনার OMS software কে SoftBrainChat এর সাথে connect করুন
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Link to="/orders" className="btn btn-outline btn-sm">← Orders</Link>
                    <Link to="/dashboard" className="btn btn-outline btn-sm">Dashboard</Link>
                </div>
            </div>

            <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 24px' }}>

                {/* API Key Input */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent)', borderRadius: 12, padding: 20, marginBottom: 32 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                        🔑 আপনার API Key দিন — নিচের examples এ automatically যোগ হবে
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            className="input"
                            style={{ flex: 1, fontFamily: "'DM Mono', monospace", fontSize: 12 }}
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            placeholder="sbc_your_api_key_here"
                        />
                        <Link to="/orders" className="btn btn-primary" style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                            API Key তৈরি করুন →
                        </Link>
                    </div>
                </div>

                {/* Base URL */}
                <div style={{ marginBottom: 28 }}>
                    <h2 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Base URL</h2>
                    <div style={{ ...codeStyle, display: 'inline-block', padding: '10px 16px' }}>
                        {BASE_URL}/api/v1
                    </div>
                </div>

                {/* Authentication */}
                <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Authentication</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.7 }}>
                        প্রতিটি request এ HTTP header এ API key পাঠাতে হবে।
                        API key SoftBrainChat Dashboard → Orders → OMS API Keys থেকে তৈরি করুন।
                    </p>
                    <div style={codeStyle}>
                        X-API-Key: {apiKey || 'sbc_your_api_key_here'}
                    </div>
                </div>

                {/* Language selector */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-2)', alignSelf: 'center', marginRight: 4 }}>Language:</span>
                    {['curl', 'javascript', 'php', 'python'].map(l => (
                        <button key={l} onClick={() => setLang(l)} style={langStyle(l)}>
                            {l === 'javascript' ? 'JavaScript' : l.charAt(0).toUpperCase() + l.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Endpoints */}
                <h2 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Endpoints</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {ENDPOINTS.map((ep, i) => {
                        const mc = METHOD_COLOR[ep.method] || METHOD_COLOR.GET;
                        const tab = activeTab[i] || 'response';
                        const code = CODE_EXAMPLES[lang]?.(ep, apiKey) || '';
                        const codeId = `${i}-${lang}`;
                        const respId = `${i}-resp`;

                        return (
                            <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>

                                {/* Endpoint header */}
                                <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ ...mc, padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>
                                        {ep.method}
                                    </span>
                                    <code style={{ fontSize: 14, color: 'var(--accent-2)', fontFamily: "'DM Mono', monospace", flex: 1 }}>
                                        {ep.path}
                                    </code>
                                    <span style={{ fontSize: 13, fontWeight: 600 }}>{ep.title}</span>
                                </div>

                                <div style={{ padding: '0 20px 20px' }}>
                                    <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14 }}>{ep.desc}</p>

                                    {/* Parameters */}
                                    {ep.params.length > 0 && (
                                        <div style={{ marginBottom: 14 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                                                {ep.method === 'GET' ? 'Query Parameters' : 'Request Body (JSON)'}
                                            </div>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                                <thead>
                                                    <tr style={{ background: 'var(--bg-tertiary)' }}>
                                                        {['Parameter', 'Type', 'Default', 'Description'].map(h => (
                                                            <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 600, fontSize: 11 }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {ep.params.map((p, j) => (
                                                        <tr key={j} style={{ borderBottom: '1px solid var(--border)' }}>
                                                            <td style={{ padding: '7px 10px' }}>
                                                                <code style={{ color: 'var(--accent-2)', fontFamily: "'DM Mono', monospace" }}>{p.name}</code>
                                                            </td>
                                                            <td style={{ padding: '7px 10px', color: 'var(--purple)' }}>{p.type}</td>
                                                            <td style={{ padding: '7px 10px', color: 'var(--text-3)' }}>{p.default}</td>
                                                            <td style={{ padding: '7px 10px', color: 'var(--text-2)' }}>{p.desc}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {/* Code tabs */}
                                    <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                                        {['code', 'response'].map(t => (
                                            <button key={t} onClick={() => setActiveTab(prev => ({ ...prev, [i]: t }))}
                                                style={{
                                                    padding: '4px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: 'none', fontFamily: "'DM Sans', sans-serif",
                                                    background: tab === t ? 'var(--accent-dim)' : 'var(--bg-tertiary)',
                                                    color: tab === t ? 'var(--accent-2)' : 'var(--text-2)'
                                                }}>
                                                {t === 'code' ? `${lang.charAt(0).toUpperCase() + lang.slice(1)} Example` : 'Response'}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Code block */}
                                    <div style={{ position: 'relative' }}>
                                        <button
                                            onClick={() => copyCode(tab === 'code' ? code : ep.response, tab === 'code' ? codeId : respId)}
                                            style={{ position: 'absolute', top: 8, right: 8, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-2)', borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer', zIndex: 1 }}>
                                            {copiedCode === (tab === 'code' ? codeId : respId) ? '✓ Copied!' : 'Copy'}
                                        </button>
                                        <div style={codeStyle}>
                                            {tab === 'code' ? code : ep.response}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Error codes */}
                <div style={{ marginTop: 32 }}>
                    <h2 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Error Codes</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, background: 'var(--bg-secondary)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-tertiary)' }}>
                                {['Status Code', 'Meaning', 'Solution'].map(h => (
                                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { code: '200', meaning: 'Success', solution: 'Request successful' },
                                { code: '401', meaning: 'Unauthorized', solution: 'X-API-Key header missing বা invalid' },
                                { code: '404', meaning: 'Not Found', solution: 'Order ID সঠিক নয়' },
                                { code: '400', meaning: 'Bad Request', solution: 'Invalid status value বা missing required field' },
                                { code: '429', meaning: 'Rate Limited', solution: 'অনেক বেশি request। কিছুক্ষণ পরে retry করুন।' },
                                { code: '500', meaning: 'Server Error', solution: 'Server error। support@softbrainchat.com এ জানান।' },
                            ].map((e, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '10px 14px' }}>
                                        <code style={{ color: e.code.startsWith('2') ? 'var(--green)' : e.code.startsWith('4') ? 'var(--orange)' : 'var(--red)', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
                                            {e.code}
                                        </code>
                                    </td>
                                    <td style={{ padding: '10px 14px', fontWeight: 500 }}>{e.meaning}</td>
                                    <td style={{ padding: '10px 14px', color: 'var(--text-2)' }}>{e.solution}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Rate limits */}
                <div style={{ marginTop: 24, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                    <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 10 }}>⚡ Rate Limits</h3>
                    <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.8 }}>
                        <div>• প্রতি API key: <strong>100 requests/minute</strong></div>
                        <div>• List orders: <strong>সর্বোচ্চ 100 orders per page</strong></div>
                        <div>• Bulk update: এখনো supported নয়</div>
                    </div>
                </div>

                {/* Support */}
                <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
                    API সংক্রান্ত সমস্যায় Dashboard থেকে support নিন অথবা{' '}
                    <a href="mailto:support@softbrainchat.com" style={{ color: 'var(--accent)' }}>
                        support@softbrainchat.com
                    </a>{' '}
                    এ যোগাযোগ করুন।
                </div>
            </div>
        </div>
    );
}