# WhatsApp Thread Summarizer + Reply Drafter + Daily Brief Composer | Project Plan │ May 2026

---

<!-- ============================================================
AI SYSTEM DIRECTIVE — READ BEFORE PROCESSING THIS FILE
============================================================
This is the MASTER REQUIREMENTS DOCUMENT for the WhatsApp Thread
Summarizer project. It governs scope, requirements, and rationale.

Rules you MUST follow when reading or modifying this document:
1. This document defines WHAT to build and WHY. It does NOT define
   task execution order. For execution order, see execution_plan.md.
2. NEVER change Requirements (Section 5), System Design (Section 6),
   or Technology Stack (Section 7) without explicit developer approval.
   These sections are locked to Version 1.0 scope.
3. If the developer asks "what should I work on next?", do NOT answer
   from this file. Redirect to execution_plan.md instead.
4. If you detect a contradiction between this file and execution_plan.md,
   flag it immediately — do not silently resolve it on your own.
5. The Status field below reflects the current build state. Keep it in
   sync with execution_plan.md's "Overall Completion" field.
6. Section 14 (Timeline) describes the PLANNED schedule. The ACTUAL
   task-level schedule lives in execution_plan.md — treat Section 14
   as reference only, not as a live tracker.
============================================================ -->

## Document Status

| Field | Value |
|---|---|
| **Status** | `in_progress` |
| **Version** | 1.0 |
| **Execution Plan** | [`execution_plan.md`](./execution_plan.md) |
| **Current Phase** | Phase 0 — Project Setup & Research |
| **Last Updated** | 2026-05-10 |

## Bidirectional Link

| Field | Value |
|---|---|
| **This file** | `WhatsApp_Summarizer_Project_Plan.md` |
| **Linked execution plan** | [`execution_plan.md`](./execution_plan.md) |
| **Relationship** | This document is the source of truth for project scope, requirements, system design, and rationale. `execution_plan.md` operationalizes this document into a phase-by-phase checkbox checklist. Changes to requirements here must be reflected in the execution plan's Acceptance Criteria. Changes to execution order in the execution plan do not require changes to this document unless scope itself changes. |
| **Last synced** | 2026-05-10 |

---

# 📱 WhatsApp Thread Summarizer — Reply Drafter + Daily Brief Composer
## *Complete End-to-End Project Plan*

| **Document Type** | Academic Project Report |
|---|---|
| **Subject** | Software Engineering / AI Application |
| **Version** | 1.0 — Final Submission |
| **Date** | May 2026 |
| **Status** | Complete |

*Prepared for Academic Submission*

---

# 1. Project Overview

## 1.1 What Is This Project?

The WhatsApp Thread Summarizer + Reply Drafter + Daily Brief Composer is an AI-powered productivity application that addresses one of the most common digital-age problems: information overload from messaging platforms.

Most professionals, students, and families deal with dozens — sometimes hundreds — of WhatsApp messages every day across multiple group chats and individual conversations. Missing important updates, forgetting to reply, or spending too much time catching up on threads is a widespread pain point.

This project builds a smart assistant that can:

- Read and understand WhatsApp conversation threads (exported as text).
- Produce concise, accurate summaries of long or complex discussions.
- Suggest context-aware, personalized reply drafts.
- Compile all key takeaways into a beautifully formatted Daily Brief — like a personal newspaper of your WhatsApp activity.

## 1.2 Objectives & Goals

| **Primary Objectives** |
|---|
| **▸** Reduce time spent on reading long WhatsApp threads by 70% or more. |
| **▸** Generate intelligent, context-aware reply suggestions that match the user's communication style. |
| **▸** Produce a single Daily Brief report that aggregates summaries from all active chats. |
| **▸** Deliver a clean, user-friendly web interface requiring no technical expertise. |
| **▸** Support multilingual conversations (English primary, with extensibility for Bengali, Hindi, Arabic, etc.). |

## 1.3 Problem It Solves

| **Problem** | **How This Project Solves It** |
|---|---|
| Missing important messages in busy group chats | Summarizer extracts key decisions, tasks, and updates automatically. |
| Forgetting to reply to important conversations | Reply Drafter creates ready-to-send suggestions in seconds. |
| No overview of daily communication activity | Daily Brief Composer aggregates all chat summaries into one report. |
| Information anxiety from unread message counts | Concise summaries replace the need to scroll through entire threads. |
| Difficulty catching up after being offline | Thread summary provides full context instantly upon return. |

## 1.4 Real-World Applications

