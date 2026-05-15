# Quickstart

> **Phase 1 status:** parser, upload/summarize API, and upload UI are complete. The frontend is not yet wired to a router — see [Render UploadPage](#3-render-uploadpage-temporary) below.

---

## Prerequisites

| Tool | Min version |
|---|---|
| Node.js | 18 |
| npm | 9 |

---

## 1. Clone & install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## 2. Configure the backend

Copy the example env file and fill in your keys:

```bash
cd backend
cp .env.example .env   # Windows: copy .env.example .env
```

Open `backend/.env` and set the following values:

```env
# Server
PORT=4000
NODE_ENV=development

# LLM providers — at least one key is required.
# The backend tries them in order: SambaNova → Cerebras → Google.
SAMBANOVA_API_KEY=   # https://cloud.sambanova.ai → API Key
CEREBRAS_API_KEY=    # https://cloud.cerebras.ai  → API Keys
GOOGLE_API_KEY=      # https://aistudio.google.com/app/apikey

# Supabase — needed for /api/history (Phase 5). Leave blank for now if skipping.
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# JWT — needed for auth (Phase 5). Leave blank for now if skipping.
JWT_SECRET=
```

You only need **one** LLM key to get summaries working. Start with any free-tier provider.

---

## 3. Start the backend

```bash
cd backend
node src/server.js
```

Expected output:
```
Server listening on port 4000
```

Verify it is up:
```bash
curl http://localhost:4000/api/health
# → {"status":"ok"}
```

---

## 4. Start the frontend

Open a second terminal:

```bash
cd frontend
npm start
```

The CRA dev server starts on **http://localhost:3000** and proxies nothing by default — the `api.ts` client points directly to `http://localhost:4000`.

---

## 5. Render UploadPage (temporary)

`App.tsx` is still the default CRA placeholder. Until routing is added in a later phase, replace it temporarily to test the upload flow:

```tsx
// frontend/src/App.tsx
import React from 'react';
import UploadPage from './pages/UploadPage';

export default function App() {
  return <UploadPage />;
}
```

Save the file — the browser reloads automatically.

---

## 6. Test the full round-trip

1. Open **http://localhost:3000**
2. Drag a WhatsApp export `.txt` file onto the upload zone (or click to browse)
3. Choose a summary length — Short / Medium / Detailed
4. Click **Process**
5. The page renders the topic, summary text, and action items
6. Open DevTools → Console to see the full `SummarizeResponse` JSON

---

## Available npm scripts

### Backend (`cd backend`)

| Command | What it does |
|---|---|
| `node src/server.js` | Start the API server |
| `npm test` | Run Jest unit tests |
| `npm run lint` | ESLint check |

### Frontend (`cd frontend`)

| Command | What it does |
|---|---|
| `npm start` | Start CRA dev server on port 3000 |
| `npm test` | Run React Testing Library tests |
| `npm run build` | Production build → `build/` |
| `npm run lint` | ESLint check |

---

## API endpoints (Phase 1)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/upload` | Upload `.txt`, parse, return messages |
| `POST` | `/api/summarize` | Summarize a message array via LLM |

Full schema: [`docs/api-schema.md`](docs/api-schema.md)

---

## Project layout

```
WhatsApp-Thread-Summarizer/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app (routes + middleware)
│   │   ├── server.js           # HTTP server entry point
│   │   ├── config/
│   │   │   └── llm.js          # Three-tier LLM client (SambaNova → Cerebras → Google)
│   │   ├── middleware/
│   │   │   └── errorHandler.js # Global error handler
│   │   ├── parser/
│   │   │   ├── whatsappParser.js   # Regex parser for WhatsApp exports
│   │   │   └── chunkMessages.js    # Token-aware message chunker
│   │   └── routes/
│   │       ├── uploadRoutes.js     # POST /api/upload
│   │       └── summarizeRoutes.js  # POST /api/summarize
│   ├── tests/                  # Jest unit tests
│   └── .env                    # Local env (git-ignored)
└── frontend/
    └── src/
        ├── App.tsx
        ├── components/
        │   └── UploadZone.tsx   # Drag-and-drop file picker
        ├── pages/
        │   └── UploadPage.tsx   # Upload + summarize UI
        └── services/
            └── api.ts           # Typed Axios client
```
