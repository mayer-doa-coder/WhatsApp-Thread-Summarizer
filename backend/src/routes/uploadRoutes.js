'use strict';

const express = require('express');
const multer = require('multer');
const { parseWhatsAppExport } = require('../parser/whatsappParser');

const router = express.Router();

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_FILE_COUNT = 10;

// Magic-byte signatures for common binary formats.
// A file claiming to be text/plain that matches any of these is spoofed.
const BINARY_SIGNATURES = [
  [0x89, 0x50, 0x4e, 0x47],             // PNG
  [0xff, 0xd8, 0xff],                    // JPEG
  [0x47, 0x49, 0x46, 0x38],             // GIF
  [0x25, 0x50, 0x44, 0x46],             // PDF
  [0x42, 0x4d],                          // BMP
  [0x52, 0x49, 0x46, 0x46],             // WebP / RIFF
  [0x50, 0x4b, 0x03, 0x04],             // ZIP / DOCX / XLSX
  [0x1f, 0x8b],                          // gzip
];

function isBinaryBuffer(buf) {
  for (const sig of BINARY_SIGNATURES) {
    if (sig.every((byte, i) => buf[i] === byte)) return true;
  }
  // Null bytes anywhere in the first 512 bytes also indicate binary content.
  const sample = Math.min(512, buf.length);
  for (let i = 0; i < sample; i++) {
    if (buf[i] === 0x00) return true;
  }
  return false;
}

/**
 * Validates and parses a single multer file object.
 * Throws a plain object { status, body } on validation failure so the caller
 * can short-circuit the whole request.
 */
function processFile(file) {
  if (isBinaryBuffer(file.buffer)) {
    const err = new Error(
      `"${file.originalname}" must be plain text. Binary files (images, PDFs, archives, etc.) are not accepted.`,
    );
    err.status = 415;
    throw err;
  }

  const rawText = file.buffer.toString('utf8');
  const messages = parseWhatsAppExport(rawText);

  if (messages.length === 0) {
    const err = new Error(
      `"${file.originalname}" parsed successfully but contained no recognisable WhatsApp messages.`,
    );
    err.status = 400;
    throw err;
  }

  const participants = [...new Set(messages.map((m) => m.sender).filter(Boolean))];
  const timestamps = messages.map((m) => m.timestamp).filter(Boolean).sort();
  const typeCounts = messages.reduce(
    (acc, m) => { acc[m.type] = (acc[m.type] || 0) + 1; return acc; },
    { text: 0, media: 0, system: 0, deleted: 0 },
  );

  return {
    filename: file.originalname,
    sizeBytes: file.buffer.length,
    encoding: 'utf-8',
    messageCount: messages.length,
    truncated: false,
    parseWarnings: [],
    participants,
    dateRange: {
      from: timestamps[0] ?? null,
      to: timestamps[timestamps.length - 1] ?? null,
    },
    typeCounts,
    messages,
  };
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

// POST /api/upload
// Wraps multer in a callback so we can intercept multer-specific errors before
// Express's async error handling takes over.
router.post('/', (req, res, next) => {
  upload.array('files', MAX_FILE_COUNT)(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'Payload Too Large',
          message: `One or more files exceed the ${MAX_FILE_SIZE_MB} MB size limit.`,
          code: 413,
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          error: 'Bad Request',
          message: `Maximum of ${MAX_FILE_COUNT} files allowed.`,
          code: 400,
        });
      }
      return next(err);
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No files provided. Send files as multipart/form-data under the field name "files".',
        code: 400,
      });
    }

    try {
      // processFile is synchronous (CPU-bound parsing), but wrapping in
      // Promise.all lets us add async processing later without changing the shape.
      const results = await Promise.all(req.files.map((file) => processFile(file)));

      return res.status(200).json({ files: results });
    } catch (validationErr) {
      const status = validationErr.status ?? 400;
      return res.status(status).json({
        error: status === 415 ? 'Unsupported Media Type' : 'Bad Request',
        message: validationErr.message,
        code: status,
      });
    }
  });
});

module.exports = router;
