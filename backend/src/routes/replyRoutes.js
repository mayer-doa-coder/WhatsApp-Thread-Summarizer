'use strict';

const express = require('express');
const { draftReplies } = require('../summarizer/replyDrafter');

const router = express.Router();

// POST /api/reply
router.post('/', async (req, res, next) => {
  const { messages, userIntent, tone } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'messages must be a non-empty array.',
      code: 400,
    });
  }

  if (messages.length >= 50) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'messages must contain fewer than 50 items.',
      code: 400,
    });
  }

  try {
    const options = await draftReplies(messages, userIntent, tone);
    return res.status(200).json({ options });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
