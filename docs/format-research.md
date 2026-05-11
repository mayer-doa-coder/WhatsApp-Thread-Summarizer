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
