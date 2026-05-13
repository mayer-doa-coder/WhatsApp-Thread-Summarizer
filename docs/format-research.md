# WhatsApp Export Format Research

**Status:** Complete (Steps 0.8, 0.9, 0.10 done)
**Fixtures:** `docs/fixtures/`

---

## Fixture Files

### Parser Test Fixtures (Steps 0.8–0.10)

| File | Type | Format Variant |
|---|---|---|
| `ios-group.txt` | iOS Group — mock | iOS 12-hour AM/PM, M/D/YY, all message types |
| `ios-indiv.txt` | iOS Individual — mock | iOS 12-hour AM/PM, M/D/YY, 1:1 conversation |
| `android-indiv.txt` | Android Individual — mock | Android 24-hour, DD/MM/YYYY, no-timestamp header |

---

## Timestamp Format Variants

### iOS Group / Individual (observed in fixtures 1 & 2)

```
M/D/YY, H:MM AM|PM - Sender: Message
```

Examples:
```
3/29/24, 3:59 PM - Messages and calls are end-to-end encrypted...
4/1/24, 8:54 AM - +91 81144 17003: All the students are required to report...
3/8/25, 8:20 PM - Messages and calls are end-to-end encrypted...
```

- **Date:** Month/Day/2-digit-Year — no leading zeros
- **Time:** 12-hour with AM/PM — no leading zero on hour, no seconds
- **Separator:** ` - ` (space-dash-space)

### Android Individual (observed in fixture 3)

```
DD/MM/YYYY, HH:MM - Sender: Message
```

Examples:
```
09/03/2025, 09:15 - Pranjal: Hey, did you check the HackNx group?
14/03/2025, 18:30 - Tawhidul: Quick question - for the hackathon...
```

- **Date:** Day/Month/4-digit-Year — leading zeros on day and month
- **Time:** 24-hour — leading zero on hour, no seconds
- **Separator:** ` - ` (space-dash-space)

### Additional iOS Variants (not in fixtures, noted for completeness)

Some iOS locales export with brackets and seconds:
```
[D/M/YY, H:MM:SS AM|PM] Sender: Message
```

Some export with full 4-digit year:
```
M/D/YYYY, H:MM AM|PM - Sender: Message
```

---

## Sender Format Variants

| Variant | Example | Notes |
|---|---|---|
| Phone number | `+91 98281 97248` | Most common in groups with unknown contacts |
| Display name | `Love Kishore Sir "Mechanical"` | Saved contact name |
| Tilde prefix | `~ Dr Rahul Srivastava` | Contact not in phonebook (Android display) |
| System (no sender) | *(none)* | System messages, see below |

---

## Message Type Variants

### 1. Regular Text
```
3/30/24, 10:02 AM - +91 96723 53253: All the students are hereby informed...
```

### 2. Multi-line Message
Continuation lines have no timestamp prefix — they belong to the preceding message:
```
3/30/24, 10:43 AM - +91 98281 97248: Following students not present in second class

1. Gaurav
2. Jangid vinaykumar
3. Jitendra jat
```

### 3. Media Omitted
```
3/30/24, 11:06 AM - +91 96723 53253: <Media omitted>
```

### 4. Deleted Message
```
4/1/24, 3:18 PM - Love Kishore Sir "Mechanical": This message was deleted
```

### 5. Edited Message
```
9/3/24, 9:22 AM - +91 82093 33973: ... link ... <This message was edited>
```
The `<This message was edited>` marker appears at the end of the message body.

### 6. System Messages (no sender)
These lines have no ` - Sender:` part — just a timestamp followed by a system event:
```
3/29/24, 3:59 PM - Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them. Learn more.
4/1/24, 11:22 AM - ~ Pramod Kumar added ~ RK
7/6/24, 2:11 PM - ~ Dr Rahul Srivastava changed the group name from "B.Tech 3 rd semester ECE-A" to "ECE A 3 rd semester"
3/8/25, 8:26 PM - pranjal Bhayya Senior added ~ Narendra
3/8/25, 8:36 PM - +91 90575 73915 joined using this group's invite link
```

### 7. Null Content
```
4/22/24, 4:58 PM - +91 98281 97248: null
```
Occasionally exported with literal `null` as message body.

### 8. Pinned Message (system)
```
9/29/24, 10:04 PM - Jayesh Gurjar Classmate pinned a message
```

---

## Header Line

The first real content line (before any messages) is the encryption notice:
```
Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them. Learn more.
```
On iOS this appears with a timestamp; on some exports it appears without one.

---

## Regex Pattern for Message Start Detection

Matches both iOS and Android timestamp formats:

```regex
^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s+-\s+(.+?):\s+(.*)$
```

Groups:
1. Date (`3/29/24` or `09/03/2025`)
2. Time (`3:59 PM` or `09:15`)
3. Sender (`+91 96723 53253` or `Pranjal`)
4. Message body (first line only; continuation lines follow)

