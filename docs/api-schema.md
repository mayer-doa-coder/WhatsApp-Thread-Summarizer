# API Schema — WhatsApp Thread Summarizer

> REST API contract for all 7 endpoints. Backend base URL: `http://localhost:4000` (development) / `https://api.your-domain.com` (production).
>
> **Auth header (protected routes):** `Authorization: Bearer <jwt_token>`

---

## Global Limits

| Constraint | Value |
|---|---|
| JSON body max size | 2 MB |
| Multipart form max total payload | 52 MB |
| Max concurrent requests per IP | 20 |
| Response compression | gzip (auto, all JSON responses ≥ 1 KB) |

### Rate Limits by Endpoint Group

| Endpoint Group | Window | Max Requests | Burst |
|---|---|---|---|
| `/api/upload`, `/api/brief` | 1 minute | 10 | 3 |
| `/api/summarize` | 1 minute | 20 | 5 |
| `/api/reply` | 1 minute | 30 | 8 |
| `/api/auth/register` | 15 minutes | 5 | 2 |
| `/api/auth/login` | 15 minutes | 10 | 3 |
| `/api/history` (GET/POST/DELETE) | 1 minute | 60 | 15 |

Rate-limit headers returned on every response:

```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 17
X-RateLimit-Reset: 1705356120
```

---

## Endpoint Index

| # | Method | Path | Auth | Description |
|---|---|---|---|---|
| 1 | `POST` | `/api/upload` | No | Parse uploaded `.txt` WhatsApp export(s) |
| 2 | `POST` | `/api/summarize` | No | Summarize a parsed message array |
| 3 | `POST` | `/api/reply` | No | Draft reply options for a message context |
| 4 | `POST` | `/api/brief` | No | Generate a Daily Brief from multiple files |
| 5 | `POST` | `/api/auth/register` | No | Register a new user account |
| 6 | `POST` | `/api/auth/login` | No | Authenticate and receive a JWT |
| 7 | `GET` / `POST` / `DELETE` | `/api/history` | Yes | List, save, or delete saved summaries |

---

## 1. `POST /api/upload`

Parse one or more WhatsApp `.txt` export files into structured message arrays.

### Request

- **Content-Type:** `multipart/form-data`
- **Field name:** `files` (single file) or `files[]` (up to 10 files)
- **Per-file constraints:** MIME type `text/plain`, UTF-8 or UTF-16 encoding, max **5 MB** each
- **Total payload cap:** 50 MB across all files in one request
- **Max files per request:** 10

#### Optional form fields

| Field | Type | Default | Description |
|---|---|---|---|
| `maxMessages` | `number` | `null` (no limit) | Truncate parsed output to the most recent N messages (1–50 000) |
| `partial` | `boolean` | `false` | If `true`, return a partial result instead of erroring when some lines fail to parse |
| `stripMedia` | `boolean` | `false` | If `true`, omit messages where `type = "media"` from the output |
| `stripSystem` | `boolean` | `false` | If `true`, omit messages where `type = "system"` from the output |
| `language` | `string` | `null` | BCP 47 language hint (e.g. `"en"`, `"es"`, `"pt-BR"`) used to resolve ambiguous date formats |

```
POST /api/upload
Content-Type: multipart/form-data

files[]: <binary .txt file 1>
files[]: <binary .txt file 2>
maxMessages: 5000
partial: true
language: en
```

### Success Response `200 OK`

