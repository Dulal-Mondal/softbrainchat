// const pdfParse = require('pdf-parse');
// const mammoth = require('mammoth');
// const fs = require('fs');

// const parseFile = async (filePath, mimeType) => {
//     if (mimeType === 'application/pdf') {
//         const buffer = fs.readFileSync(filePath);
//         const data = await pdfParse(buffer);
//         return data.text;
//     }

//     if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
//         const result = await mammoth.extractRawText({ path: filePath });
//         return result.value;
//     }

//     if (mimeType === 'text/plain' || filePath.endsWith('.txt')) {
//         return fs.readFileSync(filePath, 'utf-8');
//     }

//     throw new Error(`Unsupported file type: ${mimeType}`);
// };

// module.exports = { parseFile };

const fs = require('fs');
const mammoth = require('mammoth');
const AdmZip = require('adm-zip');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── GPT-4o Vision দিয়ে image থেকে text পড়ো (OCR) ────────────
const ocrImage = async (base64, mimeType) => {
    try {
        const res = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 2000,
            messages: [
                {
                    role: 'system',
                    content: 'তুমি একটি OCR assistant। Image এ যা লেখা আছে তা হুবহু পড়ে text আকারে দাও। বাংলা ও English দুটোই পড়তে পারো। শুধু text দাও, কোনো ব্যাখ্যা না।',
                },
                {
                    role: 'user',
                    content: [
                        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' } },
                        { type: 'text', text: 'এই image এ যা লেখা আছে সব text পড়ে দাও।' },
                    ],
                },
            ],
        });
        return res.choices[0]?.message?.content?.trim() || '';
    } catch (err) {
        console.warn('OCR failed:', err.message);
        return '';
    }
};

// ── DOCX এর ভেতরের সব image বের করো ─────────────────────────
const extractImagesFromDocx = (filePath) => {
    const images = [];
    try {
        const zip = new AdmZip(filePath);
        zip.getEntries().forEach(entry => {
            // DOCX এ image গুলো word/media/ folder এ থাকে
            if (entry.entryName.startsWith('word/media/')) {
                const ext = entry.entryName.split('.').pop().toLowerCase();
                if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) {
                    const buffer = entry.getData();
                    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
                    images.push({ base64: buffer.toString('base64'), mimeType });
                }
            }
        });
    } catch (err) {
        console.warn('Image extraction failed:', err.message);
    }
    return images;
};

// ── DOCX parse — text + image OCR ───────────────────────────
const parseDocx = async (filePath) => {
    let text = '';

    // ১. সাধারণ text বের করো
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        text = (result.value || '').trim();
    } catch (err) {
        console.warn('Mammoth text extraction failed:', err.message);
    }

    // ২. text খুব কম হলে → image থেকে OCR করো
    if (text.length < 20) {
        const images = extractImagesFromDocx(filePath);
        if (images.length > 0) {
            console.log(`📄 DOCX এ ${images.length}টি image পাওয়া গেছে — OCR করছি...`);
            const ocrTexts = [];
            for (const img of images) {
                const ocrText = await ocrImage(img.base64, img.mimeType);
                if (ocrText) ocrTexts.push(ocrText);
            }
            const combined = ocrTexts.join('\n\n');
            text = text ? `${text}\n\n${combined}` : combined;
        }
    }

    if (!text || text.trim().length === 0) {
        throw new Error('DOCX থেকে কোনো text বা image text পাওয়া যায়নি।');
    }

    return text;
};

// ── PDF parse — text + scanned page OCR ─────────────────────
const parsePdf = async (filePath) => {
    let text = '';

    try {
        const pdfParse = require('pdf-parse/lib/pdf-parse.js');
        const buffer = fs.readFileSync(filePath);
        const data = await pdfParse(buffer);
        text = (data.text || '').trim();
    } catch (err) {
        console.warn('PDF text extraction failed:', err.message);
    }

    // Scanned PDF (text নেই) — page গুলো image হিসেবে OCR করা দরকার
    // এখানে শুধু text-based PDF support করছি
    if (!text || text.trim().length === 0) {
        throw new Error('PDF থেকে text পাওয়া যায়নি। এটি scanned/image PDF হলে আলাদা OCR দরকার।');
    }

    return text;
};

// ── TXT parse ────────────────────────────────────────────────
const parseTxt = async (filePath) => {
    const text = fs.readFileSync(filePath, 'utf-8');
    if (!text || text.trim().length === 0) {
        throw new Error('TXT file খালি।');
    }
    return text;
};

// ── সরাসরি image file (png/jpg) থেকে OCR ─────────────────────
const parseImage = async (filePath) => {
    const buffer = fs.readFileSync(filePath);
    const ext = filePath.split('.').pop().toLowerCase();
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    const text = await ocrImage(buffer.toString('base64'), mimeType);
    if (!text || text.trim().length === 0) {
        throw new Error('Image থেকে কোনো text পড়া যায়নি।');
    }
    return text;
};

// ── Main: file type অনুযায়ী parse করো ──────────────────────
const parseFile = async (filePath, mimeType = '') => {
    const ext = filePath.split('.').pop().toLowerCase();

    if (ext === 'docx' || mimeType.includes('wordprocessingml')) {
        return parseDocx(filePath);
    }
    if (ext === 'pdf' || mimeType.includes('pdf')) {
        return parsePdf(filePath);
    }
    if (ext === 'txt' || mimeType.includes('text/plain')) {
        return parseTxt(filePath);
    }
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext) || mimeType.includes('image')) {
        return parseImage(filePath);
    }

    throw new Error(`Unsupported file type: ${ext}`);
};

module.exports = { parseFile, parseDocx, parsePdf, parseTxt, parseImage };

// ── পুরোনো নামের সাথে compatibility (alias) ─────────────────
module.exports.extractText = parseFile;
module.exports.extractFromFile = parseFile;
module.exports.parse = parseFile;