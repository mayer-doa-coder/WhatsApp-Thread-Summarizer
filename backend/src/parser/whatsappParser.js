'use strict';

// Android 24h: DD/MM/YYYY, HH:MM - rest
// Day is first, 4-digit year, no AM/PM — e.g. "15/03/2025, 08:30 - Alice: Hi"
const RE_ANDROID = /^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2})\s*-\s*([\s\S]*)$/;

// iOS / modern Android 12h: M/D/YY[YY], H:MM[:SS] AM/PM - rest
// Month is first, 2- or 4-digit year — e.g. "3/15/25, 10:00 AM - Alice: Hi"
const RE_IOS = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)\s*-\s*([\s\S]*)$/i;

// iOS bracketed (older exports): [M/D/YY[YY], H:MM[:SS] AM/PM] rest
// e.g. "[3/15/25, 10:00:05 AM] Alice: Hi"
const RE_IOS_BRACKET = /^\[(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)\]\s*([\s\S]*)$/i;

// Content classifiers
const RE_MEDIA = /^(<Media omitted>|‎?(image|video|audio|document|GIF|sticker) omitted)$/i;
const RE_DELETED = /^This message was deleted$/i;
const RE_EDITED_SUFFIX = /\s*<This message was edited>\s*$/;

function expandYear(y) {
  const n = parseInt(y, 10);
  return n < 100 ? 2000 + n : n;
}

function to24h(h, min, sec, ampm) {
  let hour = parseInt(h, 10);
  const minute = parseInt(min, 10);
  const second = sec ? parseInt(sec, 10) : 0;
  if (ampm.toUpperCase() === 'AM') {
    if (hour === 12) hour = 0;
  } else {
    if (hour !== 12) hour += 12;
  }
  return { hour, minute, second };
}

function buildISO(year, month, day, hour, minute, second = 0) {
  // Use UTC-neutral local Date construction; caller supplies validated integers.
  const d = new Date(year, month - 1, day, hour, minute, second);
  return d.toISOString();
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

// Try every known timestamp pattern on a single line.
// Returns { date, time, timestamp, rest } or null if no pattern matched.
function tryParseTimestamp(line) {
  let m;

  // 1. iOS bracketed — most specific, test first
  m = RE_IOS_BRACKET.exec(line);
  if (m) {
    const [, mo, dy, y, h, mn, sc, ampm, rest] = m;
    const year = expandYear(y);
    const { hour, minute, second } = to24h(h, mn, sc, ampm);
    const month = parseInt(mo, 10);
    const day = parseInt(dy, 10);
    return {
      date: `${pad2(day)}/${pad2(month)}/${year}`,
      time: `${pad2(hour)}:${pad2(minute)}`,
      timestamp: buildISO(year, month, day, hour, minute, second),
      rest,
    };
  }

  // 2. iOS / modern 12h (has AM/PM)
  m = RE_IOS.exec(line);
  if (m) {
    const [, mo, dy, y, h, mn, sc, ampm, rest] = m;
    const year = expandYear(y);
    const { hour, minute, second } = to24h(h, mn, sc, ampm);
    const month = parseInt(mo, 10);
    const day = parseInt(dy, 10);
    return {
      date: `${pad2(day)}/${pad2(month)}/${year}`,
      time: `${pad2(hour)}:${pad2(minute)}`,
      timestamp: buildISO(year, month, day, hour, minute, second),
      rest,
    };
  }

  // 3. Android 24h (no AM/PM, 4-digit year, day-first)
  m = RE_ANDROID.exec(line);
  if (m) {
    const [, dy, mo, y, h, mn, rest] = m;
    const year = parseInt(y, 10);
    const month = parseInt(mo, 10);
    const day = parseInt(dy, 10);
    const hour = parseInt(h, 10);
    const minute = parseInt(mn, 10);
    return {
      date: `${pad2(day)}/${pad2(month)}/${year}`,
      time: `${pad2(hour)}:${pad2(minute)}`,
      timestamp: buildISO(year, month, day, hour, minute),
      rest,
    };
  }

  return null;
}

// Split "Sender: content" on the first ": ".
// Returns { sender: string|null, content: string }.
function splitSenderContent(rest) {
  const colonIdx = rest.indexOf(': ');
  if (colonIdx === -1) return { sender: null, content: rest.trim() };
  return {
    sender: rest.slice(0, colonIdx).trim(),
    content: rest.slice(colonIdx + 2),
  };
}

function detectType(content, sender) {
  if (!sender) return 'system';
  const trimmed = content.trim();
  if (RE_MEDIA.test(trimmed)) return 'media';
  if (RE_DELETED.test(trimmed)) return 'deleted';
  return 'text';
}

/**
 * Parse a raw WhatsApp export string into a structured message array.
 *
 * Handles:
 *   - Android 24h  (DD/MM/YYYY, HH:MM)
 *   - iOS 12h      (M/D/YY, H:MM AM/PM)
 *   - iOS bracketed ([M/D/YY, H:MM:SS AM/PM])
 *   - Multi-line messages (continuation lines without a leading timestamp)
 *   - System messages (no "Sender:" colon)
 *   - Media, deleted, and edited message variants
 *
 * @param {string} rawText - Full contents of a .txt WhatsApp export file.
 * @returns {{ date: string, time: string, timestamp: string, sender: string|null, content: string, type: string }[]}
 */
function parseWhatsAppExport(rawText) {
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n');

  const messages = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const parsed = tryParseTimestamp(line);

    if (parsed) {
      const { date, time, timestamp, rest } = parsed;
      const { sender, content: rawContent } = splitSenderContent(rest);

      // Strip trailing "<This message was edited>" annotation
      const content = rawContent.replace(RE_EDITED_SUFFIX, '');
      const type = detectType(content, sender);

      messages.push({ date, time, timestamp, sender, content, type });
    } else if (messages.length > 0) {
      // No timestamp — continuation of the previous message
      messages[messages.length - 1].content += '\n' + line;
    }
    // Lines before the first message (e.g. BOM or empty header) are silently dropped
  }

  return messages;
}

module.exports = { parseWhatsAppExport };
