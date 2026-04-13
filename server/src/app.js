// require('dotenv').config();

// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const morgan = require('morgan');
// const connectDB = require('./config/db');

// connectDB();

// const app = express();

// // ── Security ────────────────────────────────────────────────
// app.use(helmet());
// app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// // ── CORS ────────────────────────────────────────────────────
// app.use(cors({
//     origin: process.env.CLIENT_URL || 'http://localhost:5173',
//     credentials: true,
// }));

// // ── Body Parsers ─────────────────────────────────────────────
// // Stripe webhook raw body আগে register করতে হবে
// app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true }));

// // ── Health ───────────────────────────────────────────────────
// app.get('/api/health', (_req, res) => {
//     res.json({ status: 'ok', service: 'SoftBrainChat API', time: new Date() });
// });

// // ── Routes ───────────────────────────────────────────────────
// app.use('/api/auth', require('./routes/auth.routes'));
// app.use('/api/chat', require('./routes/chat.routes'));
// app.use('/api/meta', require('./routes/meta.routes'));
// app.use('/api/knowledge', require('./routes/knowledge.routes'));
// app.use('/api/admin', require('./routes/admin.routes'));
// app.use('/api/billing', require('./routes/billing.routes'));
// app.use('/webhook', require('./routes/webhook.routes'));

// // ── 404 ──────────────────────────────────────────────────────
// app.use((req, res) => {
//     res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
// });

// // ── Global Error ─────────────────────────────────────────────
// app.use((err, _req, res, _next) => {
//     console.error('❌', err.message);
//     res.status(err.status || 500).json({
//         message: err.message || 'Server Error',
//         ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
//     });
// });

// module.exports = app;




require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { checkApiKeys } = require('./config/langchain');
const { globalLimit } = require('./middlewares/rateLimit.middleware');

// ── DB Connect ────────────────────────────────────────────────
connectDB();

// ── API Key check (startup warning) ──────────────────────────
checkApiKeys();

const app = express();

// ── Security ──────────────────────────────────────────────────
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));

// ── Global rate limit ─────────────────────────────────────────
app.use(globalLimit);

// ── Body Parsers ──────────────────────────────────────────────
// Stripe webhook — raw body দরকার (json parser এর আগে)
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'SoftBrainChat API',
        time: new Date(),
        env: process.env.NODE_ENV,
    });
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/meta', require('./routes/meta.routes'));
app.use('/api/knowledge', require('./routes/knowledge.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/billing', require('./routes/billing.routes'));
app.use('/webhook', require('./routes/webhook.routes'));

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('❌ Unhandled error:', err.message);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

module.exports = app;