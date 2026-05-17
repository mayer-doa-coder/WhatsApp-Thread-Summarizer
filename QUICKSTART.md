# Quickstart

Get the app running locally in under 10 minutes.

---

## Prerequisites

| Tool | Min version | Check |
|---|---|---|
| Node.js | 20 | `node --version` |
| npm | 10 | `npm --version` |

You also need:
- A [Supabase](https://supabase.com) project (free tier) — for auth and history
- At least one LLM API key — [SambaNova](https://cloud.sambanova.ai) is free and recommended

---

## 1. Clone & install

```bash
git clone https://github.com/mayer-doa-coder/WhatsApp-Thread-Summarizer.git
cd WhatsApp-Thread-Summarizer
```

Install dependencies for both sides:

```bash
cd backend
npm install

cd ../frontend
npm install --force
```

> `--force` is required for the frontend because `react-scripts` 5 has peer dependency conflicts with newer package versions. This is expected — the app works correctly.

---

## 2. Set up the database

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New query**
3. Paste the entire contents of `backend/db/schema.sql` and click **Run**
4. Go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** secret → `SUPABASE_SERVICE_KEY`

> **Important:** Go to **Authentication → Settings → Email** and disable **Confirm email** (enable auto-confirm). Without this, new registrations will be stuck waiting for a confirmation email.

---

## 3. Configure the backend

```bash
cd backend
copy .env.example .env
```

Open `backend/.env` and fill in all values:

```env
PORT=4000
NODE_ENV=development

# LLM providers — the backend tries these in order: SambaNova → Cerebras → Google.
# At least one key is required. SambaNova is the recommended starting point (free tier).
SAMBANOVA_API_KEY=    # https://cloud.sambanova.ai → API Key
CEREBRAS_API_KEY=     # https://cloud.cerebras.ai  → API Keys  (optional fallback)
GOOGLE_API_KEY=       # https://aistudio.google.com/app/apikey (optional fallback)

# Supabase (required for auth + history)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# JWT — generate a random secret with:
#   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-64-char-random-string-here
```

---

## 4. Start the backend

```bash
cd backend
node server.js
```

Expected output:
```
Server running on port 4000
```

Verify it is up:
```bash
curl http://localhost:4000/api/health
# → {"status":"ok"}
```

---

## 5. Configure and start the frontend

Open a second terminal:

```bash
cd frontend
copy .env.example .env
```

`frontend/.env` should contain:
```env
REACT_APP_API_URL=http://localhost:4000
```

Then start the dev server:

```bash
npm start
```

The app opens at **http://localhost:3000**.

---

## 6. Test the full round-trip

1. Open **http://localhost:3000**
2. Export a WhatsApp chat as `.txt` (WhatsApp → chat → ⋮ → More → Export chat → Without media)
3. Drag the `.txt` file onto the upload zone, or click to browse
4. Choose a summary length — Short / Medium / Detailed
5. Click **Process**
6. The Summary page renders: topic, participants, key decisions, action items, and a prose summary

To test auth and history:

1. Click **Register** and create an account
2. After summarising a chat, click **Save to History**
3. Click **History** in the nav to see your saved summaries

---

## Available scripts

### Backend (`cd backend`)

| Command | What it does |
|---|---|
| `node server.js` | Start the API server on port 4000 |
| `npm test` | Run Jest unit + integration tests |
| `npm run test:coverage` | Tests with coverage report |
| `npm run lint` | ESLint check |

### Frontend (`cd frontend`)

| Command | What it does |
|---|---|
| `npm start` | CRA dev server on port 3000 |
| `npm run build` | Production build → `build/` |
| `npm test` | React Testing Library tests |
| `npm run lint` | ESLint check |

---

## All API endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Health check |
| `POST` | `/api/upload` | No | Parse WhatsApp `.txt` export(s) |
| `POST` | `/api/summarize` | No | Summarise a parsed message array via LLM |
| `POST` | `/api/reply` | No | Draft reply options |
| `POST` | `/api/brief` | No | Generate a Daily Brief from multiple files |
| `POST` | `/api/auth/register` | No | Create an account |
| `POST` | `/api/auth/login` | No | Log in and receive a JWT |
| `GET` | `/api/history` | Yes | List saved summaries |
| `POST` | `/api/history` | Yes | Save a summary |
| `DELETE` | `/api/history/:id` | Yes | Delete a saved summary |
| `POST` | `/api/export/pdf` | Yes | Download Daily Brief as PDF |

Full schema: [`docs/api-docs.md`](docs/api-docs.md)

---

## Project layout

```
WhatsApp-Thread-Summarizer/
├── backend/
│   ├── server.js               # Entry point — starts HTTP server on port 4000
│   ├── src/
│   │   ├── app.js              # Express app — mounts all routes and middleware
│   │   ├── config/
│   │   │   ├── llm.js          # Three-tier LLM client (SambaNova → Cerebras → Google)
│   │   │   └── supabase.js     # Supabase client (service role)
│   │   ├── middleware/
│   │   │   ├── authenticate.js # JWT verification
│   │   │   └── errorHandler.js # Global error handler
│   │   ├── models/
│   │   │   ├── user.js         # User CRUD
│   │   │   └── summary.js      # Summary CRUD with ownership check
│   │   ├── parser/
│   │   │   └── whatsappParser.js
│   │   └── routes/             # One file per endpoint group
│   ├── tests/                  # Jest unit + integration tests
│   ├── db/schema.sql           # Supabase schema — run once to set up tables
│   └── .env.example
├── frontend/
│   └── src/
│       ├── App.tsx             # Router + context providers
│       ├── pages/              # UploadPage, SummaryPage, DailyBriefPage, HistoryPage, LoginPage, RegisterPage
│       ├── components/         # SummaryCard, UploadZone, ReplyDrafterPanel, etc.
│       ├── context/            # AuthContext, ToastContext
│       ├── hooks/              # useSummarize, useReplyDrafter, useAuth
│       └── services/api.ts     # Typed Axios client
├── e2e/                        # Playwright end-to-end tests
└── docs/                       # api-docs.md, user-guide.md, api-schema.md, wireframes
```
