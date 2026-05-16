# API Reference — WhatsApp Thread Summarizer

All endpoints are prefixed with the backend base URL:

- **Development:** `http://localhost:4000`
- **Production:** set by deployment (see `REACT_APP_API_URL` in frontend `.env`)

**Authentication:** Protected routes require `Authorization: Bearer <token>` in the request header. Tokens are issued by `/api/auth/register` and `/api/auth/login`.

---

## Endpoint Index

| # | Method | Path | Auth | Description |
|---|---|---|---|---|
| — | `GET` | `/api/health` | No | Server health check |
| 1 | `POST` | `/api/upload` | No | Parse WhatsApp `.txt` export(s) |
| 2 | `POST` | `/api/summarize` | No | Summarize a parsed message array via LLM |
| 3 | `POST` | `/api/reply` | No | Draft reply options for a conversation |
| 4 | `POST` | `/api/brief` | No | Generate a Daily Brief from multiple files |
| 5 | `POST` | `/api/auth/register` | No | Create a new account |
| 6 | `POST` | `/api/auth/login` | No | Authenticate and receive a JWT |
| 7 | `GET` | `/api/history` | Yes | List saved summaries |
| 7 | `POST` | `/api/history` | Yes | Save a summary |
| 7 | `DELETE` | `/api/history/:id` | Yes | Delete a saved summary |
| 8 | `POST` | `/api/export/pdf` | Yes | Export a Daily Brief to PDF |

---

## Health Check

```
GET /api/health
```

No authentication required. Use this to verify the server is running.

**Response `200 OK`**

```json
{ "status": "ok" }
```

---

## 1. `POST /api/upload`

Parse one or more WhatsApp `.txt` export files into structured message arrays.

### Request

- **Content-Type:** `multipart/form-data`
- **Field name:** `files` (single file) or `files[]` (multiple, up to 10)
- **Per-file limit:** 5 MB, MIME type `text/plain`, UTF-8 or UTF-16
- **Total payload limit:** 50 MB

**Optional form fields**

| Field | Type | Default | Description |
|---|---|---|---|
| `maxMessages` | number | — | Truncate output to the most recent N messages (1–50 000) |
| `partial` | boolean | `false` | Return partial results instead of erroring on bad lines |
| `stripMedia` | boolean | `false` | Omit `type = "media"` messages from output |
| `stripSystem` | boolean | `false` | Omit `type = "system"` messages from output |
| `language` | string | — | BCP 47 hint (e.g. `"en"`, `"pt-BR"`) to resolve ambiguous date formats |

**Example**

```
POST /api/upload
Content-Type: multipart/form-data

files[]: <binary chat.txt>
maxMessages: 5000
partial: true
```

### Response `200 OK`

```json
{
  "files": [
    {
      "filename": "chat.txt",
      "sizeBytes": 204800,
      "encoding": "utf-8",
      "messageCount": 247,
      "truncated": false,
      "parseWarnings": [],
      "participants": ["Alice", "Bob"],
      "dateRange": {
        "from": "2024-01-15T09:00:00.000Z",
        "to": "2024-03-02T18:45:00.000Z"
      },
      "typeCounts": {
        "text": 231,
        "media": 12,
        "system": 3,
        "deleted": 1
      },
      "messages": [
        {
          "date": "15/01/2024",
          "time": "09:00:00",
          "timestamp": "2024-01-15T09:00:00.000Z",
          "sender": "Alice",
          "content": "Good morning everyone!",
          "type": "text"
        }
      ]
    }
  ]
}
```

`type` values: `"text"` | `"media"` | `"system"` | `"deleted"`

`truncated` is `true` when `maxMessages` shortened the output.

`parseWarnings` lists non-fatal issues (e.g. unrecognised timestamp on line 42).

### Error Responses

| Status | Code | Condition |
|---|---|---|
| `400` | `NO_FILES` | No files in request |
| `400` | `NO_MESSAGES` | File parsed but contained 0 valid messages |
| `400` | `TOO_MANY_FILES` | More than 10 files uploaded at once |
| `400` | `INVALID_MAX_MESSAGES` | `maxMessages` outside 1–50 000 |
| `400` | `UNSUPPORTED_ENCODING` | File is not UTF-8 or UTF-16 |
| `413` | `FILE_TOO_LARGE` | A single file exceeds 5 MB |
| `413` | `TOTAL_PAYLOAD_TOO_LARGE` | Combined files exceed 50 MB |
| `415` | `INVALID_FILE_TYPE` | File MIME type is not `text/plain` |
| `422` | `PARSE_ERROR` | Valid text but not a WhatsApp export (only when `partial: false`) |

