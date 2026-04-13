# SoftBrainChat

AI Chat + Meta Auto-Reply SaaS — MERN Stack

---

## Stack

| Layer    | Technology                                  |
|----------|---------------------------------------------|
| Frontend | React 18, Vite, TailwindCSS, Zustand        |
| Backend  | Node.js, Express, Mongoose                  |
| Database | MongoDB Atlas                               |
| Auth     | Firebase Authentication                     |
| AI/RAG   | LangChain, OpenAI, Pinecone                 |
| Payment  | Stripe                                      |
| Meta     | WhatsApp Business API, Messenger, Instagram |

---

## Folder Structure

```
softbrainchat/
├── client/               # React frontend (Vite)
│   ├── src/
│   │   ├── pages/        # Landing, Login, Register, Chat, Meta, Settings, Admin, Billing
│   │   ├── components/   # layout/, chat/, meta/, admin/, ui/
│   │   ├── context/      # AuthContext, ThemeContext, PlanContext
│   │   ├── hooks/        # useChat
│   │   ├── services/     # api, chatService, metaService, adminService, billingService
│   │   └── firebase/     # config, auth helpers
│   └── Dockerfile
├── server/               # Express backend
│   ├── src/
│   │   ├── models/       # User, Chat, KnowledgeBase, MetaChannel, MetaMessage, Subscription
│   │   ├── controllers/  # auth, chat, knowledge, meta, admin, billing
│   │   ├── routes/       # all API routes
│   │   ├── middlewares/  # auth, admin, plan, rateLimit
│   │   ├── services/     # langchain, vectorStore, metaApi, fileParser, urlScraper
│   │   └── config/       # db, firebase, langchain, stripe
│   └── Dockerfile
├── docker-compose.yml
├── render.yaml
└── README.md
```

---

## Quick Start

### 1. Clone করো

```bash
git clone https://github.com/yourname/softbrainchat.git
cd softbrainchat
```

### 2. Dependencies install করো

```bash
npm run install:all
```

### 3. Environment variables সেট করো

**Server** — `server/.env` ফাইলে:

```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/softbrainchat
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXX\n-----END PRIVATE KEY-----\n"

OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX=softbrainchat

META_APP_ID=...
META_APP_SECRET=...
META_WEBHOOK_VERIFY_TOKEN=softbrainchat_verify_123

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_PROMAX_PRICE_ID=price_...
```

**Client** — `client/.env` ফাইলে:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 4. Development mode চালাও

```bash
npm run dev
```

Server: http://localhost:5000  
Client: http://localhost:5173

---

## Third-party Setup

### Firebase

