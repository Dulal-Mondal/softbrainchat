const router = require('express').Router();
const knowledgeCtrl = require('../controllers/knowledge.controller');
const authMW = require('../middlewares/auth.middleware');
const { uploadLimit } = require('../middlewares/rateLimit.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Uploads folder
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
    fileFilter: (_req, file, cb) => {
        const allowed = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('শুধু PDF, DOCX, TXT file upload করা যাবে'));
        }
    },
});

router.use(authMW);

router.get('/', knowledgeCtrl.getAll);
router.post('/file', uploadLimit, upload.single('file'), knowledgeCtrl.uploadFile);
router.post('/url', knowledgeCtrl.addUrl);
router.delete('/:kbId', knowledgeCtrl.deleteItem);

module.exports = router;