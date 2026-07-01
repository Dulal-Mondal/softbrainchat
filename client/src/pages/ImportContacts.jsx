// import { useState, useEffect } from 'react';
// import api from '../services/api';
// import toast from 'react-hot-toast';
// import { Link } from 'react-router-dom';
// import * as XLSX from 'xlsx';

// export default function ImportContacts() {
//     const [channels, setChannels] = useState([]);
//     const [channelId, setChannelId] = useState('');
//     const [rows, setRows] = useState([]);          // parsed preview
//     const [columns, setColumns] = useState([]);    // detected columns
//     const [mapping, setMapping] = useState({ name: '', phone: '', tags: '' });
//     const [importing, setImporting] = useState(false);
//     const [result, setResult] = useState(null);
//     const [fileName, setFileName] = useState('');

//     useEffect(() => {
//         api.get('/meta/channels')
//             .then(res => setChannels(res.channels || res.data?.channels || []))
//             .catch(() => { });
//     }, []);

//     // ── File upload + parse ──
//     const handleFile = (e) => {
//         const file = e.target.files[0];
//         if (!file) return;
//         setFileName(file.name);
//         setResult(null);

//         const reader = new FileReader();
//         reader.onload = (evt) => {
//             try {
//                 const wb = XLSX.read(evt.target.result, { type: 'binary' });
//                 const sheet = wb.Sheets[wb.SheetNames[0]];
//                 const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

//                 if (data.length === 0) { toast.error('File খালি'); return; }

//                 const cols = Object.keys(data[0]);
//                 setColumns(cols);
//                 setRows(data);

//                 // Auto-detect column mapping
//                 const auto = { name: '', phone: '', tags: '' };
//                 for (const c of cols) {
//                     const lc = c.toLowerCase();
//                     if (!auto.name && (lc.includes('name') || lc.includes('নাম'))) auto.name = c;
//                     if (!auto.phone && (lc.includes('phone') || lc.includes('number') || lc.includes('mobile') || lc.includes('whatsapp') || lc.includes('নম্বর') || lc.includes('ফোন'))) auto.phone = c;
//                     if (!auto.tags && (lc.includes('tag') || lc.includes('group') || lc.includes('category'))) auto.tags = c;
//                 }
//                 // phone না পেলে — প্রথম column যেটায় সংখ্যা আছে
//                 if (!auto.phone) {
//                     for (const c of cols) {
//                         if (/\d{6,}/.test(String(data[0][c]))) { auto.phone = c; break; }
//                     }
//                 }
//                 setMapping(auto);
//                 toast.success(`${data.length}টি row পাওয়া গেছে`);
//             } catch (err) {
//                 toast.error('File parse করা যায়নি: ' + err.message);
//             }
//         };
//         reader.readAsBinaryString(file);
//     };

//     // ── Import ──
//     const doImport = async () => {
//         if (!channelId) { toast.error('Channel select করুন'); return; }
//         if (!mapping.phone) { toast.error('Phone column select করুন'); return; }

//         const contacts = rows.map(r => ({
//             name: mapping.name ? r[mapping.name] : '',
//             phone: r[mapping.phone],
//             tags: mapping.tags ? r[mapping.tags] : '',
//         })).filter(c => c.phone);

//         if (contacts.length === 0) { toast.error('কোনো valid contact নেই'); return; }

//         setImporting(true);
//         try {
//             const res = await api.post('/contacts/import', { channelId, contacts });
//             const data = res.success ? res : res.data;
//             setResult(data);
//             toast.success(`✅ ${data.imported} নতুন, ${data.updated} update`);
//         } catch (err) {
//             toast.error(err.response?.data?.message || err.message);
//         } finally { setImporting(false); }
//     };

//     const input = {
//         width: '100%', padding: '9px 12px', borderRadius: 8,
//         border: '1px solid var(--border-2)', background: 'var(--bg-tertiary)',
//         color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: "'DM Sans',sans-serif",
//     };
//     const label = { display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 6, fontWeight: 500 };

//     return (
//         <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 32 }}>
//             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
//                 <div>
//                     <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700 }}>📥 Import Contacts</h1>
//                     <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>CSV বা Excel থেকে customer number import করুন</p>
//                 </div>
//                 <div style={{ display: 'flex', gap: 10 }}>
//                     <Link to="/broadcast" className="btn btn-outline btn-sm">📢 Broadcast</Link>
//                     <Link to="/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
//                 </div>
//             </div>

//             <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 20 }}>

//                 {/* Step 1: Channel + File */}
//                 <div className="card">
//                     <h2 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 14 }}>১. File আপলোড করুন</h2>