System message pattern (no sender colon):
```regex
^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s+-\s+(?!.*:\s)(.+)$
```

---
## Step 0.10 — Regex Test Results
### ios-group.txt — PASS
| Kind | Count |
|---|---|
| message | 142 |
| system | 9 |
| continuation | 57 |
| blank | 0 |
| header | 0 |
| **total** | 208 |

### ios-indiv.txt — PASS
| Kind | Count |
|---|---|
| message | 123 |
| system | 1 |
| continuation | 48 |
| blank | 0 |
| header | 0 |
| **total** | 172 |

### android-indiv.txt — PASS
| Kind | Count |
|---|---|
| message | 97 |
| system | 0 |
| continuation | 46 |
| blank | 1 |
| header | 1 |
| **total** | 145 |

**Overall result: PASS — 0 unresolved failures across all 3 fixture files.**

---

## LLM API Comparison (Steps 0.11–0.12)

**Test harness:** `docs/llm-comparison/test-runner.js`
**Visual report:** `docs/llm-comparison/results/report.html`
**Raw data:** `docs/llm-comparison/results/comparison-results.json`
**Fixtures tested:** all 3 (android-indiv.txt, ios-group.txt, ios-indiv.txt)

### Scoring Methodology

Each model response is scored out of 10:
- +1 per required JSON field present and non-empty (6 fields = 6 pts max)
- +2 if `summaryText` ≥ 50 words; +1 if ≥ 25 words
- +1 if `keyDecisions` array has ≥ 1 item
- +1 if `actionItems` array has ≥ 1 item

### Results (8 reliable models, 3 fixtures each)

| Model | Provider | Avg Score | Avg Latency | Pass Rate | Cost |
|---|---|---|---|---|---|
| Llama 4 Maverick 128E | SambaNova | 9.7/10 | 2,345ms | 3/3 | Free |
| DeepSeek V3.2 | SambaNova | 9.7/10 | 3,688ms | 3/3 | Free |
| Llama 3.1 8B | Cerebras | 9.7/10 | 997ms | 3/3 | Free |
| Gemini 2.5 Flash | Google AI Studio | 9.7/10 | 15,552ms | 3/3 | Free |
| Gemini Flash Latest | Google AI Studio | 9.7/10 | 11,528ms | 3/3 | Free |
| GPT OSS 120B | SambaNova | 9.3/10 | 2,682ms | 3/3 | Free |
| GPT OSS 120B | OpenRouter | 9.3/10 | 2,989ms | 3/3 | Free |
| Llama 3.3 70B | SambaNova | 9.3/10 | 3,588ms | 3/3 | Free |

**Excluded (unreliable):** Qwen 3 235B/Cerebras (persistent 429), Llama 3.3 70B/OpenRouter (always 429 — upstream capacity), GPT OSS 20B/OpenRouter (429 on 2/3 fixtures), MiniMax M2.7/SambaNova (422 — service tier), Gemini Flash Lite Latest (503 on 1/3 fixtures).

### Chosen Models for Production

| Role | Model | Provider | API Base |
|---|---|---|---|
| **Primary** | Llama 4 Maverick 128E (`Llama-4-Maverick-17B-128E-Instruct`) | SambaNova | `https://api.sambanova.ai/v1` |
| **Fallback 1** | Llama 3.1 8B (`llama3.1-8b`) | Cerebras | `https://api.cerebras.ai/v1` |
| **Fallback 2** | Gemini 2.5 Flash (`models/gemini-2.5-flash`) | Google AI Studio | `https://generativelanguage.googleapis.com/v1beta/openai` |

**Rationale:**

- **Primary — Llama 4 Maverick 128E (SambaNova):** Best quality-to-latency ratio among all tested models. Llama 4 architecture (newer than Llama 3.x), 9.7/10 average score, 2.3s average latency, 3/3 fixture pass rate. SambaNova's free tier is the most reliable of the three providers.
- **Fallback 1 — Llama 3.1 8B (Cerebras):** Fastest model tested at under 1 second average latency. Same quality tier (9.7/10), completely different provider (Cerebras) from the primary, ensuring provider-level redundancy. Kicks in when SambaNova returns 429 or 5xx.
- **Fallback 2 — Gemini 2.5 Flash (Google):** Slowest (~15s due to internal thinking tokens) but highest-capability model for complex or long group chats. Third independent provider (Google) as a final safety net. `max_tokens: 8000` required to accommodate thinking token budget.

**Fallback strategy in `backend/src/config/llm.js`:** Primary → on 429/5xx → Fallback 1 → on 429/5xx → Fallback 2. All three use the OpenAI-compatible `/chat/completions` endpoint, so the swap requires only changing `apiBase` and `Authorization` header.

**Cost note:** All three models are free-tier with no per-token charge. Rate limits: SambaNova ~100K tokens/day, Cerebras ~60 RPM, Google AI Studio ~1500 RPD / 15 RPM. These limits are sufficient for expected single-user usage volume.