```json
{
  "files": [
    {
      "filename": "chat-alice.txt",
      "sizeBytes": 204800,
      "encoding": "utf-8",
      "messageCount": 247,
      "truncated": false,
      "parseWarnings": [],
      "participants": ["Alice", "Bob", "Carol"],
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

**`type` enum values:** `"text"` | `"media"` | `"system"` | `"deleted"`

`truncated` is `true` when `maxMessages` caused the output to be shorter than the full file.

`parseWarnings` is an array of strings describing non-fatal parse issues (e.g. unrecognized timestamp on line 42).

### Error Responses

| Status | Code | Condition |
|---|---|---|
| `400 Bad Request` | `NO_FILES` | No files included in the request |
| `400 Bad Request` | `NO_MESSAGES` | File parsed but contained 0 valid messages |
| `400 Bad Request` | `TOO_MANY_FILES` | More than 10 files uploaded at once |
| `400 Bad Request` | `INVALID_MAX_MESSAGES` | `maxMessages` is not an integer in 1–50 000 |
| `400 Bad Request` | `UNSUPPORTED_ENCODING` | File is not UTF-8 or UTF-16 |
| `413 Payload Too Large` | `FILE_TOO_LARGE` | Any single file exceeds 5 MB |
| `413 Payload Too Large` | `TOTAL_PAYLOAD_TOO_LARGE` | Combined file payload exceeds 50 MB |
| `415 Unsupported Media Type` | `INVALID_FILE_TYPE` | File MIME type is not `text/plain` |
| `422 Unprocessable Entity` | `PARSE_ERROR` | File is valid text but cannot be parsed as a WhatsApp export (only when `partial: false`) |

```json
{
  "error": true,
  "code": "FILE_TOO_LARGE",
  "message": "File 'chat.txt' exceeds the 5 MB limit (received 6.2 MB)."
}
```

---

## 2. `POST /api/summarize`

Generate a structured AI summary from a parsed message array.

### Request

- **Content-Type:** `application/json`
- **Body max size:** 2 MB

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
  "filename": "chat-alice.txt",
  "focusOn": "all",
  "language": "en",
  "participants": ["Alice", "Bob"],
  "maxMessages": 3000,
  "includeQuotes": false
}
```

| Field | Type | Required | Constraints | Default |
|---|---|---|---|---|
| `messages` | `Message[]` | Yes | 1–10 000 messages | — |
| `summaryType` | `string` | No | `"short"` \| `"medium"` \| `"detailed"` \| `"bullets"` | `"medium"` |
| `filename` | `string` | No | Max 255 chars | `null` |
| `focusOn` | `string` | No | `"tasks"` \| `"decisions"` \| `"sentiment"` \| `"topics"` \| `"all"` | `"all"` |
| `language` | `string` | No | BCP 47 code — output language for the summary | `"en"` |
| `participants` | `string[]` | No | Filter messages to only these senders; max 20 names | `null` (all) |
| `maxMessages` | `number` | No | Truncate input to most recent N messages (1–10 000) before summarizing | `null` |
| `includeQuotes` | `boolean` | No | If `true`, include 1–2 verbatim message quotes per key decision | `false` |

**`summaryType` descriptions:**
- `"short"` — 2–3 sentence overview only
- `"medium"` — all 6 fields, concise bullets
- `"detailed"` — all 6 fields, expanded explanations, key quotes if `includeQuotes: true`
- `"bullets"` — flattened single bullet list, no sections

### Success Response `200 OK`

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
      "Bob: Share API spec draft in this group by Wednesday",
      "Carol: Book meeting room for Thursday standup"
    ],
    "notableFacts": [
      "Team agreed to use React with TypeScript.",
      "Deadline is March 15th — non-negotiable per management."
    ],
    "summaryText": "The team held a planning session for Q1. Alice was assigned frontend lead, Bob is drafting the API spec, and Carol is handling logistics. The deadline of March 15th was confirmed as firm.",
    "sentiment": "neutral",
    "dominantTopics": ["sprint planning", "task assignment", "deadline"]
  },
  "model": "Llama-4-Maverick-17B-128E-Instruct",
  "processingMs": 3240,
  "inputMessages": 47,
  "truncated": false
}
```

`sentiment` is present when `focusOn` includes `"sentiment"` or `"all"`: `"positive"` | `"neutral"` | `"negative"` | `"mixed"`.

`dominantTopics` is present when `focusOn` is `"topics"` or `"all"`: top 3 topic strings.

### Error Responses

| Status | Code | Condition |
|---|---|---|
| `400 Bad Request` | `MISSING_MESSAGES` | `messages` field is absent or empty array |
| `400 Bad Request` | `TOO_MANY_MESSAGES` | `messages` array contains more than 10 000 items |
| `400 Bad Request` | `INVALID_SUMMARY_TYPE` | `summaryType` not one of the accepted values |
| `400 Bad Request` | `INVALID_FOCUS` | `focusOn` not one of the accepted values |
| `400 Bad Request` | `INVALID_LANGUAGE` | `language` is not a valid BCP 47 code |
| `400 Bad Request` | `TOO_MANY_PARTICIPANTS` | `participants` array has more than 20 entries |
| `429 Too Many Requests` | `LLM_RATE_LIMITED` | All configured LLM providers returned 429 |
| `502 Bad Gateway` | `LLM_ERROR` | All LLM providers returned 5xx errors |
| `504 Gateway Timeout` | `LLM_TIMEOUT` | LLM call did not respond within **30 seconds** |

```json
{
  "error": true,
  "code": "LLM_RATE_LIMITED",
  "message": "All AI providers are currently rate-limited. Please retry in 30 seconds.",
  "retryAfterSeconds": 30
}
```

---

## 3. `POST /api/reply`

Generate contextual reply drafts in different tones for the last N messages of a conversation.

### Request

- **Content-Type:** `application/json`
- **Body max size:** 512 KB

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
  "language": "en",
  "tones": ["formal", "casual", "concise", "empathetic"]
}
```