//                     <div style={{ marginBottom: 14 }}>
//                         <label style={label}>কোন Channel এ যোগ হবে</label>
//                         <select style={input} value={channelId} onChange={e => setChannelId(e.target.value)}>
//                             <option value="">— Channel select করুন —</option>
//                             {channels.map(c => <option key={c._id} value={c._id}>{c.name} ({c.platform})</option>)}
//                         </select>
//                     </div>

//                     <label style={{
//                         display: 'block', padding: 24, border: '2px dashed var(--border-2)', borderRadius: 10,
//                         textAlign: 'center', cursor: 'pointer', background: 'var(--bg-tertiary)',
//                     }}>
//                         <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} style={{ display: 'none' }} />
//                         <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
//                         <div style={{ fontSize: 14, fontWeight: 500 }}>{fileName || 'CSV বা Excel file বেছে নিন'}</div>
//                         <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>.csv, .xlsx, .xls সমর্থিত</div>
//                     </label>

//                     <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>
//                         💡 File এ অন্তত একটা column এ phone number থাকতে হবে।
//                         বাংলাদেশের number (01XXXXXXXXX) automatic 880 format এ রূপান্তর হবে।
//                     </div>
//                 </div>

//                 {/* Step 2: Column mapping */}
//                 {columns.length > 0 && (
//                     <div className="card">
//                         <h2 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
//                             ২. Column মেলান ({rows.length} row)
//                         </h2>
//                         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
//                             <div>
//                                 <label style={label}>📞 Phone (আবশ্যক)</label>
//                                 <select style={input} value={mapping.phone} onChange={e => setMapping({ ...mapping, phone: e.target.value })}>
//                                     <option value="">— select —</option>
//                                     {columns.map(c => <option key={c} value={c}>{c}</option>)}
//                                 </select>
//                             </div>
//                             <div>
//                                 <label style={label}>👤 Name</label>
//                                 <select style={input} value={mapping.name} onChange={e => setMapping({ ...mapping, name: e.target.value })}>
//                                     <option value="">— ঐচ্ছিক —</option>
//                                     {columns.map(c => <option key={c} value={c}>{c}</option>)}
//                                 </select>
//                             </div>
//                             <div>
//                                 <label style={label}>🏷️ Tags</label>
//                                 <select style={input} value={mapping.tags} onChange={e => setMapping({ ...mapping, tags: e.target.value })}>
//                                     <option value="">— ঐচ্ছিক —</option>
//                                     {columns.map(c => <option key={c} value={c}>{c}</option>)}
//                                 </select>
//                             </div>
//                         </div>

//                         {/* Preview প্রথম ৩ row */}
//                         <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
//                             <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>Preview (প্রথম ৩টি):</div>
//                             {rows.slice(0, 3).map((r, i) => (
//                                 <div key={i} style={{ fontSize: 12, color: 'var(--text-2)', padding: '3px 0' }}>
//                                     📞 {mapping.phone ? r[mapping.phone] : '—'}
//                                     {mapping.name && ` · 👤 ${r[mapping.name]}`}
//                                     {mapping.tags && r[mapping.tags] && ` · 🏷️ ${r[mapping.tags]}`}
//                                 </div>
//                             ))}
//                         </div>

//                         <button onClick={doImport} disabled={importing || !mapping.phone} className="btn btn-primary" style={{ width: '100%', padding: 12 }}>
//                             {importing ? 'Import হচ্ছে...' : `📥 ${rows.length}টি Contact Import করুন`}
//                         </button>
//                     </div>
//                 )}

//                 {/* Step 3: Result */}
//                 {result && (
//                     <div className="card">
//                         <h2 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 14 }}>✅ Import সম্পন্ন</h2>
//                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
//                             <div style={{ textAlign: 'center', padding: 14, background: 'var(--green-dim)', borderRadius: 8 }}>
//                                 <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)', fontFamily: 'Syne' }}>{result.imported}</div>
//                                 <div style={{ fontSize: 11, color: 'var(--text-2)' }}>নতুন</div>
//                             </div>
//                             <div style={{ textAlign: 'center', padding: 14, background: 'var(--accent-dim)', borderRadius: 8 }}>
//                                 <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-2)', fontFamily: 'Syne' }}>{result.updated}</div>
//                                 <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Update</div>
//                             </div>
//                             <div style={{ textAlign: 'center', padding: 14, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
//                                 <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-3)', fontFamily: 'Syne' }}>{result.skipped}</div>
//                                 <div style={{ fontSize: 11, color: 'var(--text-2)' }}>বাদ</div>
//                             </div>
//                         </div>

//                         {result.errors?.length > 0 && (
//                             <div style={{ fontSize: 11, color: 'var(--orange)', marginBottom: 12 }}>
//                                 ⚠️ {result.skipped}টি number বাদ পড়েছে (ভুল format)
//                             </div>
//                         )}

