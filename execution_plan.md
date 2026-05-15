---
type: execution_plan
related_source: WhatsApp_Summarizer_Project_Plan.md
last_updated: 2026-05-10
status: in_progress
---

<!-- ============================================================
AI SYSTEM DIRECTIVE — READ BEFORE PROCESSING THIS FILE
============================================================
This is the ACTIVE EXECUTION PLAN for the WhatsApp Thread Summarizer project.

Rules you MUST follow when reading or modifying this document:
1. NEVER mark a task [ ] as complete [x] unless the developer has
   confirmed the implementation is done and tested.
2. NEVER alter Phase boundaries, Dependency declarations, or
   Acceptance Criteria without explicit developer instruction.
3. When asked to suggest next steps, always read the FIRST unchecked
   task in the current in-progress phase, not an arbitrary task.
4. The canonical source of truth for project scope and requirements
   is WhatsApp_Summarizer_Project_Plan.md. This file governs
   EXECUTION ORDER only — not scope decisions.
5. When both files are loaded, treat contradictions in scope as
   errors and ask the developer to resolve them before proceeding.
6. The Progress Tracker table at the bottom MUST be kept in sync
   with phase Status fields. Do not update one without the other.
============================================================ -->

# WhatsApp Thread Summarizer — Execution Plan

## Bidirectional Link

| Field | Value |
|---|---|
| **This file** | `execution_plan.md` |
| **Source document** | [`WhatsApp_Summarizer_Project_Plan.md`](./WhatsApp_Summarizer_Project_Plan.md) |
| **Relationship** | This file operationalizes the plan described in the source document into a sprint-by-sprint checkbox checklist. The source document defines *what* to build and *why*; this file defines *when* and *how* to build it. |
| **Last synced** | 2026-05-13 |

---

## Document Status

| Field | Value |
|---|---|
| **Status** | `in_progress` |
| **Current Phase** | Phase 4 — Daily Brief + Multi-File Support |
| **Overall Completion** | 4 / 8 phases complete |
| **Start Date** | 2026-05-10 |
| **Target End Date** | 2026-07-05 (8 weeks) |

---

## Git Workflow

**Two permanent branches:**

| Branch | Purpose |
|---|---|
| `main` | Stable code only. Receives a merge from `develop` at the end of each completed phase. |
| `develop` | Active development. All phase branches are cut from here and merged back here. |

**One short-lived branch per phase:**

| Branch name | Cut from | Merge back to | When |
|---|---|---|---|
| `feature/phase-1-parser` | `develop` | `develop` | Start of Phase 1; merge when all Phase 1 steps are checked |
| `feature/phase-2-summarizer` | `develop` | `develop` | Start of Phase 2 |
| `feature/phase-3-reply-drafter` | `develop` | `develop` | Start of Phase 3 |
| `feature/phase-4-daily-brief` | `develop` | `develop` | Start of Phase 4 |
| `feature/phase-5-auth-history` | `develop` | `develop` | Start of Phase 5 |
| `feature/phase-6-polish` | `develop` | `develop` | Start of Phase 6 |
| `feature/phase-7-testing-deploy` | `develop` | `develop` | Start of Phase 7 |

**Rules:**
- Never commit directly to `main`.
- Both teammates push to the same feature branch and open a PR into `develop` when the phase is done.
- After the PR into `develop` is merged and smoke-tested, open a second PR: `develop` → `main`.
- Delete the feature branch after its PR is merged.

**Right now — setup step (do this once before starting Phase 1):**
```
git checkout main
git pull
git checkout -b develop
git push -u origin develop
```

---

## Phase 0: Project Setup & Research

**Week:** 1 (Days 1–7)
**Dependency:** None — this is the entry point.
**Status:** `complete`
**Branch:** All Phase 0 work was committed directly to `main`. Phase 0 fully complete as of 2026-05-14. Before Phase 1, create `develop` from `main` (see Git Workflow above).

### Environment & Repository
- [x] Step 0.1: Create GitHub repository `whatsapp-thread-summarizer` with `main`, `develop`, `feature/*` branch strategy documented in `CONTRIBUTING.md`
  - *Acceptance Criteria:* Repo is live, branches exist, README placeholder present
- [x] Step 0.2: Initialize `frontend/` with Create React App TypeScript template (`npx create-react-app frontend --template typescript`)
  - *Acceptance Criteria:* `npm start` renders the default React app at localhost:3000
- [x] Step 0.3: Initialize `backend/` with `npm init` and install Express.js, dotenv, cors, multer, morgan
  - *Acceptance Criteria:* `node server.js` starts without errors
- [x] Step 0.4: Create root `.gitignore` covering `node_modules/`, `.env`, `*.log`, `build/`, `dist/`
  - *Acceptance Criteria:* `git status` does not list any of those files
- [x] Step 0.5: Create `.env.example` in both `frontend/` and `backend/` listing all required env vars with placeholder values
  - *Acceptance Criteria:* All env vars used in code have a corresponding entry in `.env.example`