| Field | Type | Required | Constraints | Default |
|---|---|---|---|---|
| `messages` | `Message[]` | Yes | 1–100 messages | — |
| `tone` | `string` | No | `"formal"` \| `"casual"` \| `"concise"` \| `"empathetic"` \| `"apologetic"` \| `"assertive"` | `"casual"` |
| `tones` | `string[]` | No | Override per-reply tone assignment; length must equal `count`; max 5 entries | Derived from `tone` |
| `userIntent` | `string` | No | Free-text refinement instruction; max 400 chars | `null` |
| `count` | `number` | No | Number of reply options to generate (1–5) | `3` |
| `maxWordsPerReply` | `number` | No | Soft word-count ceiling per reply option (10–200) | `80` |
| `language` | `string` | No | BCP 47 — output language for drafts | `"en"` |
| `includeEmoji` | `boolean` | No | Allow emoji in casual/empathetic replies | `true` |

**Available tones:**
- `"formal"` — no contractions, professional register
- `"casual"` — natural, conversational
- `"concise"` — under 20 words, direct
- `"empathetic"` — acknowledges the other person's feelings
- `"apologetic"` — leads with an apology or acknowledgement of delay
- `"assertive"` — confident, no hedging

When `tones` is provided it takes precedence over `tone`. Example: `"tones": ["formal", "casual", "empathetic"]` produces one reply in each of those three tones.

### Success Response `200 OK`