---

## 2. `POST /api/summarize`

Generate a structured AI summary from a parsed message array.

### Request

- **Content-Type:** `application/json`

```json
{
  "messages": [
    {
      "timestamp": "2024-01-15T09:00:00.000Z",
      "sender": "Alice",
      "content": "Good morning everyone!",
      "type": "text"
    }
  ],
  "summaryType": "medium",
  "filename": "chat.txt",
  "focusOn": "all",
  "language": "en",
  "participants": ["Alice", "Bob"],
  "includeQuotes": false
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `messages` | `Message[]` | Yes | — | 1–10 000 messages from `/api/upload` |
| `summaryType` | string | No | `"medium"` | `"short"` \| `"medium"` \| `"detailed"` \| `"bullets"` |
| `filename` | string | No | — | Source filename, stored for display only |
| `focusOn` | string | No | `"all"` | `"tasks"` \| `"decisions"` \| `"sentiment"` \| `"topics"` \| `"all"` |
| `language` | string | No | `"en"` | BCP 47 — language for the summary output |
| `participants` | string[] | No | — | Filter to these senders only (max 20) |
| `maxMessages` | number | No | — | Truncate input before summarising (1–10 000) |
| `includeQuotes` | boolean | No | `false` | Include 1–2 verbatim quotes per key decision |

**`summaryType` descriptions:**
- `"short"` — 2–3 sentence overview only
- `"medium"` — all 6 fields, concise bullets
- `"detailed"` — all 6 fields with expanded explanations
- `"bullets"` — flat single bullet list, no section headers

### Response `200 OK`

```json
{
  "summary": {
    "topic": "Q1 project planning and task assignment",
    "participants": ["Alice", "Bob", "Carol"],
    "dateRange": {
      "from": "2024-01-15T09:00:00.000Z",
      "to": "2024-01-15T17:30:00.000Z"
    },
    "messageCount": 47,
    "keyDecisions": [
      "Alice will lead the frontend sprint starting Monday.",
      "Bob will draft the API spec by Wednesday."
    ],
    "actionItems": [
      "Alice: Set up CI/CD pipeline by Friday",
      "Bob: Share API spec draft by Wednesday"
    ],
    "notableFacts": [
      "Team agreed to use React with TypeScript.",
      "Deadline is March 15th — non-negotiable per management."
    ],
    "summaryText": "The team held a planning session for Q1. Alice was assigned frontend lead and Bob is drafting the API spec. The March 15th deadline was confirmed as firm.",
    "sentiment": "neutral",
    "dominantTopics": ["sprint planning", "task assignment", "deadline"]
  },
  "model": "Llama-4-Maverick-17B-128E-Instruct",
  "processingMs": 3240,
  "inputMessages": 47,
  "truncated": false
}
```

`sentiment` — present when `focusOn` includes `"sentiment"` or `"all"`: `"positive"` | `"neutral"` | `"negative"` | `"mixed"`

`dominantTopics` — present when `focusOn` is `"topics"` or `"all"`: top 3 topic strings

### Error Responses

| Status | Code | Condition |
|---|---|---|
| `400` | `MISSING_MESSAGES` | `messages` absent or empty |
| `400` | `TOO_MANY_MESSAGES` | More than 10 000 messages |
| `400` | `INVALID_SUMMARY_TYPE` | Unrecognised `summaryType` |
| `400` | `INVALID_FOCUS` | Unrecognised `focusOn` value |
| `400` | `INVALID_LANGUAGE` | Not a valid BCP 47 code |
| `400` | `TOO_MANY_PARTICIPANTS` | `participants` has more than 20 entries |
| `429` | `LLM_RATE_LIMITED` | All LLM providers returned 429 |
| `502` | `LLM_ERROR` | All LLM providers returned 5xx |
| `504` | `LLM_TIMEOUT` | LLM did not respond within 30 seconds |

---

## 3. `POST /api/reply`

Generate contextual reply drafts in different tones.

### Request

- **Content-Type:** `application/json`

```json
{
  "messages": [
    {
      "sender": "Bob",
      "content": "Are you joining the call at 3pm?",
      "timestamp": "2024-01-15T14:45:00.000Z"
    }
  ],
  "tone": "casual",
  "userIntent": "I want to say yes but mention I might be 5 minutes late",
  "count": 3,
  "maxWordsPerReply": 60,
  "language": "en"
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `messages` | `Message[]` | Yes | — | 1–100 recent messages for context |
| `tone` | string | No | `"casual"` | `"formal"` \| `"casual"` \| `"concise"` \| `"empathetic"` \| `"apologetic"` \| `"assertive"` |
| `tones` | string[] | No | — | Per-reply tone override; length must equal `count`; takes precedence over `tone` |
| `userIntent` | string | No | — | Free-text instruction to refine the reply (max 400 chars) |
| `count` | number | No | `3` | Number of reply options to generate (1–5) |
| `maxWordsPerReply` | number | No | `80` | Soft word-count cap per reply (10–200) |
| `language` | string | No | `"en"` | BCP 47 — output language for drafts |
| `includeEmoji` | boolean | No | `true` | Allow emoji in casual/empathetic replies |

### Response `200 OK`

```json
{
  "options": [
    {
      "tone": "formal",
      "text": "Yes, I will be attending the 3 PM call. Please note I may be approximately five minutes late.",
      "wordCount": 17
    },
    {
      "tone": "casual",
      "text": "Yeah, I'll be there! Might be like 5 mins late though 😅",
      "wordCount": 12
    },
    {
      "tone": "concise",
      "text": "Yes — joining, 5 min late.",
      "wordCount": 5
    }
  ],
  "model": "Llama-4-Maverick-17B-128E-Instruct",
  "processingMs": 1820
}
```

### Error Responses

| Status | Code | Condition |
|---|---|---|
| `400` | `MISSING_MESSAGES` | `messages` absent or empty |
| `400` | `TOO_MANY_MESSAGES` | More than 100 messages |
| `400` | `INVALID_TONE` | Unrecognised `tone` value |
| `400` | `INVALID_TONES` | Entry in `tones` unrecognised, or length ≠ `count` |
| `400` | `INVALID_COUNT` | `count` outside 1–5 |
| `400` | `INTENT_TOO_LONG` | `userIntent` exceeds 400 characters |
| `400` | `INVALID_MAX_WORDS` | `maxWordsPerReply` outside 10–200 |
| `429` | `LLM_RATE_LIMITED` | All providers rate-limited |
| `502` | `LLM_ERROR` | All providers returned 5xx |
| `504` | `LLM_TIMEOUT` | LLM did not respond within 20 seconds |

---

## 4. `POST /api/brief`

Upload multiple `.txt` files, summarise each, and compose an aggregated Daily Brief.

### Request

- **Content-Type:** `multipart/form-data`
- **Field name:** `files[]` (1–10 files)
- **Per-file limit:** 5 MB, MIME type `text/plain`
- **Total payload limit:** 50 MB

**Optional form fields**

| Field | Type | Default | Description |
|---|---|---|---|
| `summaryType` | string | `"medium"` | Default depth for all chats: `"short"` \| `"medium"` \| `"detailed"` |
| `summaryTypes` | string | — | JSON object mapping filenames to individual depths, e.g. `{"work.txt":"detailed"}` |
| `prioritize` | string | — | Filename to feature first in `chatCards` |
| `excludeChats` | string | — | JSON array of filenames to omit from the brief narrative |
| `focusOn` | string | `"all"` | `"tasks"` \| `"decisions"` \| `"topics"` \| `"all"` |
| `language` | string | `"en"` | BCP 47 output language |
| `maxMessagesPerFile` | number | — | Truncate each file to most recent N messages (1–10 000) |
| `crossChatInsights` | boolean | `true` | Set `false` to skip cross-chat analysis (faster) |

### Response `200 OK`

```json
{
  "brief": {
    "generatedAt": "2024-01-15T20:00:00.000Z",
    "overviewParagraph": "Today's conversations covered project planning, a family dinner, and a client follow-up. Three action items require attention before tomorrow morning.",
    "chatCards": [
      {
        "filename": "work-team.txt",
        "topic": "Q1 sprint planning",
        "participants": ["Alice", "Bob", "Carol"],
        "messageCount": 47,
        "dateRange": {
          "from": "2024-01-15T08:00:00.000Z",
          "to": "2024-01-15T17:00:00.000Z"
        },
        "actionItems": ["Alice: Set up CI/CD by Friday"],
        "keyDecisions": ["Adopted React + TypeScript for the frontend."],
        "sentiment": "positive",
        "summaryText": "Team finalised Q1 sprint assignments and confirmed the March 15th deadline."
      }
    ],
    "crossChatInsights": [
      "Alice appears in both the work and family chats — she may need to coordinate schedules.",
      "Two conversations reference a 'Friday deadline' — likely the same event."
    ],
    "keyPeople": ["Alice", "Bob", "Carol"],
    "totalActionItems": [
      "Alice: Set up CI/CD pipeline by Friday",
      "Bob: Share API spec draft by Wednesday"
    ],
    "filesProcessed": 2,
    "filesExcluded": 0
  },
  "model": "Llama-4-Maverick-17B-128E-Instruct",
  "processingMs": 14200
}
```

### Error Responses

| Status | Code | Condition |
|---|---|---|
| `400` | `NO_FILES` | No files included |
| `400` | `TOO_MANY_FILES` | More than 10 files |
| `400` | `INVALID_FILE_TYPE` | Any file is not `text/plain` |
| `400` | `INVALID_SUMMARY_TYPE` | Unrecognised `summaryType` |
| `400` | `INVALID_FOCUS` | Unrecognised `focusOn` |
| `400` | `INVALID_SUMMARY_TYPES_JSON` | `summaryTypes` is not valid JSON |
| `413` | `FILE_TOO_LARGE` | Any file exceeds 5 MB |
| `413` | `TOTAL_PAYLOAD_TOO_LARGE` | Combined payload exceeds 50 MB |
| `429` | `LLM_RATE_LIMITED` | All providers rate-limited |
| `504` | `BRIEF_TIMEOUT` | Total processing exceeded 30 seconds |

---

## 5. `POST /api/auth/register`

Create a new user account. Returns a JWT on success.

### Request

- **Content-Type:** `application/json`

```json
{
  "email": "alice@example.com",
  "password": "SecurePass123!"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `email` | string | Yes | Valid email format, max 254 chars |
| `password` | string | Yes | 8–128 chars; must contain ≥ 1 letter and ≥ 1 digit |
| `displayName` | string | No | 1–50 chars, no leading/trailing whitespace |

### Response `201 Created`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-v4",
    "email": "alice@example.com"
  }
}
```

`token` — JWT access token, expires in 30 minutes. Include as `Authorization: Bearer <token>` on all protected requests.

### Error Responses

| Status | Code | Condition |
|---|---|---|
| `409` | `EMAIL_TAKEN` | Account with this email already exists |
| `422` | `INVALID_EMAIL` | Email fails format validation |
| `422` | `PASSWORD_TOO_SHORT` | Password fewer than 8 characters |
| `422` | `PASSWORD_TOO_LONG` | Password exceeds 128 characters |
| `422` | `PASSWORD_TOO_WEAK` | Missing required character class |
| `422` | `DISPLAY_NAME_INVALID` | `displayName` empty, too long, or has leading/trailing whitespace |
| `429` | `REGISTER_RATE_LIMITED` | 5 attempts in 15 minutes from this IP |

---

## 6. `POST /api/auth/login`

Authenticate an existing user and receive a JWT.

### Request

- **Content-Type:** `application/json`

```json
{
  "email": "alice@example.com",
  "password": "SecurePass123!"
}
```

| Field | Type | Required |
|---|---|---|
| `email` | string | Yes |
| `password` | string | Yes |

### Response `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-v4",
    "email": "alice@example.com"
  }
}
```

### Error Responses

| Status | Code | Condition |
|---|---|---|
| `401` | `INVALID_CREDENTIALS` | Email not found or password does not match |
| `422` | `MISSING_FIELDS` | `email` or `password` absent |
| `429` | `LOGIN_RATE_LIMITED` | 10 attempts in 15 minutes from this IP |

> Both "email not found" and "wrong password" return `INVALID_CREDENTIALS` to prevent user enumeration.

---

## 7. History Endpoints

All three history endpoints require `Authorization: Bearer <token>`.

---

### `GET /api/history` — List saved summaries

```
GET /api/history
Authorization: Bearer <token>
```

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `type` | string | — | Filter by `"thread"` or `"brief"` |
| `limit` | number | `50` | Max results (1–200) |
| `offset` | number | `0` | Pagination offset |
| `search` | string | — | Case-insensitive substring match against filename and summaryText (max 100 chars) |
| `sortBy` | string | `"createdAt"` | `"createdAt"` \| `"filename"` \| `"messageCount"` |
| `sortOrder` | string | `"desc"` | `"asc"` or `"desc"` |
| `fromDate` | string | — | ISO 8601 — return summaries created on or after this date |
| `toDate` | string | — | ISO 8601 — return summaries created on or before this date |

**Response `200 OK`**

```json
{
  "summaries": [
    {
      "id": "uuid-v4",
      "filename": "work-team.txt",
      "type": "thread",
      "summaryText": "Team finalised Q1 sprint assignments...",
      "messageCount": 47,
      "createdAt": "2024-01-15T20:00:00.000Z"
    }
  ],
  "total": 12,
  "limit": 50,
  "offset": 0,
  "hasMore": false
}
```

---

### `POST /api/history` — Save a summary

```
POST /api/history
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "filename": "work-team.txt",
  "summaryText": "Team finalised Q1 sprint assignments and confirmed deadline.",
  "type": "thread",
  "messageCount": 47,
  "participants": ["Alice", "Bob", "Carol"],
  "dateRange": {
    "from": "2024-01-15T08:00:00.000Z",
    "to": "2024-01-15T17:00:00.000Z"
  }
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `filename` | string | Yes | Max 255 chars |
| `summaryText` | string | Yes | Max 10 000 chars |
| `type` | string | Yes | `"thread"` or `"brief"` |
| `messageCount` | number | No | Non-negative integer |
| `participants` | string[] | No | Max 50 entries |
| `dateRange` | object | No | `{ from: ISO8601, to: ISO8601 }` |