- [x] Step 0.6: Install Tailwind CSS in `frontend/`, configure `tailwind.config.js` with brand color `#25D366`
  - *Acceptance Criteria:* A component using `text-[#25D366]` class renders in green
- [x] Step 0.7: Set up ESLint + Prettier in both `frontend/` and `backend/`
  - *Acceptance Criteria:* `npm run lint` runs without errors on the scaffold code

### Research: WhatsApp Export Format
- [x] Step 0.8: Collect at least 3 real exported `.txt` files (iOS group, iOS individual, Android individual)
  - *Acceptance Criteria:* Files stored in `docs/fixtures/` with format variant documented
- [x] Step 0.9: Document timestamp format variations, media placeholders, and system messages in `docs/format-research.md`
  - *Dependency:* Step 0.8
  - *Acceptance Criteria:* `docs/format-research.md` lists all discovered variants with example strings
- [x] Step 0.10: Test base regex against all collected samples and record failure cases in `docs/format-research.md`
  - *Dependency:* Step 0.9
  - *Acceptance Criteria:* Zero unresolved failures against the 3 fixture files

### Research: LLM API Comparison
- [x] Step 0.11: Create test harness `docs/llm-comparison/test-runner.js` sending 3 fixture files to 8 free cloud models across Cerebras, SambaNova, OpenRouter, and Google AI Studio
  - *Acceptance Criteria:* Script runs and outputs comparison data without errors
- [x] Step 0.12: Record quality score, latency, cost, and JSON adherence for each model; document rationale for Llama 4 Maverick 128E (primary), Llama 3.1 8B (fallback 1), and Gemini 2.5 Flash (fallback 2) in `docs/format-research.md`
  - *Dependency:* Step 0.11
  - *Acceptance Criteria:* Decision is documented with data supporting it

### Design Deliverables
- [x] Step 0.13: Write `docs/api-schema.md` defining all 7 REST endpoints with request/response schemas and error codes
  - *Acceptance Criteria:* All endpoints from Section 5 of the source doc are covered
- [x] Step 0.14: Create Supabase project, define 3-table schema (`users`, `summaries`, `sessions`), save migration SQL to `backend/db/schema.sql`
  - *Acceptance Criteria:* Running the SQL in Supabase produces the target tables with correct foreign keys
- [x] Step 0.15: Create UI wireframes for all 6 screens and save as images to `docs/wireframes/`
  - *Acceptance Criteria:* Wireframe file exists for each screen listed in Section 11.1 of the source doc
  - *Files:* `screen-1-upload.svg`, `screen-2-summary.svg`, `screen-3-reply-drafter.svg`, `screen-4-daily-brief.svg`, `screen-5-history.svg`, `screen-6-auth.svg` — Dark Cosmic Neu theme (`#0e1020` base, uniform grid overlay, star field, neumorphic raised/inset shadows, `#25D366` green accents)
- [x] Step 0.16: Write `docs/prompt-templates.md` with v1 prompt templates for summarization, reply drafting, and daily brief
  - *Acceptance Criteria:* Each template has a system prompt and user prompt section with placeholder variables

---

## Phase 1: Core Parser + API Foundation

**Week:** 2 (Days 8–14)
**Dependency:** Phase 0 complete — repo initialized, format research done, API schema documented
**Status:** `complete`
**Branch:** `git checkout develop && git checkout -b feature/phase-1-parser && git push -u origin feature/phase-1-parser`
**Merge when done:** PR `feature/phase-1-parser` → `develop`, then PR `develop` → `main`

### Chat Parser Module (`backend/src/parser/`)
- [x] Step 1.1: Create `backend/src/parser/whatsappParser.js` — `parseWhatsAppExport(rawText)` returns `[{ date, time, timestamp, sender, content, type }]`
  - *Acceptance Criteria:* All 3 fixture files from Step 0.8 parse without errors
