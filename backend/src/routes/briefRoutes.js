'use strict';

const express = require('express');
const multer = require('multer');
const { parseWhatsAppExport } = require('../parser/whatsappParser');
const { processSummarization } = require('../summarizer/summarizer');
const { composeDailyBrief } = require('../summarizer/briefComposer');

const router = express.Router();

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_FILE_COUNT = 10;
const TIMEOUT_MS = 60_000;

// Reuse binary-sniff guard from uploadRoutes.
const BINARY_SIGNATURES = [
  [0x89, 0x50, 0x4e, 0x47],
  [0xff, 0xd8, 0xff],
  [0x47, 0x49, 0x46, 0x38],
  [0x25, 0x50, 0x44, 0x46],
  [0x42, 0x4d],
  [0x52, 0x49, 0x46, 0x46],
  [0x50, 0x4b, 0x03, 0x04],
  [0x1f, 0x8b],
];

function isBinaryBuffer(buf) {
  for (const sig of BINARY_SIGNATURES) {
    if (sig.every((byte, i) => buf[i] === byte)) return true;
  }
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

// POST /api/brief
router.post('/', (req, res, next) => {
  upload.array('files', MAX_FILE_COUNT)(req, res, async (multerErr) => {
    if (multerErr) {
      if (multerErr.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: 'Payload Too Large',
          message: `One or more files exceed the ${MAX_FILE_SIZE_MB} MB size limit.`,
          code: 413,
        });
      }
      if (multerErr.code === 'LIMIT_UNEXPECTED_FILE' || multerErr.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          error: 'Bad Request',
          message: `Maximum of ${MAX_FILE_COUNT} files allowed.`,
          code: 400,
        });
      }
      return next(multerErr);
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No files provided. Send files as multipart/form-data under the field name "files".',
        code: 400,
      });
    }

    // Validate + parse all files. Binary or un-parseable files are rejected immediately.
    const parsedFiles = [];
    for (const file of req.files) {
      if (isBinaryBuffer(file.buffer)) {
        return res.status(415).json({
          error: 'Unsupported Media Type',
          message: `"${file.originalname}" must be plain text. Binary files are not accepted.`,
          code: 415,
        });
      }

      const rawText = file.buffer.toString('utf8');
      const messages = parseWhatsAppExport(rawText);

      if (messages.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: `"${file.originalname}" contained no recognisable WhatsApp messages.`,
          code: 400,
        });
      }

      const participants = [...new Set(messages.map((m) => m.sender).filter(Boolean))];
      const timestamps = messages.map((m) => m.timestamp).filter(Boolean).sort();

      parsedFiles.push({
        filename: file.originalname,
        messageCount: messages.length,
        participants,
        dateRange: {
          from: timestamps[0] ?? null,
          to: timestamps[timestamps.length - 1] ?? null,
        },
        messages,
      });
    }

    // Main pipeline wrapped in a Promise so we can race it against the timeout.
    const pipeline = async () => {
      const start = Date.now();

      // Summarize all files concurrently.
      const enrichedSummaries = await Promise.all(
        parsedFiles.map(async (pf) => {
          const summary = await processSummarization(pf.messages);
          return {
            filename:     pf.filename,
            topic:        summary.topic,
            participants: pf.participants.length ? pf.participants : summary.participants,
            messageCount: pf.messageCount,
            dateRange:    pf.dateRange,
            keyDecisions: summary.keyDecisions,
            actionItems:  summary.actionItems,
            notableFacts: summary.notableFacts,
            summaryText:  summary.summaryText,
          };
        }),
      );

      const briefCore = await composeDailyBrief(enrichedSummaries);

      return {
        brief: {
          generatedAt:       new Date().toISOString(),
          overviewParagraph: briefCore.overviewParagraph,
          chatCards:         briefCore.chatCards,
          crossChatInsights: briefCore.crossChatInsights,
          keyPeople:         briefCore.keyPeople,
          totalActionItems:  briefCore.chatCards.flatMap((c) => c.actionItems || []),
          filesProcessed:    parsedFiles.length,
          filesExcluded:     0,
        },
        model:        'llm',
        processingMs: Date.now() - start,
      };
    };

    const timeout = new Promise((_, reject) =>
      setTimeout(
        () => reject(Object.assign(new Error('Request timed out — brief generation exceeded 60 seconds.'), { status: 504 })),
        TIMEOUT_MS,
      ),
    );

    try {
      const result = await Promise.race([pipeline(), timeout]);
      return res.status(200).json(result);
    } catch (err) {
      const status = err.status ?? 500;
      if (status === 504) {
        return res.status(504).json({
          error: 'Gateway Timeout',
          message: err.message,
          code: 504,
        });
      }
      return next(err);
    }
  });
});

module.exports = router;
