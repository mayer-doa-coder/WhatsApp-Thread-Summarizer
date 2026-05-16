# User Guide — WhatsApp Thread Summarizer

This guide walks you through every feature of the app. No technical knowledge required.

---

## What You Can Do

| Flow | What it does |
|---|---|
| **Summarise a chat** | Upload one WhatsApp export and get a clear, structured summary |
| **Draft a reply** | Get three ready-to-send reply options from the last few messages |
| **Daily Brief** | Upload several chats at once and get one combined report for the day |
| **Download a PDF** | Save your Daily Brief as a PDF you can share or print |
| **History** | Save summaries to your account and look them up later |

---

## Before You Start — Export a WhatsApp Chat

The app reads WhatsApp's built-in `.txt` export format.

**On iPhone:**
1. Open the chat you want to summarise
2. Tap the contact or group name at the top
3. Scroll down and tap **Export Chat**
4. Choose **Without Media**
5. Save or share the `.txt` file to your device

**On Android:**
1. Open the chat
2. Tap the three-dot menu ( ⋮ ) → **More** → **Export chat**
3. Choose **Without media**
4. Save the `.txt` file to your device

The exported file is named something like `WhatsApp Chat with Alice.txt` or `WhatsApp Chat - Team Work.txt`. That's the file you'll upload.

---

## Flow 1 — Summarise a Chat

**Where:** The home page (`/`)

1. **Open the app.** You land on the upload page.

2. **Add your file.** Either:
   - Drag and drop your `.txt` file onto the upload zone, or
   - Click the upload zone and browse to your file

   The filename appears below the zone once it's loaded.

3. **Choose a summary length** (optional — defaults to Medium):
   - **Short** — a 2–3 sentence overview
   - **Medium** — topic, key decisions, action items, and a paragraph summary
   - **Detailed** — everything in Medium plus expanded explanations

4. **Click Process.** The app parses your chat and sends it to the AI. This usually takes 3–10 seconds.

5. **Read your summary.** The Summary page shows:
   - **Topic** — what the conversation was mainly about
   - **Participants** — who was in the chat
   - **Key Decisions** — conclusions the group reached
   - **Action Items** — tasks assigned during the conversation
   - **Notable Facts** — interesting details worth remembering
   - **Summary** — a prose paragraph wrapping it all up

6. **Copy anything you need.** Click the copy icon next to any section to copy it to your clipboard.

> **Tip:** If you're logged in, a **Save to History** button appears. Click it to store this summary in your account so you can find it later.

---

## Flow 2 — Draft a Reply

**Where:** The Summary page, below the summary

After summarising a chat you can immediately draft a reply to the last message.

1. **Find the Reply Drafter** panel below the summary card.

2. **Pick a tone:**
   - **Formal** — professional, no contractions
   - **Casual** — natural, conversational
   - **Concise** — under 20 words, straight to the point

3. **(Optional) Add your intent.** Type a short note about what you want to say, for example: *"Confirm I'll be there but mention I might be 5 minutes late."* The AI uses this to shape the reply.

4. **Click Generate Replies.** Three options appear, one per tone.

5. **Pick the one you like** and click its copy button. Paste it directly into WhatsApp.

> **Tip:** Run Generate Replies as many times as you like — each run produces fresh options.

---

## Flow 3 — Daily Brief

**Where:** The Daily Brief page (`/daily-brief`)

The Daily Brief is designed for days when you have several group chats to catch up on. Upload them all at once and get one unified report.

1. **Go to the Daily Brief page.** Click the nav link or navigate to `/daily-brief`.

2. **Add your files.** Drag and drop up to 10 `.txt` exports onto the upload zone, or click to browse and select multiple files at once.

3. **Click Generate Brief.** The app summarises each chat independently, then composes the combined report. Processing time depends on the number and size of files — expect 10–60 seconds.

4. **Read the brief.** It contains:
   - **Overview** — a single paragraph covering the day across all chats
   - **Chat Cards** — one card per file, with topic, participants, key decisions, and action items
   - **Cross-Chat Insights** — observations that span multiple conversations (e.g. the same person mentioned in two chats, or two groups discussing the same deadline)
   - **Key People** — everyone mentioned across all chats
   - **Total Action Items** — a consolidated to-do list pulled from every chat

5. **Download as PDF** — see Flow 4 below.

> **Tip:** You can mix group chats and individual chats in one brief. The app handles them the same way.

---

## Flow 4 — Download a PDF

**Where:** The Daily Brief page, after a brief is generated

1. **Generate a Daily Brief** (see Flow 3 above).

2. **Click the Download PDF button.** Your browser starts downloading a file named `daily-brief-YYYY-MM-DD.pdf`.

3. **Open the PDF.** It contains a formatted version of the brief, suitable for sharing in an email or printing.

> The PDF is generated on the server — you must be logged in for this step because it's a protected endpoint.

---

## Flow 5 — History

**Where:** The History page (`/history`)

History lets you save summaries and come back to them later. You must have an account to use History.

### Creating an account

1. Click **Register** in the navigation or go to `/register`.
2. Enter your email address and choose a password (at least 8 characters, must include a number).
3. Click **Create account**. You're logged in immediately and redirected to the upload page.

### Logging in

1. Click **Log in** or go to `/login`.
2. Enter your email and password and click **Log in**.

### Saving a summary

1. Summarise a chat (Flow 1).
2. On the Summary page, click **Save to History**.
3. A confirmation toast appears briefly at the top of the screen. The button changes to **Saved ✓**.

### Viewing your history

1. Click **History** in the navigation or go to `/history`.
2. Your saved summaries appear in a table, newest first. Each row shows the filename, type (Thread Summary or Daily Brief), date saved, and a short excerpt.

### Deleting a saved summary

1. On the History page, find the summary you want to remove.
2. Click the **Delete** button (bin icon) on that row.
3. A confirmation dialog appears — click **Confirm Delete**.
4. The entry disappears from the list.

> Deleting a summary is permanent and cannot be undone.

---

## Common Questions

**My upload isn't working — what format does the app accept?**

The app reads WhatsApp's standard `.txt` export (with media messages included or excluded — either works). Files must be plain text, not `.zip` or `.doc`. If you exported from WhatsApp correctly, the file will work.

**How long can my chat be?**

Up to 50 000 messages per file, up to 5 MB per file. Most chat exports are well under these limits even after years of messages.

**How long does summarisation take?**

Usually 3–10 seconds for a single chat. A Daily Brief with 5 large chats can take up to 60 seconds. If it takes longer, the app will show an error and you can try again.

**Is my chat data stored anywhere?**

Your messages are sent to the AI provider to generate the summary. The raw message content is not stored on our servers — only the summary text is stored (and only if you explicitly click **Save to History**).

**I'm getting a 'session expired' error.**

Your login session lasts 30 minutes. Click **Log in** to sign back in.

**The PDF download isn't starting.**

Make sure you're logged in — PDF export requires authentication. If you're logged in and the button doesn't respond, try refreshing the page and generating the brief again.

---

## Pages at a Glance

| URL | Page | Requires login? |
|---|---|---|
| `/` | Upload a chat | No |
| `/summary` | View summary + draft replies | No |
| `/daily-brief` | Daily Brief + PDF download | PDF download only |
| `/history` | Saved summaries | Yes |
| `/login` | Log in | — |
| `/register` | Create an account | — |

---

*Last updated: 2026-05-17*
