// const router = require('express').Router();
// const knowledgeCtrl = require('../controllers/knowledge.controller');
// const authMW = require('../middlewares/auth.middleware');
// const { uploadLimit } = require('../middlewares/rateLimit.middleware');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Uploads folder
// const uploadDir = path.join(__dirname, '../../uploads');
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// const storage = multer.diskStorage({
//     destination: (_req, _file, cb) => cb(null, uploadDir),
//     filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
// });

// const upload = multer({
//     storage,
//     limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
//     fileFilter: (_req, file, cb) => {
//         const allowed = [
//             'application/pdf',
//             'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//             'text/plain',
//         ];
//         if (allowed.includes(file.mimetype)) {
//             cb(null, true);
//         } else {
//             cb(new Error('শুধু PDF, DOCX, TXT file upload করা যাবে'));
//         }
//     },
// });

// router.use(authMW);

// router.get('/', knowledgeCtrl.getAll);
// router.post('/file', uploadLimit, upload.single('file'), knowledgeCtrl.uploadFile);
// router.post('/url', knowledgeCtrl.addUrl);
// router.delete('/:kbId', knowledgeCtrl.deleteItem);

// module.exports = router;


const router = require('express').Router();
const knowledgeCtrl = require('../controllers/knowledge.controller');
const authMW = require('../middlewares/auth.middleware');
const { uploadLimit } = require('../middlewares/rateLimit.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        // Special characters সরাও filename থেকে
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${Date.now()}-${safe}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (_req, file, cb) => {
        const allowed = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
        ];

        // mimetype check + extension check দুইটাই করো
        const ext = path.extname(file.originalname).toLowerCase();
        const allowedExts = ['.pdf', '.docx', '.txt'];

        if (allowed.includes(file.mimetype) || allowedExts.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`শুধু PDF, DOCX, TXT upload করা যাবে। আপনি দিয়েছেন: ${ext}`));
        }
    },
});

// Multer error handle করার জন্য wrapper
const uploadMiddleware = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'File size সর্বোচ্চ 20MB হতে হবে' });
            }
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        }
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

router.use(authMW);

router.get('/', knowledgeCtrl.getAll);
router.post('/file', uploadLimit, uploadMiddleware, knowledgeCtrl.uploadFile);
router.post('/url', knowledgeCtrl.addUrl);
router.delete('/:kbId', knowledgeCtrl.deleteItem);

module.exports = router;