# WhatsApp Thread Summarizer

> AI-powered productivity app that summarizes WhatsApp chat exports, drafts replies, and compiles a daily brief.

**Status:** 🚧 In Development — Phase 0 (Project Setup & Research)
**Live Demo:** _Coming soon_

---

## What It Does

- **Thread Summarizer** — Upload a `.txt` WhatsApp export and get a structured summary in seconds
- **Reply Drafter** — Generate 3 context-aware reply options (Formal / Casual / Concise)
- **Daily Brief** — Upload multiple chats and get a single aggregated daily report with cross-chat insights
- **PDF Export** — Download your Daily Brief as a formatted PDF

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js 18 + TypeScript + Tailwind CSS |
| Backend | Node.js + Express.js |
| AI Engine | OpenAI GPT-4o-mini (primary) / Anthropic Claude Haiku (fallback) |
| Database | PostgreSQL via Supabase |
| Auth | JWT + bcrypt |
| PDF Export | Puppeteer |
| Testing | Jest + Supertest + Playwright |

## Local Development

> Full setup instructions will be added once the core scaffold is complete (end of Week 1).

**Prerequisites:** Node.js 20+, npm, Git

```bash
# Clone the repo
git clone https://github.com/mayer-doa-coder/WhatsApp-Thread-Summarizer.git
cd WhatsApp-Thread-Summarizer

# Backend setup (instructions coming soon)
cd backend
cp .env.example .env   # fill in your API keys
npm install
node server.js

# Frontend setup (instructions coming soon)
cd ../frontend
cp .env.example .env
npm install
npm start
```

## Environment Variables

> Full reference will be added when `.env.example` files are created (Step 0.5).

| Variable | Location | Description |
|---|---|---|
| `OPENAI_API_KEY` | backend | OpenAI API key for GPT-4o-mini |
| `ANTHROPIC_API_KEY` | backend | Anthropic API key (Claude Haiku fallback) |
| `SUPABASE_URL` | backend | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | backend | Supabase service role key |
| `JWT_SECRET` | backend | Secret for signing JWT tokens |
| `REACT_APP_API_URL` | frontend | Backend API base URL |

## Project Structure

```
WhatsApp-Thread-Summarizer/
├── frontend/          # React app (to be initialized)
├── backend/           # Express API (to be initialized)
├── docs/              # Research, wireframes, API schema
├── e2e/               # Playwright end-to-end tests
├── execution_plan.md  # Phase-by-phase build checklist
└── WhatsApp_Summarizer_Project_Plan.md  # Full project specification
```

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code only |
| `dev` | Integration branch — all features merge here first |
| `feature/*` | Individual feature branches (e.g. `feature/chat-parser`) |

## Documentation

- [Full Project Plan](./WhatsApp_Summarizer_Project_Plan.md) — requirements, architecture, feasibility analysis
- [Execution Plan](./execution_plan.md) — phase-by-phase task checklist with acceptance criteria
- [API Docs](./docs/api-docs.md) — REST endpoint reference _(coming soon)_
- [User Guide](./docs/user-guide.md) — non-technical usage guide _(coming soon)_

---

*Academic Project — Software Engineering / AI Application | May 2026*