**Response `201 Created`**

```json
{
  "summary": {
    "id": "uuid-v4",
    "filename": "work-team.txt",
    "type": "thread",
    "summaryText": "Team finalised Q1 sprint assignments and confirmed deadline.",
    "createdAt": "2024-01-15T20:05:00.000Z"
  }
}
```

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `400` | `MISSING_FIELDS` | `filename`, `summaryText`, or `type` absent |
| `422` | `SUMMARY_TEXT_TOO_LONG` | `summaryText` exceeds 10 000 chars |

---

### `DELETE /api/history/:id` — Delete a saved summary

```
DELETE /api/history/uuid-v4
Authorization: Bearer <token>
```

Ownership is verified before deletion. Attempting to delete another user's summary returns `403` and performs no database write.

**Response `204 No Content`**

No body.

**Error Responses**

| Status | Code | Condition |
|---|---|---|
| `403` | `Forbidden` | Summary exists but belongs to a different user |
| `404` | `NOT_FOUND` | No summary with the given ID exists |

---

### Shared Auth Errors (all `/api/history` routes)

| Status | Condition |
|---|---|
| `401` | No `Authorization` header present |
| `401` | Token is malformed or signature invalid |
| `403` | JWT has passed its 30-minute expiry |

---

## 8. `POST /api/export/pdf`

