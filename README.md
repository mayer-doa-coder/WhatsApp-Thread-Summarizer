# WhatsApp Thread Summarizer

> AI-powered productivity tool that turns WhatsApp `.txt` exports into structured summaries, reply drafts, and a daily brief — with PDF export and full history tracking.

**Live Demo:** _Deploy-pending (see Steps 7.12–7.14)_

---

## What It Does

| Feature | Description |
|---|---|
| **Thread Summarizer** | Upload a `.txt` WhatsApp export and get topic, key decisions, action items, and a prose summary |
| **Reply Drafter** | Generate 3 contextual reply options (Formal / Casual / Concise) from the last few messages |
| **Daily Brief** | Upload up to 10 chats at once and get one aggregated report with cross-chat insights |
| **PDF Export** | Download your Daily Brief as a formatted, print-ready PDF |
| **History** | Save, browse, and delete summaries — protected by JWT authentication |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Tailwind CSS |
| Backend | Node.js 20 + Express 5 |
| AI Engine | SambaNova (Llama-4-Maverick) → Cerebras → Google Gemini 2.5 Flash (three-tier fallback) |
| Database | PostgreSQL via Supabase (service-role key, custom auth) |
| Auth | JWT (30-min access) + bcrypt password hashing |
| PDF Export | Puppeteer (headless Chromium) |
| Testing | Jest + Supertest (unit/integration) + Playwright (E2E) |

---

## Project Structure

```
WhatsApp-Thread-Summarizer/
├── backend/
│   ├── src/
│   │   ├── app.js                  # Express app — routes + middleware
│   │   ├── server.js               # HTTP entry point (port 4000)
│   │   ├── config/
│   │   │   ├── llm.js              # Three-tier LLM client with retry
│   │   │   └── supabase.js         # Supabase client (service role)
│   │   ├── middleware/
│   │   │   ├── authenticate.js     # JWT verification middleware
│   │   │   └── errorHandler.js     # Global error handler
│   │   ├── models/
│   │   │   ├── user.js             # User CRUD (Supabase)
│   │   │   └── summary.js          # Summary CRUD with ownership check
│   │   ├── parser/
│   │   │   ├── whatsappParser.js   # Regex parser for WhatsApp exports
│   │   │   └── chunkMessages.js    # Token-aware message chunker
│   │   ├── routes/
│   │   │   ├── uploadRoutes.js     # POST /api/upload
│   │   │   ├── summarizeRoutes.js  # POST /api/summarize
│   │   │   ├── replyRoutes.js      # POST /api/reply
│   │   │   ├── briefRoutes.js      # POST /api/brief
│   │   │   ├── authRoutes.js       # POST /api/auth/register|login
│   │   │   ├── historyRoutes.js    # GET|POST|DELETE /api/history
│   │   │   └── exportRoutes.js     # POST /api/export/pdf
│   │   ├── services/
│   │   │   ├── summarizer.js       # LLM summarization service
│   │   │   ├── replyDrafter.js     # LLM reply-drafting service
│   │   │   └── briefComposer.js    # Multi-file brief composition
│   │   └── export/
│   │       └── pdfExporter.js      # Puppeteer PDF renderer
│   ├── tests/                      # Jest unit + integration tests
│   ├── db/schema.sql               # Supabase schema (run once)
│   └── .env.example                # Environment variable template
├── frontend/
│   └── src/
│       ├── App.tsx                 # Router + providers
│       ├── context/
│       │   ├── AuthContext.tsx     # JWT state + login/logout helpers
│       │   └── ToastContext.tsx    # Toast notification system
│       ├── pages/
│       │   ├── UploadPage.tsx      # File upload + summary trigger
│       │   ├── SummaryPage.tsx     # Summary display + reply drafter
│       │   ├── DailyBriefPage.tsx  # Multi-chat brief + PDF download
│       │   ├── HistoryPage.tsx     # Saved summary list + delete
│       │   ├── LoginPage.tsx       # Login form
│       │   └── RegisterPage.tsx    # Registration form
│       ├── components/             # SummaryCard, UploadZone, etc.
│       ├── hooks/                  # useSummarize, useReplyDrafter, etc.
│       └── services/api.ts         # Typed Axios client
├── e2e/                            # Playwright end-to-end tests
├── docs/                           # API schema, wireframes, user guide
├── execution_plan.md               # Phase-by-phase build checklist
└── WhatsApp_Summarizer_Project_Plan.md  # Full project specification
```