- [x] Step 1.2: Handle multi-line message continuation (non-timestamp lines appended to previous message's `content`)
  - *Acceptance Criteria:* A 3-line message is stored as a single object with newlines in `content`
- [x] Step 1.3: Detect and tag `type` as `text`, `media`, `system`, or `deleted` using strings from `docs/format-research.md`
  - *Dependency:* Step 0.9
  - *Acceptance Criteria:* `<Media omitted>` messages are tagged `media`, not `text`
- [x] Step 1.4: Normalize all timestamps to ISO 8601 regardless of source locale variant
  - *Acceptance Criteria:* iOS 12-hour and Android 24-hour timestamps both produce valid ISO strings
- [x] Step 1.5: Create `backend/src/parser/chunkMessages.js` — `chunkMessages(messages, maxTokens)` splits with 200-token overlap; default `maxTokens` = 7500
  - *Acceptance Criteria:* A 15,000-token mock input produces 3 chunks each ≤ 7500 tokens with 200-token overlap
- [x] Step 1.6: Write unit tests in `backend/tests/parser.test.js` — minimum 8 cases covering all formats, edge cases, and the chunker
  - *Acceptance Criteria:* `npm test` shows 0 failures, all 8+ tests pass

### Express API Scaffolding (`backend/src/`)
- [x] Step 1.7: Create `backend/src/app.js` with CORS, JSON parsing, Morgan; `backend/server.js` listening on `PORT || 4000`
  - *Acceptance Criteria:* Server starts and `GET /api/health` returns `{ status: 'ok' }`
- [x] Step 1.8: Create `POST /api/upload` — Multer memory storage, validates MIME type `text/plain`, rejects files > 5 MB with 413
  - *Acceptance Criteria:* A PNG renamed to `.txt` is rejected with 415; a 6 MB file with 413
- [x] Step 1.9: Create `POST /api/summarize` — accepts `{ messages, summaryType }`, calls chunker + LLM via v1 prompt, returns structured summary JSON
  - *Dependency:* Steps 1.5, 0.16
  - *Acceptance Criteria:* A real 200-message export returns a 200 response with all 6 summary fields
- [x] Step 1.10: Create global error handler `backend/src/middleware/errorHandler.js` — returns `{ error, message, code }`, never exposes stack traces in production
  - *Acceptance Criteria:* Throwing an uncaught error from a route returns 500 with no stack trace in the response body
- [x] Step 1.11: Create `backend/src/config/llm.js` — initializes OpenAI-compatible clients for all three providers, exports `callLLM(messages, model)`, falls back through Llama 3.1 8B then Gemini 2.5 Flash on 429/5xx
  - *Acceptance Criteria:* Mocking the primary client to throw 429 causes the function to retry with Llama 3.1 8B (Cerebras), and if that also fails, successfully resolve using Gemini 2.5 Flash (Google AI Studio)

### React Frontend Foundation (`frontend/src/`)
- [x] Step 1.12: Create `frontend/src/components/UploadZone.tsx` — drag-and-drop for `.txt` only, shows file name/size after selection, exposes `onFileSelected(file)` callback
  - *Acceptance Criteria:* Dropping a `.txt` file highlights the zone and displays the filename; dropping a `.pdf` is rejected
- [x] Step 1.13: Create `frontend/src/services/api.ts` — Axios client with typed functions: `uploadAndSummarize`, `draftReply`, `generateBrief`, `getHistory`, `deleteHistoryItem`
  - *Acceptance Criteria:* `npx tsc --noEmit` passes with 0 errors under `strict: true`; no `any` types used; all request/response shapes match `docs/api-schema.md`
- [x] Step 1.14: Create `frontend/src/pages/UploadPage.tsx` with `UploadZone`, summary type selector, and Process button wired to `api.uploadAndSummarize()`
  - *Acceptance Criteria:* Full round-trip — drag file → click Process → see summary JSON in browser console — works without errors; `npx tsc --noEmit` passes 0 errors

---

## Phase 2: Summarization Engine

**Week:** 3 (Days 15–21)
**Dependency:** Phase 1 complete — parser tested, `/api/summarize` operational, React upload flow connected
**Status:** `complete`
**Branch:** `git checkout develop && git checkout -b feature/phase-2-summarizer && git push -u origin feature/phase-2-summarizer`
**Merge when done:** PR `feature/phase-2-summarizer` → `develop`, then PR `develop` → `main`

### Summarizer Module (`backend/src/summarizer/`)
- [x] Step 2.1: Create `backend/src/summarizer/promptBuilder.js` — `buildSummarizationPrompt(messages, summaryLength)` using v1 template from `docs/prompt-templates.md`; `summaryLength` accepts `'short' | 'medium' | 'detailed'`
  - *Acceptance Criteria:* Each length variant produces a noticeably different prompt; invalid/undefined `summaryLength` defaults to `'medium'`; function returns `{ systemPrompt, userPrompt, summaryLength }`; optional `chunkMeta` argument injects chunk annotation into `userPrompt`
- [x] Step 2.2: Create `backend/src/summarizer/responseParsers.js` — `parseSummaryResponse(llmOutput)` extracts `{ topic, keyDecisions, actionItems, notableFacts, participants, summaryText }`; gracefully handles non-JSON LLM responses
  - *Acceptance Criteria:* Passing malformed JSON does not throw — returns a fallback object with `summaryText` populated from raw string; markdown fences stripped before parse; array fields coerced to `[]` if missing or wrong type; `null`/`undefined` input handled without throw
- [x] Step 2.3: Implement multi-chunk pipeline in `backend/src/summarizer/summarizer.js` — chunk → summarize each → consolidate via "summary of summaries" call
  - *Dependency:* Steps 1.5, 2.1, 2.2
  - *Acceptance Criteria:* All chunks summarized concurrently via `Promise.all`; single-chunk input returns directly without a consolidation call; multi-chunk input runs a final consolidation LLM call to merge partials; empty/non-array input rejects with a descriptive error
- [x] Step 2.4: Add retry logic to `callLLM()` — on 429, wait 2s and retry once on same tier; on second 429 switch to next tier; log all failures
  - *Acceptance Criteria:* SambaNova 429 x2 → 2s delay between attempts → cascades to Cerebras (elapsed ~2s); SambaNova + Cerebras both fail (4 attempts total) → cascades to Google; intra-tier success on retry 2 does not cascade; non-retryable (401/403) throws immediately without retry; all failures logged with tier name, attempt number, and status code
- [x] Step 2.5: Write unit tests in `backend/tests/summarizer.test.js` with mocked LLM — minimum 6 cases covering prompt format, response parsing (valid JSON), response parsing (malformed), and 3-chunk pipeline
  - *Acceptance Criteria:* 7 tests pass (0 failures); `callLLM` mocked via `jest.mock`; mocks auto-cleared between tests via `clearMocks: true` in `backend/package.json` (global Jest config — no per-file `beforeEach` needed); 3-chunk map-reduce asserts exactly 4 `callLLM` calls; `summaryLength` passthrough verified via `callLLM.mock.calls` system prompt inspection

### Summary Display UI (`frontend/src/`)
- [x] Step 2.6: Create `frontend/src/components/SummaryCard.tsx` — renders all 6 summary fields; action items in green-highlighted bullets; Tailwind green left border (`border-l-4 border-[#25D366]`)
  - *Acceptance Criteria:* Component renders all 6 fields; `border-l-4 border-[#25D366]` on outer container; action items use `rgba(37,211,102,…)` row tint + left bar + green text on first item; `SummaryData` interface is strictly typed (no `any`); graceful empty-array handling on all array fields; `npx tsc --noEmit` → 0 errors under `strict: true`
- [x] Step 2.7: Create `frontend/src/pages/SummaryPage.tsx` — receives summary from router state; renders `SummaryCard`; "Generate Reply Draft" button (stub); "Start Over" button navigating back to Upload
  - *Acceptance Criteria:* Navigating to `/summary` with a populated `SummaryData` state object renders the full `SummaryCard` and both buttons; direct navigation to `/summary` with no state auto-redirects to `/` via `useEffect`; `isSummaryData` type-guard validates the shape of `location.state` without casting to `any`; `react-router-dom` installed and `App.tsx` wired with `BrowserRouter` + `Routes` for `/` and `/summary`; `npx tsc --noEmit` → 0 errors
- [x] Step 2.8: Create `frontend/src/hooks/useSummarize.ts` — manages API call lifecycle: `{ loading, error, summary, trigger }`
  - *Acceptance Criteria:* `trigger(file, summaryType)` sets `loading` to `true`, awaits `uploadAndSummarize`, populates `summary: SummaryResult | null` on success; on failure, extracts message via `axios.isAxiosError` (uses server `data.message` when present, falls back to `err.message`) and sets `error: string | null`; `finally` block guarantees `loading` resets to `false` in all paths; `trigger` is stable across renders via `useCallback([], [])`; `npx tsc --noEmit` → 0 errors
- [x] Step 2.9: Wire `useSummarize` into `UploadPage.tsx` — navigate to `SummaryPage` on success, show `ErrorToast` on failure
  - *Acceptance Criteria:* `useSummarize()` replaces all manual `isProcessing`/`result`/`error` state; `useEffect` on `summary` calls `navigate('/summary', { state: summary })` the moment it becomes truthy; Process button disabled and shows "Processing…" while `loading` is true or `selectedFile` is null; `error` renders an inline toast (`border-red-500 bg-red-900/35 text-[#fca5a5]`, `role="alert"`); inline result display removed (now handled by `SummaryPage`); `npx tsc --noEmit` → 0 errors

---

## Phase 3: Reply Drafter Module

**Week:** 4 (Days 22–28)
**Dependency:** Phase 2 complete — summarizer pipeline tested, SummaryPage rendering correctly
**Status:** `complete`
**Branch:** `git checkout develop && git checkout -b feature/phase-3-reply-drafter && git push -u origin feature/phase-3-reply-drafter`
**Merge when done:** PR `feature/phase-3-reply-drafter` → `develop`, then PR `develop` → `main`

### Reply Drafter Backend
- [x] Step 3.1: Create `backend/src/summarizer/replyDrafter.js` — `draftReplies(messages, userIntent, tone)` returns exactly 3 reply options; validates non-empty strings
  - *Acceptance Criteria:* Returns exactly 3 non-empty strings (pad with duplicates / static fallback if LLM returns fewer); `messages` empty or non-array throws with descriptive error; `TONE_CONFIG` covers all 6 tones (`formal`, `casual`, `concise`, `empathetic`, `apologetic`, `assertive`) with distinct system-prompt constraint blocks; `formal` block explicitly lists common contractions and uses "MUST NOT"; `concise` block instructs "strictly under 40 words" and "count words carefully"; unknown tone defaults to `casual`; unparseable LLM response returns 3 static fallback strings instead of throwing; `messagesToTranscript` reused from `promptBuilder.js`; uses last 20 messages as context window
- [x] Step 3.2: Add `POST /api/reply` — validates `messages` non-empty and < 50 items; returns `{ options: [string, string, string] }`
  - *Acceptance Criteria:* Missing or empty `messages` → 400 `"messages must be a non-empty array."`; `messages.length >= 50` → 400 `"messages must contain fewer than 50 items."`; valid input → `draftReplies` called → 200 `{ options: [...] }`; caught errors forwarded via `next(err)` to global error handler; router mounted at `/api/reply` in `app.js`
- [x] Step 3.3: Refine reply prompt templates in `docs/prompt-templates.md` with few-shot examples for tone consistency
  - *Acceptance Criteria:* Prompt templates updated with at least 1 example per tone
- [x] Step 3.4: Write unit tests in `backend/tests/replyDrafter.test.js` — minimum 5 cases covering all 3 tones, empty messages 400, and `userIntent` shaping the output
  - *Acceptance Criteria:* 5 tests pass (0 failures); `callLLM` mocked via `jest.mock`; mocks auto-cleared between tests via `clearMocks: true` in `backend/package.json`; formal test asserts `MUST NOT` and `do not` in system prompt; concise test asserts `40 words` and `Count words carefully`; casual test asserts `CASUAL`; empty-array rejection asserts no `callLLM` call was made; userIntent test asserts the verbatim intent string appears in the user-role message

### Reply Drafter UI
- [x] Step 3.5: Create `frontend/src/components/ReplyDrafterPanel.tsx` — right-side slide-in panel with context display, tone selector tabs, `userIntent` text input, "Generate Drafts" button, 3 reply cards each with "Copy" button
  - *Acceptance Criteria:* Panel slides in and out smoothly (`translate-x-0` / `translate-x-full` + `duration-300`); Escape key closes it via `keydown` `useEffect`; backdrop overlay closes on click; all 6 tones rendered as pill buttons with `#25D366` active state; `contextText` displayed in read-only inset box (line-clamped to 4 lines); `userIntent` textarea; "Generate Drafts" stub updates `drafts` state; 3 draft cards each with "Copy" button wired to `navigator.clipboard.writeText()`; `ReplyDrafterPanelProps` interface strictly typed; `npx tsc --noEmit` → 0 errors
- [x] Step 3.6: Implement clipboard copy — `navigator.clipboard.writeText()` with "Copied!" badge for 2 seconds; fallback to `document.execCommand('copy')`
  - *Acceptance Criteria:* `frontend/src/hooks/useClipboard.ts` exports `useClipboard()` returning `{ copyToClipboard, isCopied }`; modern `navigator.clipboard.writeText` attempted first; `.catch()` falls back to hidden `<textarea>` + `document.execCommand('copy')`; `navigator.clipboard` absence also triggers fallback; `isCopied` set to `true` on success then reset to `false` after 2000ms via `setTimeout`; timer ref cleared on rapid re-clicks and on unmount via `useEffect` cleanup; each `DraftCard` in `ReplyDrafterPanel` owns its own `useClipboard()` instance for independent per-card badge state; button label toggles "Copy" → "Copied!" with green highlight; `npx tsc --noEmit` → 0 errors
- [x] Step 3.7: Create `frontend/src/hooks/useReplyDrafter.ts` — `{ loading, error, options, generate }`
  - *Acceptance Criteria:* `useReplyDrafter()` returns `{ loading: boolean, error: string | null, options: string[], generate: (messages: Message[], userIntent: string, tone: Tone) => Promise<void> }`; `generate()` resets `error` to `null` and sets `loading` to `true` before the API call; on success, `options` is populated with the returned string array via `draftReply` from `../services/api`; on failure, `axios.isAxiosError` used to extract `err.response?.data?.message` with fallback to `err.message` then generic string; `finally` block guarantees `loading` resets to `false` in all paths; `generate` is stable across renders via `useCallback([], [])`; `UseReplyDrafterReturn` interface explicitly typed; `npx tsc --noEmit` → 0 errors under `strict: true`
- [x] Step 3.8: Wire `ReplyDrafterPanel` into `SummaryPage.tsx`; add keyboard accessibility (Escape closes, Tab cycles cards)
  - *Acceptance Criteria:* `SummaryPage` imports `ReplyDrafterPanel`; `isDrafterOpen` state drives `isOpen` prop; "Draft a Reply →" button calls `setIsDrafterOpen(true)`; `contextText` derived as `topic + ' — ' + summaryText`; panel mounted outside the `max-w-3xl` container at page root; `ReplyDrafterPanel` replaces stub `handleGenerateDrafts` with `useReplyDrafter().generate(proxyMessages, userIntent, selectedTone)`; `proxyMessages` built from `contextText` so API receives non-empty messages; Generate button shows "Generating…" and `disabled` while `loading`; error displayed with `role="alert"` and red styling; `options` from hook replaces placeholder `drafts` state when non-empty; `DraftCard` gets `tabIndex={0}` on real options (placeholder cards use `tabIndex={-1}`), `role="article"`, descriptive `aria-label`, and `onKeyDown` handler triggering `copyToClipboard` on Enter or Space; Escape closes panel via `keydown` listener; `npx tsc --noEmit` → 0 errors

---

## Phase 4: Daily Brief + Multi-File Support

**Week:** 5 (Days 29–35)
**Dependency:** Phase 3 complete — reply drafter endpoint tested, panel UI wired
**Status:** `not_started`
**Branch:** `git checkout develop && git checkout -b feature/phase-4-daily-brief && git push -u origin feature/phase-4-daily-brief`
**Merge when done:** PR `feature/phase-4-daily-brief` → `develop`, then PR `develop` → `main`

### Multi-File Upload
- [ ] Step 4.1: Update `POST /api/upload` to accept up to 10 files via Multer `array('files', 10)`; validate each file individually
  - *Acceptance Criteria:* 11 files returns 400; 10 valid files returns 200 with all parsed
- [ ] Step 4.2: Update `UploadZone.tsx` for multi-file display — scrollable list, individual remove buttons, 10-file warning
  - *Acceptance Criteria:* Adding 11 files shows a warning; each file is individually removable

### Daily Brief Composer Backend
- [ ] Step 4.3: Create `backend/src/summarizer/briefComposer.js` — `composeDailyBrief(summaries)` returns `{ overviewParagraph, chatCards, crossChatInsights, keyPeople }`
  - *Acceptance Criteria:* 5-chat input produces a brief with 5 `chatCards`
- [ ] Step 4.4: Add `POST /api/brief` — parses all files, summarizes each independently, calls `composeDailyBrief()`; 60-second timeout returning 504 on breach
  - *Dependency:* Step 4.3
  - *Acceptance Criteria:* 5 files → 200 response within 60s; timeout scenario → 504 with descriptive message
- [ ] Step 4.5: Write unit tests in `backend/tests/briefComposer.test.js` — minimum 4 cases
  - *Acceptance Criteria:* 0 test failures

### Daily Brief UI
- [ ] Step 4.6: Create `frontend/src/components/BriefChatCard.tsx` — compact 320px-wide card for horizontal scroll; "View Full" expands to full `SummaryCard` in a modal
  - *Acceptance Criteria:* Component renders with fixed width; modal opens and closes correctly
- [ ] Step 4.7: Create `frontend/src/pages/DailyBriefPage.tsx` — date header, overview paragraph, horizontal scroll row of `BriefChatCard`s, cross-chat insights, key people tag cloud, "Download PDF" placeholder, "Copy as HTML" button
  - *Acceptance Criteria:* All sections render for a 5-chat brief
- [ ] Step 4.8: Implement "Copy as HTML" — serializes `#brief-container` innerHTML, wraps in inline-styled HTML doc, copies to clipboard
  - *Acceptance Criteria:* Pasting the copied HTML into a new tab renders the brief correctly

---

## Phase 5: Authentication + History

**Week:** 6 (Days 36–42)
**Dependency:** Phase 4 complete — all three core feature pipelines operational
**Status:** `not_started`
**Branch:** `git checkout develop && git checkout -b feature/phase-5-auth-history && git push -u origin feature/phase-5-auth-history`
**Merge when done:** PR `feature/phase-5-auth-history` → `develop`, then PR `develop` → `main`

### Auth Backend
- [ ] Step 5.1: Install `bcrypt`, `jsonwebtoken`, `express-validator` in backend
- [ ] Step 5.2: Create `backend/src/models/user.js` — `createUser`, `findUserByEmail`, `findUserById` via Supabase JS client
  - *Acceptance Criteria:* Functions insert and query the `users` table correctly
- [ ] Step 5.3: Add `POST /api/auth/register` — validates email format + password ≥ 8 chars; bcrypt hash (salt 12); returns `{ token, user }`
  - *Acceptance Criteria:* Valid input → 201 + JWT; duplicate email → 409; weak password → 422
- [ ] Step 5.4: Add `POST /api/auth/login` — bcrypt compare; JWT with 30-min expiry; returns `{ token, user }`
  - *Acceptance Criteria:* Wrong password → 401
- [ ] Step 5.5: Create `backend/src/middleware/authenticate.js` — validates `Authorization: Bearer <token>`; attaches `req.user`; returns 401 if missing/invalid, 403 if expired
  - *Acceptance Criteria:* Expired JWT → 403; missing token → 401
- [ ] Step 5.6: Write unit tests in `backend/tests/auth.test.js` — minimum 5 cases
  - *Acceptance Criteria:* 0 test failures

### History Module
- [ ] Step 5.7: Create `backend/src/models/summary.js` — `saveSummary`, `getUserSummaries`, `deleteSummary`
  - *Acceptance Criteria:* CRUD operations work against the `summaries` table
- [ ] Step 5.8: Add `POST /api/history` (protected), `GET /api/history` (protected), `DELETE /api/history/:id` (protected with IDOR check)
  - *Acceptance Criteria:* `GET /api/history` without JWT → 401; `DELETE` with another user's ID → 403

### Auth + History UI
- [ ] Step 5.9: Create `LoginPage.tsx` and `RegisterPage.tsx` — form validation, loading states, server error display
  - *Acceptance Criteria:* Both pages render; invalid inputs show inline error messages
- [ ] Step 5.10: Create `frontend/src/context/AuthContext.tsx` — provides `{ user, token, login, logout, register }`; persists token to `localStorage`
  - *Acceptance Criteria:* Refreshing the page keeps the user logged in
- [ ] Step 5.11: Create `HistoryPage.tsx` — table with Filename, Type, Date, Actions; client-side search; confirmation dialog on delete
  - *Acceptance Criteria:* Full save → view → delete round-trip works
- [ ] Step 5.12: Add "Save to History" button to `SummaryPage.tsx` (visible only when logged in); protect `/history` route with `PrivateRoute`
  - *Acceptance Criteria:* Unauthenticated access to `/history` redirects to `/login`

---

## Phase 6: UI Polish + PDF Export

**Week:** 7 (Days 43–49)
**Dependency:** Phase 5 complete — auth and history fully functional
**Status:** `not_started`
**Branch:** `git checkout develop && git checkout -b feature/phase-6-polish && git push -u origin feature/phase-6-polish`
**Merge when done:** PR `feature/phase-6-polish` → `develop`, then PR `develop` → `main`

### PDF Export
- [ ] Step 6.1: Install `puppeteer` in backend
- [ ] Step 6.2: Create `backend/src/export/pdfExporter.js` — `exportBriefToPDF(briefHtml)` uses headless Chromium to produce A4 PDF Buffer
  - *Acceptance Criteria:* Function returns a non-empty Buffer that opens as a valid PDF in Adobe Reader
- [ ] Step 6.3: Create `backend/src/export/briefTemplate.js` — `renderBriefHTML(briefData)` returns inline-CSS HTML string (no Tailwind; PDF-safe)
  - *Acceptance Criteria:* Rendered HTML displays all brief sections correctly in a browser
- [ ] Step 6.4: Add `POST /api/export/pdf` (protected) — calls `renderBriefHTML` then `exportBriefToPDF`; streams PDF with `Content-Disposition: attachment`
  - *Acceptance Criteria:* Request triggers a file download in the browser
- [ ] Step 6.5: Wire "Download PDF" button in `DailyBriefPage.tsx` to the export endpoint via blob URL download
  - *Acceptance Criteria:* Clicking the button downloads a correctly named `daily-brief-YYYY-MM-DD.pdf`

### Dark Mode
- [ ] Step 6.6: Enable `darkMode: 'class'` in `tailwind.config.js`; add theme toggle to nav bar; persist preference to `localStorage`
  - *Acceptance Criteria:* Dark mode persists across page refreshes
- [ ] Step 6.7: Audit and apply dark mode classes to all components and pages
  - *Acceptance Criteria:* No white elements visible in dark mode on any page

### Responsive Design
- [ ] Step 6.8: Audit all pages for mobile breakpoints; fix any horizontal scroll at 375px viewport
  - *Acceptance Criteria:* Chrome DevTools 375px emulation shows no horizontal scroll on any page
- [ ] Step 6.9: Convert `DailyBriefPage` horizontal scroll to vertical stack on mobile; convert `ReplyDrafterPanel` to bottom sheet on mobile
  - *Acceptance Criteria:* Both components behave correctly at 375px and 768px breakpoints

### UI Quality
- [ ] Step 6.10: Replace all `alert()` / `console.error()` with `ErrorToast` / `SuccessToast` (auto-dismiss 4s)
  - *Acceptance Criteria:* No bare `alert()` calls remain in the codebase
- [ ] Step 6.11: Add loading skeleton screens to `SummaryPage` and `DailyBriefPage` using Tailwind `animate-pulse`
  - *Acceptance Criteria:* Skeletons display during the loading state on both pages
- [ ] Step 6.12: WCAG 2.1 AA audit — run axe DevTools on Upload, Summary, and History pages; fix all critical/serious violations
  - *Acceptance Criteria:* 0 critical or serious axe violations on the 3 audited pages

---

## Phase 7: Testing + Deployment

**Week:** 8 (Days 50–56)
**Dependency:** Phase 6 complete — UI polish done, PDF export working, dark mode and responsive layout complete
**Status:** `not_started`
**Branch:** `git checkout develop && git checkout -b feature/phase-7-testing-deploy && git push -u origin feature/phase-7-testing-deploy`
**Merge when done:** PR `feature/phase-7-testing-deploy` → `develop`, then final PR `develop` → `main` (this is the production release)

### Integration Testing
- [ ] Step 7.1: Write `backend/tests/integration/api.test.js` with Supertest — minimum 8 cases covering all critical endpoints
  - *Acceptance Criteria:* 0 test failures
- [ ] Step 7.2: Achieve ≥ 70% backend Jest coverage — attach report to `docs/test-coverage-report.md`
  - *Acceptance Criteria:* `jest --coverage` shows ≥ 70% line coverage

### Performance Testing
- [ ] Step 7.3: Create `backend/tests/performance/largeFile.test.js` — synthetic 10,000-message export, assert response within 45 seconds
  - *Acceptance Criteria:* 3 consecutive runs all complete under 45 seconds

### End-to-End Testing (Playwright)
- [ ] Step 7.4: Initialize Playwright in `e2e/` directory
- [ ] Step 7.5: Write `e2e/upload-and-summarize.spec.ts` — upload fixture, assert summary card renders with action items
  - *Acceptance Criteria:* Test passes against production URL
- [ ] Step 7.6: Write `e2e/reply-drafter.spec.ts` — open panel, select Casual, assert 3 cards appear, copy first card
  - *Acceptance Criteria:* Test passes; "Copied!" badge appears
- [ ] Step 7.7: Write `e2e/auth-and-history.spec.ts` — register, save summary, view in history, delete
  - *Acceptance Criteria:* Test passes end-to-end
- [ ] Step 7.8: Write `e2e/daily-brief.spec.ts` — upload 3 files, assert brief page, assert PDF download initiates
  - *Acceptance Criteria:* Test passes; download event is detected

### Security Checks
- [ ] Step 7.9: Test IDOR — `DELETE /api/history/:id` with user A's token on user B's summary → confirm 403
  - *Acceptance Criteria:* 403 returned; no data deleted
- [ ] Step 7.10: Test XSS — upload `.txt` with `<script>alert('xss')</script>` as message content → confirm script does not execute in rendered `SummaryCard`
  - *Acceptance Criteria:* Script tag is escaped; no alert fires
- [ ] Step 7.11: Confirm no secrets in git history — `git log --all -S 'sk-' --oneline` returns 0 results
  - *Acceptance Criteria:* Command returns empty output

### Deployment
- [ ] Step 7.12: Create `Procfile` (Railway) and `render.yaml` (Render) in `backend/`; deploy backend; confirm `GET /api/health` works in production
  - *Acceptance Criteria:* Production health check returns `{ status: 'ok' }`
- [ ] Step 7.13: Deploy frontend to Vercel; set `REACT_APP_API_URL` env var to production backend URL; confirm build succeeds
  - *Acceptance Criteria:* Production URL loads the app with no console errors
- [ ] Step 7.14: Configure custom domain in Cloudflare DNS; enable Cloudflare Full (strict) SSL; confirm HTTPS at custom domain
  - *Acceptance Criteria:* `https://your-domain.com` loads with valid certificate
- [ ] Step 7.15: Run post-deployment smoke tests — upload, summarize, login, history, PDF download — document results in `docs/smoke-test-results.md`
  - *Acceptance Criteria:* All 5 smoke test scenarios pass on production

### Documentation
- [ ] Step 7.16: Write `README.md` — description, live URL, tech stack, local setup, env var reference, API reference
  - *Acceptance Criteria:* A new developer can run the project locally following only the README
- [ ] Step 7.17: Write `docs/api-docs.md` — one section per endpoint with method, URL, auth, request/response schema, example pair
  - *Acceptance Criteria:* All endpoints from `docs/api-schema.md` have a complete entry
- [ ] Step 7.18: Write `docs/user-guide.md` — plain-English guide for non-technical users covering all 5 core flows
  - *Acceptance Criteria:* A non-technical tester can complete all core flows using only the user guide

---

## Progress Tracker

| Phase | Name | Week | Tasks | Done | Status |
|---|---|---|---|---|---|
| Phase 0 | Project Setup & Research | 1 | 16 | 16 | `complete` |
| Phase 1 | Core Parser + API Foundation | 2 | 14 | 14 | `complete` |
| Phase 2 | Summarization Engine | 3 | 9 | 9 | `complete` |
| Phase 3 | Reply Drafter Module | 4 | 8 | 8 | `complete` |
| Phase 4 | Daily Brief + Multi-File | 5 | 8 | 0 | `not_started` |
| Phase 5 | Authentication + History | 6 | 12 | 0 | `not_started` |
| Phase 6 | UI Polish + PDF Export | 7 | 12 | 0 | `not_started` |
| Phase 7 | Testing + Deployment | 8 | 18 | 0 | `not_started` |
| **TOTAL** | | **8 weeks** | **97** | **47** | **48% complete** |

---

*Bidirectionally linked to `WhatsApp_Summarizer_Project_Plan.md`. Both files must be updated together when scope changes. Last updated: 2026-05-13.*
