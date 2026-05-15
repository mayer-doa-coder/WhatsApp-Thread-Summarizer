'use strict';

const express = require('express');
const multer = require('multer');
const { parseWhatsAppExport } = require('../parser/whatsappParser');

const router = express.Router();

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

// POST /api/upload
// Wraps multer in a callback so we can intercept LIMIT_FILE_SIZE before
// Express 5's async error handling takes over.
router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'Payload Too Large',
          message: `File exceeds the ${MAX_FILE_SIZE_MB} MB size limit.`,
          code: 413,
        });
      }
      return next(err);
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No file provided. Send the file as multipart/form-data under the field name "file".',
        code: 400,
      });
    }

    // Reject binary content masquerading as plain text.
    if (isBinaryBuffer(req.file.buffer)) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        message: 'File must be plain text. Binary files (images, PDFs, archives, etc.) are not accepted.',
        code: 415,
      });
    }

    const rawText = req.file.buffer.toString('utf8');
    const messages = parseWhatsAppExport(rawText);

    if (messages.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'File parsed successfully but contained no recognisable WhatsApp messages.',
        code: 400,
      });
    }

    const participants = [...new Set(messages.map((m) => m.sender).filter(Boolean))];
    const timestamps = messages.map((m) => m.timestamp).filter(Boolean).sort();
    const typeCounts = messages.reduce(
      (acc, m) => { acc[m.type] = (acc[m.type] || 0) + 1; return acc; },
      { text: 0, media: 0, system: 0, deleted: 0 },
    );

    return res.status(200).json({
      files: [
        {
          filename: req.file.originalname,
          sizeBytes: req.file.buffer.length,
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
        },
      ],
    });
  });
});

module.exports = router;
