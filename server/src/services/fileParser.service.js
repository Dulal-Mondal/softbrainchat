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
const path = require('path');

const parseFile = async (filePath, mimeType) => {

    // ── PDF ───────────────────────────────────────────────────
    if (mimeType === 'application/pdf') {
        try {
            // pdf-parse কে lazy load করো — top level require এ bug আছে
            const pdfParse = require('pdf-parse/lib/pdf-parse.js');
            const buffer = fs.readFileSync(filePath);
            const data = await pdfParse(buffer);

            if (!data.text || data.text.trim().length === 0) {
                throw new Error('PDF থেকে text extract করা যায়নি। Scanned PDF হতে পারে।');
            }

            return data.text;
        } catch (err) {
            throw new Error(`PDF parse error: ${err.message}`);
        }
    }

    // ── DOCX ──────────────────────────────────────────────────
    if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        filePath.endsWith('.docx')
    ) {
        try {
            const mammoth = require('mammoth');
            const result = await mammoth.extractRawText({ path: filePath });

            if (!result.value || result.value.trim().length === 0) {
                throw new Error('DOCX থেকে text extract করা যায়নি।');
            }

            return result.value;
        } catch (err) {
            throw new Error(`DOCX parse error: ${err.message}`);
        }
    }

    // ── TXT ───────────────────────────────────────────────────
    if (mimeType === 'text/plain' || filePath.endsWith('.txt')) {
        const text = fs.readFileSync(filePath, 'utf-8');
        if (!text || text.trim().length === 0) {
            throw new Error('Text file empty।');
        }
        return text;
    }

    throw new Error(`Unsupported file type: ${mimeType}. শুধু PDF, DOCX, TXT supported।`);
};

module.exports = { parseFile };