Export a Daily Brief to a downloadable PDF. Rendered by Puppeteer (headless Chromium) on the server.

### Request

- **Content-Type:** `application/json`
- **Auth required:** Yes

```json
{
  "date": "2024-01-15",
  "participants": ["Alice", "Bob", "Carol"],
  "summaries": [
    {
      "filename": "work-team.txt",
      "summaryText": "Team finalised Q1 sprint assignments."
    },
    {
      "filename": "family.txt",
      "summaryText": "Dinner planned for Saturday 7pm."
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `date` | string | No | Date label shown in the PDF header (e.g. `"2024-01-15"`) |
| `participants` | string[] | No | People to list in the PDF header |
| `summaries` | object[] | Yes | Array of `{ filename, summaryText }` objects |

### Response `200 OK`

Binary PDF stream.

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="daily-brief.pdf"
```

The response body is the raw PDF bytes. The frontend creates a blob URL and triggers a download.

### Error Responses

| Status | Condition |
|---|---|
| `400` | `summaries` absent or empty |
| `401` | Missing or invalid JWT |
| `500` | Puppeteer rendering failed |

---

## Standard Error Envelope

All error responses use this shape:

```json
{
  "error": true,
  "code": "MACHINE_READABLE_CODE",
  "message": "Human-readable description of what went wrong.",
  "retryAfterSeconds": 30
}
```

`retryAfterSeconds` is only present on `429` responses.

---

*Last updated: 2026-05-17 | Source: [docs/api-schema.md](./api-schema.md)*