---

## Local Development

### Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 20 |
| npm | 10 |
| Git | any recent |

You also need accounts at:
- [Supabase](https://supabase.com) — free tier, for the database
- At least one LLM provider — [SambaNova](https://cloud.sambanova.ai) (recommended, free tier)

### 1. Clone the repository

```bash
git clone https://github.com/mayer-doa-coder/WhatsApp-Thread-Summarizer.git
cd WhatsApp-Thread-Summarizer
```

### 2. Set up the database

1. Create a new Supabase project
2. In the Supabase dashboard go to **SQL Editor → New query**
3. Paste the contents of `backend/db/schema.sql` and click **Run**
4. In **Settings → API** copy your **Project URL** and **service_role** key

> **Important:** Disable email confirmation in **Authentication → Settings → Email** so E2E tests can register without inbox access.

### 3. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=4000
NODE_ENV=development

# LLM — at least one key required; backend tries in order shown
SAMBANOVA_API_KEY=your_key_here      # https://cloud.sambanova.ai
CEREBRAS_API_KEY=your_key_here       # https://cloud.cerebras.ai
GOOGLE_API_KEY=your_key_here         # https://aistudio.google.com/app/apikey

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

JWT_SECRET=a-long-random-string-at-least-32-chars
```

### 4. Start the backend

```bash
cd backend
npm install
node src/server.js
```

Verify:

```bash
curl http://localhost:4000/api/health
# → {"status":"ok"}
```

### 5. Configure and start the frontend

Open a second terminal:

```bash
cd frontend
cp .env.example .env
# REACT_APP_API_URL=http://localhost:4000   (already correct for local dev)

npm install
npm start
```

The app opens at **http://localhost:3000**.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port (default `4000`) |
| `NODE_ENV` | No | `development` or `production` |
| `SAMBANOVA_API_KEY` | One LLM key required | Primary LLM — Llama-4-Maverick-17B |
| `CEREBRAS_API_KEY` | One LLM key required | Fallback LLM — Llama 3.1 8B (fastest) |
| `GOOGLE_API_KEY` | One LLM key required | Fallback LLM — Gemini 2.5 Flash |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service-role key (bypasses RLS) |
| `JWT_SECRET` | Yes | Secret for signing JWT access tokens — min 32 chars |
| `CORS_ORIGIN` | No | Allowed CORS origin (default `http://localhost:3000`) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `REACT_APP_API_URL` | Yes | Backend base URL (e.g. `http://localhost:4000`) |

---

## Running Tests

### Backend unit + integration tests

```bash
cd backend
npm test                        # all tests
npm run test:coverage           # with coverage report
```

### End-to-end tests (Playwright)

```bash
# Start both servers first, then in a third terminal:
cd e2e
npx playwright test             # all specs (headless)
npx playwright test --ui        # interactive mode

# Auth-required specs need credentials:
TEST_EMAIL=you@example.com TEST_PASSWORD=YourPassword123! npx playwright test auth-and-history.spec.ts
```

---

## Available Scripts

### Backend

| Command | Description |
|---|---|
| `node src/server.js` | Start API server |
| `npm test` | Run Jest suite |
| `npm run test:coverage` | Jest with coverage |
| `npm run lint` | ESLint check |

### Frontend

| Command | Description |
|---|---|
| `npm start` | CRA dev server on port 3000 |
| `npm run build` | Production build → `build/` |
| `npm test` | React Testing Library tests |
| `npm run lint` | ESLint check |

---

## Documentation

| Document | Description |
|---|---|
| [API Docs](./docs/api-docs.md) | Full REST endpoint reference with request/response schemas |
| [User Guide](./docs/user-guide.md) | Non-technical guide to all five core flows |
| [API Schema](./docs/api-schema.md) | Machine-readable contract (source of truth for API) |
| [Execution Plan](./execution_plan.md) | Phase-by-phase build checklist with acceptance criteria |

---

## Security

- Passwords hashed with **bcrypt** (cost factor 12)
- JWT access tokens expire in **30 minutes**; refresh tokens in **7 days**
- IDOR protection: all summary operations verify ownership before any DB write
- XSS protection: React JSX auto-escapes all user-provided content
- CORS restricted to configured origin
- No secrets committed — all keys in `.env` (git-ignored)

---

*Academic Project — Software Engineering / AI Application | May 2026*