- **Corporate Teams** — Managers can get instant summaries of team group updates.
- **Students** — Summarize class group discussions and assignment updates.
- **Healthcare Workers** — Quickly review family/ward coordination chats.
- **Small Business Owners** — Monitor customer inquiry groups without reading every message.
- **Journalists & Researchers** — Extract key facts from community or source chats.
- **Remote Workers & Freelancers** — Stay updated across multiple client communication threads.

---

# 2. Background & Motivation

## 2.1 Why This Project Is Important

WhatsApp has over 2.78 billion monthly active users worldwide (as of 2025). Studies indicate that the average user spends 28 minutes per day on WhatsApp alone. In professional contexts, this rises to 45+ minutes. This represents an enormous productivity drain — much of it spent on trivial catch-up reading rather than meaningful communication.

The rise of Large Language Models (LLMs) such as GPT-4, Claude, and Gemini has made intelligent text understanding and generation a practical reality for developers. Combining these capabilities with a common use case — messaging overload — creates a highly valuable and technically feasible project.

## 2.2 Current Challenges in This Domain

- **Volume Overload:** Group chats with 200+ members can generate thousands of messages per day.
- **Context Loss:** Users who return after being away lose the conversational thread entirely.
- **Decision Tracking:** Important decisions buried in casual conversation are easily missed.
- **Reply Fatigue:** Crafting polite, appropriate replies multiple times a day is mentally taxing.
- **Privacy Concerns:** Most existing tools require uploading private data to cloud servers.
- **No Native WhatsApp API:** WhatsApp does not provide an official API for reading conversation content.

## 2.3 Existing Solutions & Their Limitations

| **Existing Tool / Method** | **Limitations** |
|---|---|
| Manual reading / scrolling | Time-consuming; no summarization; error-prone. |
| WhatsApp Search (built-in) | Only keyword search; no semantic understanding or summarization. |
| Notion AI / ChatGPT (manual paste) | Requires manual export + paste each time; no automation; not integrated. |
| Third-party bots (e.g., WA-GPT) | Privacy risks; unreliable; violate WhatsApp ToS; no official support. |
| Email digest tools | Only for email, not WhatsApp; require separate accounts. |
| Summary browser extensions | Only work in WhatsApp Web; limited AI capability; security risks. |

This project fills the gap by providing a privacy-first, export-based solution with an intuitive interface and state-of-the-art summarization — no cloud chat access required.

---

# 3. Scope of the Project

## 3.1 What Is Included

| **In Scope** |
|---|
| **▸** Parsing of WhatsApp exported .txt chat files (standard export format). |
| **▸** AI-powered summarization of single and multiple chat threads. |
| **▸** Context-aware reply drafting for individual messages or entire conversations. |
| **▸** Daily Brief generation — aggregated report from multiple uploaded chats. |
| **▸** Web-based user interface (React.js frontend) for file upload and interaction. |
| **▸** REST API backend (Node.js / FastAPI) for processing and AI calls. |
| **▸** Support for both individual chats and group chats in export format. |
| **▸** Export of Daily Brief as PDF or downloadable HTML. |
| **▸** Basic user authentication (JWT-based) for session management. |
| **▸** Dark mode and responsive design for desktop and mobile web. |

## 3.2 What Is Excluded

| **Out of Scope** |
|---|
| **▸** Direct WhatsApp integration or access (no WhatsApp API — not officially available). |
| **▸** Real-time message monitoring or live chat interception. |
| **▸** Voice message transcription (audio processing not included in v1). |
| **▸** Image/video content analysis from WhatsApp media. |
| **▸** Mobile native app (iOS / Android) — web app only in v1. |
| **▸** Sending replies directly through WhatsApp — replies are drafted for manual copy-paste. |
| **▸** Multi-language AI model training — relies on pre-trained LLM APIs. |

## 3.3 Assumptions

- Users will export WhatsApp chats using WhatsApp's built-in export feature (Settings → Chat → Export Chat → Without Media).
- Exported files follow the standard WhatsApp .txt format: `'[DD/MM/YYYY, HH:MM:SS] Contact Name: Message text'`.
- An OpenAI API key (or equivalent LLM API access) is available for the summarization and drafting engine.
- The system will process up to 10,000 messages per session without performance degradation.
- Users understand this is a productivity tool and will manually copy-paste any drafted replies.
- Internet connectivity is required for AI API calls in the hosted version.

---

# 4. Feasibility Analysis

## 4.1 Technical Feasibility

This project is technically feasible. All components rely on proven, mature technologies:

- WhatsApp chat exports are plain text files with a consistent, parseable format — trivial to process with regex and string parsing.
- LLM APIs (OpenAI GPT-4o, Anthropic Claude, or Google Gemini) offer robust summarization and text generation via simple HTTP calls — no ML training required.
- React.js (frontend) and Node.js or FastAPI (backend) are industry-standard, well-documented, and widely supported.
- PDF generation libraries (Puppeteer, jsPDF) are mature and well-tested.
- JWT authentication is a solved problem with well-established libraries.

**Conclusion: HIGH technical feasibility. No unsolved engineering problems exist.**

## 4.2 Economic Feasibility

| **Cost Item** | **Estimated Cost (Monthly)** |
|---|---|
| Cloud Hosting (Render / Railway / VPS) | $5 – $20 |
| OpenAI API (GPT-4o-mini, ~100K tokens/day) | $10 – $40 |
| Domain Name | $1 – $2 |
| Database (Supabase free tier) | $0 |
| SSL Certificate (Let's Encrypt) | $0 |
| **Total Estimated Monthly Cost** | **$16 – $62** |

For an academic or MVP context, this is highly affordable. A freemium business model (limited summaries free, premium for Daily Brief + unlimited use) can make the project self-sustaining within months.

## 4.3 Operational Feasibility

The application requires no installation by end users — it is web-based. The workflow is simple: export chat → upload → read summary. User training time is near zero. For the developer, standard DevOps knowledge (deployment, API management) is sufficient for ongoing operations.

## 4.4 Time Feasibility

The full project can realistically be completed within 8 weeks with a single developer, or 4 weeks with a 2-person team. The core MVP (upload + summarize) can be functional within 2 weeks. All timelines are detailed in Section 14 (Timeline).

**Conclusion: HIGHLY FEASIBLE across all four dimensions.**

---

# 5. Requirements

## 5A. Functional Requirements

### FR-1: Chat File Upload & Parsing

- Users can upload one or more .txt WhatsApp export files via a drag-and-drop or file picker interface.
- The system parses the file and extracts: timestamp, sender name, message content, and message type (text / media placeholder).
- Files up to 5 MB are supported. Files larger than 5 MB produce a warning with option to process first N messages.

### FR-2: Thread Summarization

- System generates a structured summary including: topic of conversation, key decisions made, important action items, notable facts or announcements, active participants.
- Summary length is adjustable: Short (3–5 sentences), Medium (1 paragraph), Detailed (bullet-point breakdown).
- User can request re-summarization with a different focus (e.g., 'focus on tasks only').

### FR-3: Reply Drafting

- User selects a specific message or the last N messages to draft a reply for.
- System generates 2–3 reply options with different tones: Formal, Casual, Concise.
- User can copy a reply draft to clipboard with one click.
- User can provide additional context ('I want to decline politely') to refine the draft.

### FR-4: Daily Brief Composition

- User uploads multiple chat files (up to 10 per session).
- System generates a structured Daily Brief report including: overview paragraph, per-chat summary cards, cross-chat action items, key people/topics mentioned across chats.
- Daily Brief can be downloaded as a PDF or copied as formatted HTML.

### FR-5: User Authentication

- Users can register and log in with email and password.
- JWT tokens are used for session management (30-minute expiry, refreshable).
- Guest mode available (no login required, no history saved).

### FR-6: History & Saved Summaries

- Logged-in users can view previously generated summaries.
- Summaries are stored with timestamp, source filename, and summary content.
- Users can delete saved summaries.

## 5B. Non-Functional Requirements

| **NFR Category** | **Requirement** | **Target Metric** | **Priority** |
|---|---|---|---|
| Performance | Summarization response time | < 8 seconds for 500 messages | High |
| Scalability | Concurrent users supported | 100+ simultaneous sessions | Medium |
| Security | Data encryption in transit | HTTPS / TLS 1.3 enforced | Critical |
| Privacy | User chat data retention | Deleted immediately post-session | Critical |
| Availability | System uptime | 99.5% monthly uptime | High |
| Usability | Time to complete first task | < 3 minutes for new user | High |
| Portability | Browser compatibility | Chrome, Firefox, Safari, Edge | Medium |
| Reliability | Error rate on valid inputs | < 0.5% failure rate | High |
| Maintainability | Code test coverage | > 70% unit test coverage | Medium |

---

# 6. System Design

## 6.1 High-Level Architecture

The system follows a 3-Tier Client-Server Architecture with an AI Processing Layer:

| **Layer** | **Description** |
|---|---|
| Presentation Layer (Frontend) | React.js SPA — handles file upload, UI, summary display, and Daily Brief viewer. |
| Application Layer (Backend API) | Node.js (Express) or Python (FastAPI) — handles parsing, orchestration, auth, and AI API calls. |
| AI Processing Layer | LLM API (OpenAI GPT-4o / Claude) — performs summarization, reply drafting, and brief composition via prompt engineering. |
| Data Layer (Database) | PostgreSQL (via Supabase) — stores user accounts, saved summaries, and session logs. |
| Storage Layer | Local memory / Redis (temporary) — holds uploaded file content during session; never persisted to disk. |

## 6.2 Component / Module Breakdown

- **Chat Parser Module:** Reads raw .txt export, tokenizes messages, normalizes timestamps, identifies senders.
- **Pre-processor Module:** Chunks large threads into manageable token windows for the LLM API.
- **Summarizer Module:** Constructs optimized prompts and calls LLM API; parses and formats returned summaries.
- **Reply Drafter Module:** Takes selected message context + user intent; calls LLM for multi-option reply generation.
- **Brief Composer Module:** Aggregates individual summaries; generates cross-chat insights; formats final Daily Brief.
- **Auth Module:** Handles registration, login, JWT issuance and validation.
- **Export Module:** Converts Daily Brief to PDF (Puppeteer) or plain HTML.
- **History Module:** Stores and retrieves saved summaries for logged-in users.

## 6.3 Data Flow Explanation

1. User uploads .txt file(s) via the frontend.
2. Frontend sends file content to the backend REST API via HTTPS POST.
3. Backend Chat Parser Module parses the raw file into a structured message array.
4. Pre-processor chunks messages into API token-safe windows (max ~8,000 tokens per chunk).
5. Summarizer/Drafter Module constructs a prompt and sends it to the LLM API (OpenAI/Claude).
6. LLM API returns generated text (summary / reply options / brief).
7. Backend formats and returns the result to the frontend as a JSON response.
8. Frontend renders the formatted summary, reply options, or Daily Brief to the user.
9. (Optional) User logs in; results are stored in PostgreSQL via the History Module.

## 6.4 Database Design (ER Description)

Three core entities are defined:

- **Users:** id (PK), email, password_hash, created_at, plan (free/premium).
- **Summaries:** id (PK), user_id (FK → Users), filename, summary_text, type (thread/brief), created_at.
- **Sessions:** id (PK), user_id (FK → Users), jwt_token, expires_at, created_at.

**Relationships:** One User → Many Summaries (one-to-many). One User → Many Sessions (one-to-many). No direct relationship between Summaries and Sessions.

---

# 7. Technology Stack

| **Layer** | **Technology** | **Version** | **Justification** |
|---|---|---|---|
| Frontend | React.js | 18+ | Component-based UI; large ecosystem; hooks for state management; fast rendering. |
| Styling | Tailwind CSS | 3+ | Utility-first; rapid UI development; responsive design built-in. |
| Backend | Node.js + Express.js | 20+ LTS | Non-blocking I/O; same language as frontend (JS); excellent for API services. |
| AI Engine | OpenAI API (GPT-4o-mini) | Latest | State-of-the-art summarization; cost-efficient; excellent instruction following. |
| Alt. AI Engine | Anthropic Claude API | claude-3-5-haiku | Backup option; strong at structured text analysis; context window advantage. |
| Database | PostgreSQL (Supabase) | Latest | Reliable relational DB; Supabase offers free tier + built-in auth SDK. |
| Authentication | JWT + bcrypt | Standard | Stateless auth; industry standard; works well with REST APIs. |
| PDF Export | Puppeteer / jsPDF | Latest | Puppeteer renders pixel-perfect PDFs from HTML; jsPDF for client-side option. |
| File Parsing | Custom Node.js Parser | Custom | WhatsApp format is simple enough for custom regex-based parser; no dependency overhead. |
| Deployment | Railway / Render | Latest | Easy deployment; free tier available; supports Node.js + PostgreSQL natively. |
| Version Control | Git + GitHub | Latest | Industry standard; required for collaboration and CI/CD. |
| Testing | Jest + Supertest | Latest | Most popular JS testing combo; easy integration with Express APIs. |

---

# 8. Workflow / Methodology

## 8.1 Chosen Methodology: Agile (Scrum)

Agile Scrum is chosen over Waterfall for the following reasons:

- The AI prompt engineering component requires iterative refinement — output quality can only be judged by testing with real data.
- UI/UX decisions benefit from early feedback loops; features can be reprioritized based on testing.
- Waterfall's rigid sequential phases do not suit a project where requirements can evolve with discovered AI model behaviors.
- Agile sprints create natural checkpoints for academic milestone reporting.

## 8.2 Sprint Plan (8-Week, 2-Week Sprints)

| **Sprint** | **Goals & Deliverables** |
|---|---|
| Sprint 1 (Weeks 1–2) | Project setup, repo structure, chat parser, basic React UI skeleton, API scaffolding, database schema design. |
| Sprint 2 (Weeks 3–4) | LLM API integration, summarization module, basic summary display UI, unit tests for parser and summarizer. |
| Sprint 3 (Weeks 5–6) | Reply drafter module, Daily Brief composer, multi-file upload support, authentication module, history storage. |
| Sprint 4 (Weeks 7–8) | PDF export, UI polish, responsive design, integration testing, performance optimization, deployment, documentation. |

---

# 9. Implementation Plan

## Phase 1: Research (Days 1–5)

- Study WhatsApp export format: identify all variations (iOS vs Android, different date formats, media placeholders).
- Research and compare LLM APIs: evaluate GPT-4o-mini vs Claude Haiku for summarization quality and cost.
- Review existing tools (ChatGPT plugins, WA summary bots) to identify design gaps.
- Define prompt engineering strategy: few-shot vs zero-shot; structured output vs free text.
- Produce a research brief document and finalize technology stack decisions.

## Phase 2: Design (Days 6–10)

- Design database ER diagram and define API endpoint schema.
- Create UI wireframes for all screens: Upload, Summary View, Reply Drafter, Daily Brief, History.
- Finalize prompt templates for summarization, reply drafting, and brief composition.
- Set up GitHub repository with branch strategy (main / develop / feature-*).
- Initialize project with Create React App (frontend) and Express.js (backend).

## Phase 3: Development (Days 11–42)

- **Week 1–2:** Chat Parser, API setup, database connection, basic file upload endpoint.
- **Week 3–4:** Summarization module, LLM API integration, summary rendering UI.
- **Week 5–6:** Reply Drafter module, Daily Brief composer, multi-file handling.
- **Week 7:** Authentication (register/login/JWT), history module, saved summaries UI.
- **Week 8:** Export to PDF, UI polish, dark mode, responsive layout finalization.

## Phase 4: Testing (Days 43–52)

- Unit testing: parser functions, summarizer prompts, auth module.
- Integration testing: full upload-to-summary pipeline end-to-end.
- User acceptance testing: 5–10 users test with real exported chats; collect feedback.
- Performance testing: test with 10,000-message files; measure response times.
- Security audit: check for injection vulnerabilities, auth bypass, data leaks.

## Phase 5: Deployment (Days 53–56)

- Deploy backend to Railway or Render (free tier initially).
- Deploy frontend to Vercel or Netlify.
- Configure environment variables (API keys, DB URL, JWT secret) securely.
- Set up a custom domain with SSL via Let's Encrypt (Cloudflare DNS).
- Run post-deployment smoke tests; monitor error logs.
- Produce final documentation: README, API docs, user guide.

---

# 10. Algorithms & Core Logic

## 10.1 Chat File Parser Algorithm

The parser uses a regular expression to split the raw WhatsApp export into structured message objects.

**Pseudocode — Chat Parser**

```
FUNCTION parseWhatsAppExport(rawText):

  pattern = /^\[(\d{2}\/\d{2}\/\d{4}), (\d{2}:\d{2}:\d{2})\] (.+?): (.+)$/m

  messages = []

  FOR EACH line IN rawText.split('\n'):

    IF line matches pattern:

      messages.append({date, time, sender, content})

    ELSE: // continuation of previous message

      messages.last.content += '\n' + line

  RETURN messages
```

## 10.2 Summarization Algorithm (Token Window Strategy)

LLMs have input token limits. A 500-message thread can easily exceed 4,000 tokens. The chunking strategy handles this:

- **Step 1:** Estimate token count (≈ 4 chars per token on average).
- **Step 2:** If total tokens < 8,000 → send all messages in one API call.
- **Step 3:** If total tokens ≥ 8,000 → split into chunks of ~7,500 tokens with 200-token overlap.
- **Step 4:** Summarize each chunk → receive partial summaries.
- **Step 5:** Send all partial summaries to LLM for final 'summary of summaries' consolidation.

## 10.3 Prompt Engineering Strategy

The quality of this application depends critically on prompt design. Core prompt structure:

- **System Prompt:** Sets role ('You are an expert conversation analyst...'), output format (JSON or structured markdown), and constraints (do not hallucinate, cite message senders by name).
- **Few-Shot Examples:** 2–3 sample input/output pairs included in prompt to guide format.
- **User Prompt:** Contains the chat messages formatted as 'SENDER: Message' and the specific task (summarize / draft reply / compose brief).
- **Output Parsing:** Structured JSON response is parsed and mapped to frontend display components.

---

# 11. UI/UX Design

## 11.1 Application Screens

| **Screen / Page** | **Description & Key Elements** |
|---|---|
| Landing Page | Hero section with clear value proposition, animated demo preview, CTA buttons ('Try Free' / 'Login'), feature highlights, and FAQ section. |
| Upload Screen | Drag-and-drop zone for .txt files; multi-file support indicator; upload progress bar; option to select summary type (Thread Summary / Daily Brief). |
| Summary View | Chat metadata header (participants, date range, message count); formatted summary card; topic tags; action items highlighted in green; 'Generate Reply' button. |
| Reply Drafter Panel | Message context display; three reply option cards (Formal / Casual / Concise); 'Refine' input field; copy-to-clipboard button with confirmation toast. |
| Daily Brief View | Header with today's date; overview paragraph; scrollable per-chat summary cards; cross-chat insights section; 'Download PDF' button; 'Copy HTML' button. |
| History Page | Table of past summaries with filename, date, type; click to re-open any summary; delete option; search/filter bar. |
| Settings Page | API key configuration (for self-hosted users); default summary length preference; tone preference for reply drafts; data retention toggle. |

## 11.2 User Flow

1. User arrives at Landing Page → clicks 'Try Free'.
2. Lands on Upload Screen → drags and drops .txt file(s).
3. Selects mode: 'Summarize Thread' or 'Generate Daily Brief'.
4. Clicks 'Process' → loading indicator appears (avg. 5–8 seconds).
5. Summary View renders with formatted output.
6. User clicks 'Draft a Reply' → Reply Drafter Panel slides in from right.
7. User selects preferred reply tone → copies to clipboard.
8. (Optional) User creates account → summary is saved to History.
9. For Daily Brief: user downloads PDF or copies HTML.

## 11.3 Design Principles

- **Clarity First:** No clutter. Every screen has one primary action.
- **WhatsApp-Inspired Palette:** Familiar green (#25D366) for key CTAs to create intuitive association.
- **Progressive Disclosure:** Advanced options (refine prompt, custom tone) are hidden until needed.
- **Accessibility:** WCAG 2.1 AA compliance; keyboard navigable; screen reader compatible.
- **Mobile Responsive:** Fully functional on mobile browser (core use case for on-the-go brief checking).

---

# 12. Testing Strategy

## 12.1 Unit Testing

**Tool:** Jest (JavaScript). **Target:** All pure functions and individual modules. **Coverage target:** > 70%.

- Test: `parseWhatsAppExport()` with valid iOS format → expect correct message count and sender names.
- Test: `parseWhatsAppExport()` with Android format → expect correct timestamp parsing.
- Test: `chunkMessages()` with 15,000-token input → expect 3 chunks with overlap.
- Test: `formatSummary()` with LLM JSON response → expect correct HTML/markdown output.
- Test: `validateJWT()` with expired token → expect 401 error.
- Test: `hashPassword()` + `comparePassword()` → expect correct bcrypt behavior.

## 12.2 Integration Testing

**Tool:** Supertest (API integration). Tests the full request-response cycle.

- `POST /api/summarize` with valid .txt content → expect 200 with summary JSON.
- `POST /api/summarize` with empty file → expect 400 Bad Request.
- `POST /api/auth/login` with wrong password → expect 401 Unauthorized.
- `GET /api/history` without JWT → expect 403 Forbidden.
- `POST /api/brief` with 10 valid files → expect consolidated Daily Brief within 30 seconds.

## 12.3 System Testing (End-to-End)

**Tool:** Playwright or Cypress. Simulates real browser user interactions.

- E2E: User uploads file → waits → receives summary → clicks 'Draft Reply' → copies reply → toast shown.
- E2E: Guest user generates summary → creates account → summary appears in history.
- E2E: User uploads 10 files → generates Daily Brief → clicks 'Download PDF' → PDF is valid and formatted.

## 12.4 Example Test Cases

| **Test ID** | **Input** | **Expected Output** | **Pass Criteria** |
|---|---|---|---|
| TC-01 | Valid 200-message iOS export file | Summary with 5 bullet points, 3 action items | Response time < 8s, status 200 |
| TC-02 | Empty .txt file | Error: 'No messages found in file' | Status 400, clear error message |
| TC-03 | 1,000-message Android export file | Summary without hallucination; all senders named correctly | Sender names match original file |
| TC-04 | 5 files for Daily Brief | Brief with 5 separate summary cards + overview | All 5 chats represented in output |
| TC-05 | Reply draft request for casual tone | 3 reply options; all friendly in tone | No formal language in casual option |
| TC-06 | Login with correct credentials | JWT token returned; redirect to dashboard | Token valid for 30 minutes |
| TC-07 | 10,000-message file upload | Chunked processing; final summary delivered | Response time < 45s; no timeout |

---

# 13. Risk Analysis

| **Risk** | **Likelihood** | **Impact** | **Mitigation Strategy** |
|---|---|---|---|
| LLM API rate limiting / downtime | Medium | High | Implement retry logic with exponential backoff; support fallback to secondary API (Claude if GPT fails). |
| LLM hallucination in summaries | Medium | High | Use structured output (JSON mode); include sender name validation against parsed data; add disclaimer to UI. |
| WhatsApp export format changes | Low | High | Maintain modular parser; write format-detection logic; monitor WhatsApp release notes. |
| User uploads malicious .txt files | Low | Medium | Sanitize all input; parse text only (no code execution); enforce strict MIME type checking. |
| API cost overrun | Medium | Medium | Implement per-user token budget; use GPT-4o-mini (cost-efficient) by default; add usage dashboard. |
| Privacy breach (stored chat data) | Low | Critical | Store NO raw chat content; process in memory only; end-to-end encryption for all transit data; immediate post-session purge. |
| Poor summary quality for non-English | High | Medium | Set clear scope (English-first); add language detection warning; plan multilingual support for v2. |
| Browser incompatibility | Low | Low | Test on Chrome, Firefox, Safari, Edge; use polyfills for older versions; avoid bleeding-edge CSS. |

---

# 14. Timeline

## 8-Week Project Schedule

| **Week** | **Days** | **Tasks** | **Milestone** |
|---|---|---|---|
| Week 1 | 1–7 | Project setup, research, WhatsApp export analysis, technology finalization, Git repo initialization, database schema design, API endpoint documentation. | ✅ Project scaffolded |
| Week 2 | 8–14 | Chat Parser development and unit testing, basic Express API with file upload endpoint, React app scaffold with upload UI, Supabase database connection. | ✅ Parser complete + API running |
| Week 3 | 15–21 | LLM API integration (OpenAI), Summarizer Module with chunking logic, prompt engineering v1, basic summary display UI, unit tests for summarizer. | ✅ Core summarization working |
| Week 4 | 22–28 | Reply Drafter module, tone selection UI, clipboard copy feature, prompt engineering v2 (reply), integration tests for summarize + reply pipeline. | ✅ Reply Drafter functional |
| Week 5 | 29–35 | Multi-file upload support, Daily Brief Composer module, Brief display UI, cross-chat insight logic, prompt engineering v3 (brief composition). | ✅ Daily Brief working |
| Week 6 | 36–42 | JWT authentication, registration and login UI, protected routes, History Module (save/retrieve/delete summaries), history page UI. | ✅ Auth + History complete |
| Week 7 | 43–49 | PDF export (Puppeteer), UI polish (dark mode, responsive), performance testing (large files), user acceptance testing with 5+ real users, bug fixes. | ✅ UAT complete |
| Week 8 | 50–56 | Final bug fixes, deployment (Railway + Vercel), domain + SSL, smoke testing on production, README + API docs + user guide, project submission. | 🎯 Project Deployed & Submitted |

## Key Milestones Summary

| **Milestone** | **Target Date** |
|---|---|
| M1: Project Setup Complete | End of Week 1 |
| M2: MVP Summarization Working | End of Week 3 |
| M3: All Core Features Complete | End of Week 6 |
| M4: User Acceptance Testing Complete | End of Week 7 |
| M5: Production Deployment | Day 53–54 |
| M6: Documentation & Submission | End of Week 8 |

---

# 15. Budget Estimation

## 15.1 Development Phase (One-Time Costs)

| **Item** | **Estimated Cost** |
|---|---|
| Developer Time (1 developer × 8 weeks × 20 hrs/week) | Sweat equity / academic project (no monetary cost) |
| Development Machine (existing hardware) | $0 (already owned) |
| OpenAI API (development + testing, ~500K tokens) | $3 – $10 |
| Domain Name (1 year, e.g., .app or .io) | $12 – $20 |
| **Total One-Time Cost** | **$15 – $30** |

## 15.2 Monthly Operating Costs (Post-Launch)

| **Item** | **Monthly Cost** |
|---|---|
| Backend Hosting — Railway Starter Plan | $5 |
| Frontend Hosting — Vercel (Free Tier) | $0 |
| Database — Supabase Free Tier (up to 500 MB) | $0 |
| OpenAI API (production usage, ~2M tokens/month) | $20 – $60 |
| Domain renewal (amortized monthly) | $1.50 |
| SSL Certificate (Let's Encrypt) | $0 |
| **Total Monthly Operating Cost** | **$26.50 – $66.50** |

> **Note:** If the project grows beyond the free tier of Supabase, the Pro plan at $25/month provides 8 GB storage and 2 GB database. All cost estimates assume moderate usage. A freemium model (10 free summaries/month, unlimited for premium at $4.99/month) can achieve break-even at approximately 6–14 paying users.

---

# 16. Future Enhancements

## Version 2.0 Roadmap

### Short-Term (3–6 months after launch)

| |
|---|
| **▸** Voice message transcription: Integrate OpenAI Whisper API to transcribe audio messages included in chat exports. |
| **▸** Multi-language support: Add Bengali, Hindi, Arabic summarization using multilingual LLM prompting. |
| **▸** Sentiment analysis overlay: Show emotional tone of conversations (positive / negative / neutral trend graph). |
| **▸** Smart notifications: Email or webhook delivery of the Daily Brief at a user-configured time each morning. |
| **▸** Chrome extension: Summarize WhatsApp Web threads directly in the browser without manual export. |

### Medium-Term (6–12 months)

| |
|---|
| **▸** WhatsApp Business API integration: For businesses with API access, enable real-time message reading and auto-summarization. |
| **▸** iOS and Android native apps: Extend to mobile with React Native for a seamless cross-platform experience. |
| **▸** Team workspace: Allow multiple users to share and collaborate on group chat summaries within an organization. |
| **▸** Custom prompt templates: Let users create and save their own summarization instructions ('Always focus on pricing discussions'). |
| **▸** AI-powered priority inbox: Flag messages that require urgent replies based on content urgency detection. |

### Long-Term (12+ months)

| |
|---|
| **▸** Expand to Telegram, Slack, and Discord: Build a universal chat summarizer for multiple platforms. |
| **▸** Fine-tuned LLM: Train a specialized model on anonymized, consented conversation data for higher accuracy. |
| **▸** Enterprise version: GDPR/HIPAA-compliant on-premises deployment with self-hosted LLM (Llama, Mistral). |
| **▸** Analytics dashboard: Provide communication insights — most active contacts, peak chat hours, response time trends. |
| **▸** Plugin marketplace: Allow developers to build and sell custom analysis plugins (e.g., sales follow-up detector, meeting action item extractor). |

---

# 17. Conclusion

## Project Value Summary
### *WhatsApp Thread Summarizer + Reply Drafter + Daily Brief Composer*

The WhatsApp Thread Summarizer + Reply Drafter + Daily Brief Composer is a timely, technically sound, and practically valuable software project. It directly addresses the universal and growing problem of messaging overload — a challenge experienced by over 2.78 billion WhatsApp users worldwide.

By combining a robust WhatsApp export parser, state-of-the-art LLM summarization via the OpenAI API, intelligent reply drafting, and a structured Daily Brief generation engine — all wrapped in a clean, intuitive web interface — this project delivers genuine productivity value from day one of deployment.

The system is designed with privacy as a non-negotiable principle: no raw chat data is stored, all processing happens in memory, and all transmission is encrypted. This positions it favorably against existing tools that either require cloud access to private chats or rely on unsupported WhatsApp API workarounds.

From an academic standpoint, this project demonstrates mastery of full-stack web development, RESTful API design, LLM prompt engineering, database design, authentication architecture, testing strategy, deployment operations, and business viability analysis — covering virtually the full spectrum of modern software engineering.

| **Dimension** | **Score** | **Dimension** | **Score** |
|---|---|---|---|
| Technical Feasibility | ★★★★★ | Business Viability | ★★★★☆ |
| Real-World Impact | ★★★★★ | Academic Breadth | ★★★★★ |
| Innovation Level | ★★★★☆ | Scalability Potential | ★★★★★ |

In conclusion: this project is ready to be built, is worth building, and has a clear path from academic submission to a real-world product that people will use every single day.

---

*Academic Project Report | All rights reserved*