//                         <Link to="/broadcast" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', textDecoration: 'none', display: 'block', padding: 12 }}>
//                             📢 এখন Broadcast পাঠান →
//                         </Link>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }





















import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

export default function ImportContacts() {
    const [channels, setChannels] = useState([]);
    const [channelId, setChannelId] = useState('');
    const [groupName, setGroupName] = useState('');       // ← নতুন: group/tag নাম
    const [existingTags, setExistingTags] = useState([]); // আগের group গুলো
    const [rows, setRows] = useState([]);
    const [columns, setColumns] = useState([]);
    const [mapping, setMapping] = useState({ name: '', phone: '', tags: '' });
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);
    const [fileName, setFileName] = useState('');

    useEffect(() => {
        api.get('/meta/channels')
            .then(res => setChannels(res.channels || res.data?.channels || []))
            .catch(() => { });
        api.get('/contacts/meta/tags')
            .then(res => setExistingTags(res.tags || res.data?.tags || []))
            .catch(() => { });
    }, []);

    // ── File upload + parse ──
    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFileName(file.name);
        setResult(null);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'binary' });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

                if (data.length === 0) { toast.error('File খালি'); return; }

                const cols = Object.keys(data[0]);
                setColumns(cols);
                setRows(data);

                const auto = { name: '', phone: '', tags: '' };
                for (const c of cols) {
                    const lc = c.toLowerCase();
                    if (!auto.name && (lc.includes('name') || lc.includes('নাম'))) auto.name = c;
                    if (!auto.phone && (lc.includes('phone') || lc.includes('number') || lc.includes('mobile') || lc.includes('whatsapp') || lc.includes('নম্বর') || lc.includes('ফোন'))) auto.phone = c;
                    if (!auto.tags && (lc.includes('tag') || lc.includes('group') || lc.includes('category'))) auto.tags = c;
                }
                if (!auto.phone) {
                    for (const c of cols) {
                        if (/\d{6,}/.test(String(data[0][c]))) { auto.phone = c; break; }
                    }
                }
                setMapping(auto);
                toast.success(`${data.length}টি row পাওয়া গেছে`);
            } catch (err) {
                toast.error('File parse করা যায়নি: ' + err.message);
            }
        };
        reader.readAsBinaryString(file);
    };

    // ── Import ──
    const doImport = async () => {
        if (!channelId) { toast.error('Channel select করুন'); return; }
        if (!mapping.phone) { toast.error('Phone column select করুন'); return; }

        const group = groupName.trim();

        const contacts = rows.map(r => {
            // file এর tag + group নাম দুটোই মিলিয়ে দাও
            const fileTags = mapping.tags ? String(r[mapping.tags] || '').split(',').map(t => t.trim()).filter(Boolean) : [];
            const allTags = group ? [group, ...fileTags] : fileTags;
            return {
                name: mapping.name ? r[mapping.name] : '',
                phone: r[mapping.phone],
                tags: allTags,
            };
        }).filter(c => c.phone);

        if (contacts.length === 0) { toast.error('কোনো valid contact নেই'); return; }

        setImporting(true);
        try {
            const res = await api.post('/contacts/import', { channelId, contacts });
            const data = res.success ? res : res.data;
            setResult({ ...data, group });
            toast.success(`✅ ${data.imported} নতুন, ${data.updated} update`);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally { setImporting(false); }
    };

    const input = {
        width: '100%', padding: '9px 12px', borderRadius: 8,
        border: '1px solid var(--border-2)', background: 'var(--bg-tertiary)',
        color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: "'DM Sans',sans-serif",
    };
    const label = { display: 'block', fontSize: 12, color: 'var(--text-2)', marginBottom: 6, fontWeight: 500 };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 700 }}>📥 Import Contacts</h1>
                    <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>CSV বা Excel থেকে number import করে group তৈরি করুন</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <Link to="/broadcast" className="btn btn-outline btn-sm">📢 Broadcast</Link>
                    <Link to="/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
                </div>
            </div>

            <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Step 1: Channel + Group + File */}
                <div className="card">
                    <h2 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 14 }}>১. File আপলোড করুন</h2>

                    <div style={{ marginBottom: 14 }}>
                        <label style={label}>কোন Channel এ যোগ হবে</label>
                        <select style={input} value={channelId} onChange={e => setChannelId(e.target.value)}>
                            <option value="">— Channel select করুন —</option>
                            {channels.map(c => <option key={c._id} value={c._id}>{c.name} ({c.platform})</option>)}
                        </select>
                    </div>

                    {/* Group name — নতুন */}
                    <div style={{ marginBottom: 14 }}>
                        <label style={label}>🏷️ Group নাম (এই import এর সব contact এই group এ যাবে)</label>
                        <input style={input} value={groupName} onChange={e => setGroupName(e.target.value)}
                            placeholder="যেমন: ঈদ কাস্টমার, পুরাতন গ্রাহক, VIP" list="existing-groups" />
                        <datalist id="existing-groups">
                            {existingTags.map(t => <option key={t} value={t} />)}
                        </datalist>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.5 }}>
                            💡 এই group ধরে পরে broadcast করতে পারবেন। খালি রাখলে group ছাড়া import হবে।
                            {existingTags.length > 0 && ' আগের group: ' + existingTags.join(', ')}
                        </div>
                    </div>

                    <label style={{
                        display: 'block', padding: 24, border: '2px dashed var(--border-2)', borderRadius: 10,
                        textAlign: 'center', cursor: 'pointer', background: 'var(--bg-tertiary)',
                    }}>
                        <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} style={{ display: 'none' }} />
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{fileName || 'CSV বা Excel file বেছে নিন'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>.csv, .xlsx, .xls সমর্থিত</div>
                    </label>

                    <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6 }}>
                        💡 File এ অন্তত একটা column এ phone number থাকতে হবে।
                        বাংলাদেশের number (01XXXXXXXXX) automatic 880 format এ রূপান্তর হবে।
                    </div>
                </div>

                {/* Step 2: Column mapping */}
                {columns.length > 0 && (
                    <div className="card">
                        <h2 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 14 }}>
                            ২. Column মেলান ({rows.length} row)
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                            <div>
                                <label style={label}>📞 Phone (আবশ্যক)</label>
                                <select style={input} value={mapping.phone} onChange={e => setMapping({ ...mapping, phone: e.target.value })}>
                                    <option value="">— select —</option>
                                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={label}>👤 Name</label>
                                <select style={input} value={mapping.name} onChange={e => setMapping({ ...mapping, name: e.target.value })}>
                                    <option value="">— ঐচ্ছিক —</option>
                                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={label}>🏷️ File এর Tag</label>
                                <select style={input} value={mapping.tags} onChange={e => setMapping({ ...mapping, tags: e.target.value })}>
                                    <option value="">— ঐচ্ছিক —</option>
                                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Group preview */}
                        {groupName.trim() && (
                            <div style={{ marginBottom: 12, padding: 10, background: 'var(--accent-dim)', borderRadius: 8, fontSize: 12, color: 'var(--accent-2)' }}>
                                🏷️ এই {rows.length}টি contact <strong>"{groupName.trim()}"</strong> group এ যোগ হবে
                            </div>
                        )}

                        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>Preview (প্রথম ৩টি):</div>
                            {rows.slice(0, 3).map((r, i) => (
                                <div key={i} style={{ fontSize: 12, color: 'var(--text-2)', padding: '3px 0' }}>
                                    📞 {mapping.phone ? r[mapping.phone] : '—'}
                                    {mapping.name && ` · 👤 ${r[mapping.name]}`}
                                    {groupName.trim() && ` · 🏷️ ${groupName.trim()}`}
                                </div>
                            ))}
                        </div>

                        <button onClick={doImport} disabled={importing || !mapping.phone} className="btn btn-primary" style={{ width: '100%', padding: 12 }}>
                            {importing ? 'Import হচ্ছে...' : `📥 ${rows.length}টি Contact Import করুন`}
                        </button>
                    </div>
                )}

                {/* Step 3: Result */}
                {result && (
                    <div className="card">
                        <h2 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 600, marginBottom: 14 }}>✅ Import সম্পন্ন</h2>
                        {result.group && (
                            <div style={{ marginBottom: 14, padding: 10, background: 'var(--green-dim)', borderRadius: 8, fontSize: 12, color: 'var(--green)' }}>
                                🏷️ "{result.group}" group তৈরি হয়েছে — Broadcast এ এই group select করতে পারবেন
                            </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                            <div style={{ textAlign: 'center', padding: 14, background: 'var(--green-dim)', borderRadius: 8 }}>
                                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)', fontFamily: 'Syne' }}>{result.imported}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>নতুন</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 14, background: 'var(--accent-dim)', borderRadius: 8 }}>
                                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-2)', fontFamily: 'Syne' }}>{result.updated}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Update</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 14, background: 'var(--bg-tertiary)', borderRadius: 8 }}>
                                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-3)', fontFamily: 'Syne' }}>{result.skipped}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>বাদ</div>
                            </div>
                        </div>

                        {result.errors?.length > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--orange)', marginBottom: 12 }}>
                                ⚠️ {result.skipped}টি number বাদ পড়েছে (ভুল format)
                            </div>
                        )}

                        <Link to="/broadcast" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', textDecoration: 'none', display: 'block', padding: 12 }}>
                            Send Now for Broadcast →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}