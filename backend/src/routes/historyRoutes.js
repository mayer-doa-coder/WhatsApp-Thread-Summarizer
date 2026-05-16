'use strict';

const express = require('express');
const authenticate = require('../middleware/authenticate');
const { saveSummary, getUserSummaries, deleteSummary } = require('../models/summary');

const router = express.Router();

router.use(authenticate);

// POST /api/history — save a summary for the authenticated user
router.post('/', async (req, res, next) => {
  const userId = req.user.sub;
  const { filename, type, summaryText, messageCount, participants, dateFrom, dateTo } = req.body;

  if (!filename || !type || !summaryText) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'filename, type, and summaryText are required.',
      code: 400,
    });
  }

  try {
    const record = await saveSummary(userId, {
      filename,
      type,
      summaryText,
      messageCount,
      participants,
      dateFrom,
      dateTo,
    });
    return res.status(201).json({ summary: record });
  } catch (err) {
    return next(err);
  }
});

// GET /api/history — list all summaries for the authenticated user
router.get('/', async (req, res, next) => {
  const userId = req.user.sub;
  try {
    const summaries = await getUserSummaries(userId);
    return res.status(200).json({ summaries });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/history/:id — delete a summary; 403 if owned by a different user
router.delete('/:id', async (req, res, next) => {
  const summaryId = req.params.id;
  const userId = req.user.sub;
  try {
    await deleteSummary(summaryId, userId);
    return res.status(204).send();
  } catch (err) {
    const isOwnershipError =
      err.message.includes('not found') || err.message.includes('does not belong');
    if (isOwnershipError) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to delete this summary.',
        code: 403,
      });
    }
    return next(err);
  }
});

module.exports = router;