1. [Firebase Console](https://console.firebase.google.com) → New Project
2. Authentication → Enable Email/Password + Google
3. Project Settings → Service Accounts → Generate Private Key → `.env` এ রাখো
4. Project Settings → General → Web App → SDK config → `client/.env` এ রাখো

### MongoDB Atlas

1. [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → Free Cluster
2. Database Access → Add user (username + password)
3. Network Access → Add IP → 0.0.0.0/0 (সব IP allow)
4. Connect → Compass/Driver → Connection string → `MONGO_URI` এ রাখো

### Pinecone (Vector Store)

1. [app.pinecone.io](https://app.pinecone.io) → Create Account
2. Create Index → Name: `softbrainchat`, Dimensions: `1536`, Metric: `cosine`
3. API Keys → `PINECONE_API_KEY` এ রাখো

### Stripe

1. [dashboard.stripe.com](https://dashboard.stripe.com) → Test mode
2. Products → Create 2 products: Pro ($29/month), Pro Max ($79/month)
3. API Keys → `STRIPE_SECRET_KEY`
4. Webhooks → Add endpoint: `https://yourdomain.com/api/billing/webhook`
5. Events to listen: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
6. Webhook signing secret → `STRIPE_WEBHOOK_SECRET`

### Meta (WhatsApp / Messenger / Instagram)

1. [developers.facebook.com](https://developers.facebook.com) → Create App → Business
2. Add Products: WhatsApp, Messenger, Instagram
3. WhatsApp → Getting Started → Phone Number ID, WABA ID
4. Webhooks → Configure → URL: `https://yourdomain.com/webhook/meta/:channelId`
5. Subscribe to: `messages`, `messaging_postbacks`

---

## Deployment

### Option A — Docker Compose (VPS)

```bash
# .env তৈরি করো root এ
cp .env.example .env
# values fill করো

# Build + run
docker-compose up -d --build

# Logs দেখো
docker-compose logs -f server
```

### Option B — Render (Server) + Vercel (Client)

**Server → Render.com**

1. render.com → New → Web Service → GitHub repo connect
2. Root Directory: `server`
3. Build Command: `npm install`
4. Start Command: `node src/server.js`
5. Environment Variables: সব `.env` values add করো
6. Deploy

**Client → Vercel**

1. vercel.com → New Project → GitHub repo connect
2. Root Directory: `client`
3. Framework: Vite
4. Environment Variables: `VITE_FIREBASE_*` values add করো
5. Deploy

---

## Admin User তৈরি করো

প্রথম user register করার পরে MongoDB এ manually role update করো:

```js
// MongoDB Shell বা Compass এ run করো
db.users.updateOne(
  { email: 'admin@yourdomain.com' },
  { $set: { role: 'admin' } }
)
```

এরপর `/admin` route এ যাও।

---

## Plans

| Feature               | Free   | Pro    | Pro Max  |
|-----------------------|--------|--------|----------|
| Messages/month        | 100    | 5,000  | Unlimited|
| Knowledge Files       | 1      | 20     | Unlimited|
| Knowledge URLs        | 0      | 10     | Unlimited|
| Meta Auto-Reply       | ✗      | ✓      | ✓        |
| Meta Channels         | 0      | 3      | Unlimited|
| Custom LLM Keys       | ✗      | ✓      | ✓        |
| Chat Flows            | ✗      | 5      | Unlimited|
| Admin Plan Override   | —      | —      | —        |

---

## API Endpoints

```
POST   /api/auth/me                           — Current user profile
PATCH  /api/auth/profile                      — Update name/photo
PATCH  /api/auth/preferences                  — Theme, default model
POST   /api/auth/llm-provider                 — Add custom LLM
DELETE /api/auth/llm-provider/:id             — Remove custom LLM

POST   /api/chat/send                         — Send message (RAG)
GET    /api/chat/history                      — Chat list
GET    /api/chat/:chatId                      — Single chat
DELETE /api/chat/:chatId                      — Delete chat
PATCH  /api/chat/:chatId/message/:msgId/correct — Human correction

GET    /api/knowledge                         — List KB items
POST   /api/knowledge/file                    — Upload file
POST   /api/knowledge/url                     — Add URL
DELETE /api/knowledge/:kbId                   — Delete item

GET    /api/meta/channels                     — List channels  [Pro]
POST   /api/meta/channels                     — Add channel    [Pro]
PATCH  /api/meta/channels/:id                 — Update channel [Pro]
DELETE /api/meta/channels/:id                 — Delete channel [Pro]
GET    /api/meta/messages                     — Message queue  [Pro]
PATCH  /api/meta/messages/:id/reply           — Human reply    [Pro]

POST   /api/billing/checkout                  — Stripe checkout
POST   /api/billing/portal                    — Stripe portal
GET    /api/billing/status                    — Current subscription
POST   /api/billing/webhook                   — Stripe webhook

GET    /api/admin/stats                       — Platform stats      [Admin]
GET    /api/admin/users                       — All users           [Admin]
GET    /api/admin/users/:id                   — Single user         [Admin]
PATCH  /api/admin/users/:id/plan-override     — Grant plan          [Admin]
PATCH  /api/admin/users/:id/plan-override/remove — Remove override  [Admin]
PATCH  /api/admin/users/:id/role              — Change role         [Admin]
DELETE /api/admin/users/:id                   — Delete user         [Admin]

GET    /webhook/meta/:channelId               — Meta webhook verify
POST   /webhook/meta/:channelId               — Meta incoming message
```

---

## License

MIT