```json
{
  "options": [
    {
      "tone": "formal",
      "text": "Yes, I will be attending the call at 3 PM. Please note that I may be approximately five minutes late.",
      "wordCount": 19
    },
    {
      "tone": "casual",
      "text": "Yeah, I'll be there! Might be like 5 mins late though, heads up 😅",
      "wordCount": 14
    },
    {
      "tone": "concise",
      "text": "Yes, joining — 5 min late.",
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
| `400 Bad Request` | `MISSING_MESSAGES` | `messages` is absent or empty |
| `400 Bad Request` | `TOO_MANY_MESSAGES` | `messages` array contains more than 100 items |
| `400 Bad Request` | `INVALID_TONE` | `tone` is not one of the accepted values |
| `400 Bad Request` | `INVALID_TONES` | Any entry in `tones` is not an accepted value, or `tones.length ≠ count` |
| `400 Bad Request` | `INVALID_COUNT` | `count` is not an integer in 1–5 |
| `400 Bad Request` | `INTENT_TOO_LONG` | `userIntent` exceeds 400 characters |
| `400 Bad Request` | `INVALID_MAX_WORDS` | `maxWordsPerReply` is not in 10–200 |
| `429 Too Many Requests` | `LLM_RATE_LIMITED` | All providers rate-limited |
| `502 Bad Gateway` | `LLM_ERROR` | All providers returned 5xx |
| `504 Gateway Timeout` | `LLM_TIMEOUT` | LLM call did not respond within **20 seconds** |

---

## 4. `POST /api/brief`

Upload multiple `.txt` files, summarize each, then compose an aggregated Daily Brief.

### Request

- **Content-Type:** `multipart/form-data`
- **Field name:** `files[]` (1–10 files)
- **Per-file constraints:** MIME type `text/plain`, max 5 MB each
- **Total payload cap:** 50 MB

#### Optional form fields

| Field | Type | Default | Description |
|---|---|---|---|
| `summaryType` | `string` | `"medium"` | Default summary depth for all chats: `"short"` \| `"medium"` \| `"detailed"` |
| `summaryTypes` | `string` | `null` | JSON-encoded object mapping filenames to individual summary depths, e.g. `{"work.txt":"detailed","family.txt":"short"}` |
| `prioritize` | `string` | `null` | Filename to feature first in `chatCards` |
| `excludeChats` | `string` | `null` | JSON-encoded array of filenames to parse but omit from the brief narrative |
| `focusOn` | `string` | `"all"` | `"tasks"` \| `"decisions"` \| `"topics"` \| `"all"` — applies to all chat summaries |
| `language` | `string` | `"en"` | BCP 47 output language for the brief |
| `maxMessagesPerFile` | `number` | `null` | Truncate each file to most recent N messages before summarizing (1–10 000) |
| `crossChatInsights` | `boolean` | `true` | If `false`, skip the cross-chat analysis step (faster) |

```
POST /api/brief
Content-Type: multipart/form-data

files[]: <binary .txt file 1>
files[]: <binary .txt file 2>
summaryType: medium
prioritize: work-team.txt
crossChatInsights: true
language: en
```

### Success Response `200 OK`

```json
{
  "brief": {
    "generatedAt": "2024-01-15T20:00:00.000Z",
    "overviewParagraph": "Today's conversations covered project planning, a family dinner coordination, and a client follow-up. Three action items require attention before tomorrow morning.",
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
        "summaryText": "Team finalized Q1 sprint assignments and confirmed March 15th deadline."
      }
    ],
    "crossChatInsights": [
      "Alice is mentioned in both the work chat and the family chat — she may need to coordinate schedules.",
      "Two separate conversations reference a 'Friday deadline' — likely the same event."
    ],
    "keyPeople": ["Alice", "Bob", "Carol", "David"],
    "totalActionItems": [
      "Alice: Set up CI/CD pipeline by Friday",
      "Bob: Share API spec draft by Wednesday"
    ],
    "filesProcessed": 3,
    "filesExcluded": 0
  },
  "model": "Llama-4-Maverick-17B-128E-Instruct",
  "processingMs": 14200
}
```

### Error Responses

| Status | Code | Condition |
|---|---|---|
| `400 Bad Request` | `NO_FILES` | No files included |
| `400 Bad Request` | `TOO_MANY_FILES` | More than 10 files uploaded |
| `400 Bad Request` | `INVALID_FILE_TYPE` | Any file is not `text/plain` |
| `400 Bad Request` | `INVALID_SUMMARY_TYPE` | Any resolved `summaryType` is not an accepted value |
| `400 Bad Request` | `INVALID_FOCUS` | `focusOn` not one of the accepted values |
| `400 Bad Request` | `INVALID_SUMMARY_TYPES_JSON` | `summaryTypes` field is not valid JSON |
| `413 Payload Too Large` | `FILE_TOO_LARGE` | Any file exceeds 5 MB |
| `413 Payload Too Large` | `TOTAL_PAYLOAD_TOO_LARGE` | Combined payload exceeds 50 MB |
| `429 Too Many Requests` | `LLM_RATE_LIMITED` | All providers rate-limited |
| `504 Gateway Timeout` | `BRIEF_TIMEOUT` | Total processing exceeded **30 seconds** |

```json
{
  "error": true,
  "code": "BRIEF_TIMEOUT",
  "message": "Daily Brief generation timed out after 30 seconds. Try fewer files, smaller chats, or summaryType 'short'."
}
```

---

## 5. `POST /api/auth/register`

Create a new user account.

### Request

- **Content-Type:** `application/json`

```json
{
  "email": "user@example.com",
  "password": "mySecurePass123",
  "displayName": "Alice"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `email` | `string` | Yes | Valid RFC 5321 email format; max 254 chars |
| `password` | `string` | Yes | 8–128 characters; must contain ≥ 1 letter and ≥ 1 digit |
| `displayName` | `string` | No | 1–50 characters; no leading/trailing whitespace |

**Password rules:**
- Minimum 8 characters
- Maximum 128 characters
- Must contain at least one letter (a–z or A–Z)
- Must contain at least one digit (0–9)
- Unicode characters are permitted

### Success Response `201 Created`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 1800,
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "displayName": "Alice",
    "plan": "free",
    "createdAt": "2024-01-15T20:00:00.000Z"
  }
}
```

**Token lifetimes:** `token` expires in 1800 s (30 min). `refreshToken` expires in 604 800 s (7 days).

### Error Responses

| Status | Code | Condition |
|---|---|---|
| `409 Conflict` | `EMAIL_TAKEN` | An account with this email already exists |
| `422 Unprocessable Entity` | `INVALID_EMAIL` | Email fails format validation |
| `422 Unprocessable Entity` | `PASSWORD_TOO_SHORT` | Password is fewer than 8 characters |
| `422 Unprocessable Entity` | `PASSWORD_TOO_LONG` | Password exceeds 128 characters |
| `422 Unprocessable Entity` | `PASSWORD_TOO_WEAK` | Password lacks a required character class (letter or digit) |
| `422 Unprocessable Entity` | `DISPLAY_NAME_INVALID` | `displayName` is empty, too long, or has leading/trailing whitespace |
| `429 Too Many Requests` | `REGISTER_RATE_LIMITED` | 5 registration attempts in 15 minutes from this IP |

```json
{
  "error": true,
  "code": "EMAIL_TAKEN",
  "message": "An account with this email address already exists."
}
```

---

## 6. `POST /api/auth/login`

Authenticate an existing user and receive a JWT.

### Request

- **Content-Type:** `application/json`

```json
{
  "email": "user@example.com",
  "password": "mySecurePass123"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `email` | `string` | Yes | Max 254 chars |
| `password` | `string` | Yes | Max 128 chars |

### Success Response `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 1800,
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "displayName": "Alice",
    "plan": "free",
    "createdAt": "2024-01-15T20:00:00.000Z"
  }
}
```

### Error Responses

| Status | Code | Condition |
|---|---|---|
| `401 Unauthorized` | `INVALID_CREDENTIALS` | Email not found or password does not match |
| `422 Unprocessable Entity` | `MISSING_FIELDS` | `email` or `password` is absent |
| `429 Too Many Requests` | `LOGIN_RATE_LIMITED` | 10 login attempts in 15 minutes from this IP |

```json
{
  "error": true,
  "code": "INVALID_CREDENTIALS",
  "message": "Email or password is incorrect."
}
```

> **Security note:** Both "email not found" and "wrong password" return the same `INVALID_CREDENTIALS` code to prevent user enumeration.

---

## 6b. `POST /api/auth/refresh`

Exchange a valid refresh token for a new access token without re-authenticating.

### Request

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Success Response `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 1800
}
```

### Error Responses

| Status | Code | Condition |
|---|---|---|
| `401 Unauthorized` | `INVALID_REFRESH_TOKEN` | Token is malformed or not found |
| `403 Forbidden` | `REFRESH_TOKEN_EXPIRED` | Refresh token is older than 7 days |

---

## 7. `GET | POST | DELETE /api/history`

Manage saved summaries for the authenticated user.

> **All three methods require:** `Authorization: Bearer <jwt_token>`

---

### `GET /api/history` — List saved summaries

#### Request

```
GET /api/history
Authorization: Bearer <token>
```

Query parameters:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `type` | `string` | `null` | Filter by `"thread"` \| `"brief"` |
| `limit` | `number` | `50` | Max results (1–200) |
| `offset` | `number` | `0` | Pagination offset |
| `search` | `string` | `null` | Case-insensitive substring match against `filename` and `summaryText`; max 100 chars |
| `sortBy` | `string` | `"createdAt"` | `"createdAt"` \| `"filename"` \| `"messageCount"` |
| `sortOrder` | `string` | `"desc"` | `"asc"` \| `"desc"` |
| `fromDate` | `string` | `null` | ISO 8601 date — return only summaries created on or after this date |
| `toDate` | `string` | `null` | ISO 8601 date — return only summaries created on or before this date |

#### Success Response `200 OK`

```json
{
  "summaries": [
    {
      "id": "uuid-v4",
      "filename": "work-team.txt",
      "type": "thread",
      "summaryText": "Team finalized Q1 sprint assignments...",
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

#### Request

- **Content-Type:** `application/json`

```json
{
  "filename": "work-team.txt",
  "summaryText": "Team finalized Q1 sprint assignments and confirmed deadline.",
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
| `filename` | `string` | Yes | Max 255 chars |
| `summaryText` | `string` | Yes | Max 10 000 chars |
| `type` | `string` | Yes | `"thread"` \| `"brief"` |
| `messageCount` | `number` | No | Non-negative integer |
| `participants` | `string[]` | No | Max 50 entries, each max 100 chars |
| `dateRange` | `object` | No | `{ from: ISO8601, to: ISO8601 }` |

#### Success Response `201 Created`

```json
{
  "id": "uuid-v4",
  "filename": "work-team.txt",
  "type": "thread",
  "createdAt": "2024-01-15T20:05:00.000Z"
}
```

---

### `DELETE /api/history/:id` — Delete a saved summary

#### Request

```
DELETE /api/history/uuid-v4
Authorization: Bearer <token>
```

#### Success Response `200 OK`

```json
{
  "deleted": true,
  "id": "uuid-v4"
}
```

---

### `DELETE /api/history` — Bulk delete (optional body)

Delete multiple summaries in one request.

#### Request

```json
{
  "ids": ["uuid-v4-1", "uuid-v4-2", "uuid-v4-3"]
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `ids` | `string[]` | Yes | 1–50 summary IDs |

#### Success Response `200 OK`

```json
{
  "deleted": 3,
  "ids": ["uuid-v4-1", "uuid-v4-2", "uuid-v4-3"],
  "failed": []
}
```

`failed` lists any IDs that could not be deleted (not found or belonged to another user).

---

### Shared Error Responses for `/api/history`

| Status | Code | Condition |
|---|---|---|
| `401 Unauthorized` | `MISSING_TOKEN` | No `Authorization` header present |
| `401 Unauthorized` | `INVALID_TOKEN` | Token is malformed or signature invalid |
| `403 Forbidden` | `TOKEN_EXPIRED` | JWT has passed its 30-minute expiry |
| `403 Forbidden` | `FORBIDDEN` | Summary exists but belongs to a different user (IDOR protection) |
| `404 Not Found` | `NOT_FOUND` | No summary with the given ID exists |
| `422 Unprocessable Entity` | `MISSING_FIELDS` | Required fields absent in POST body |
| `422 Unprocessable Entity` | `SUMMARY_TEXT_TOO_LONG` | `summaryText` exceeds 10 000 chars |
| `422 Unprocessable Entity` | `INVALID_DATE_RANGE` | `fromDate` is after `toDate`, or either is not a valid ISO 8601 date |
| `422 Unprocessable Entity` | `INVALID_BULK_IDS` | `ids` is absent, empty, or exceeds 50 entries |

```json
{
  "error": true,
  "code": "TOKEN_EXPIRED",
  "message": "Your session has expired. Please log in again."
}
```

---

## Standard Error Envelope

All error responses follow this envelope regardless of endpoint:

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

## Health Check

```
GET /api/health
```

No authentication required.

**Response `200 OK`:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T20:00:00.000Z",
  "version": "1.0.0",
  "llmProviders": {
    "sambanova": "up",
    "cerebras": "up",
    "google": "up"
  }
}
```

---

*Last updated: 2026-05-13 | Linked to [execution_plan.md](../execution_plan.md) Step 0.13*
