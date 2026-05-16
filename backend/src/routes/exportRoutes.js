'use strict';

const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const { renderBriefHTML } = require('../export/briefTemplate');
const { exportBriefToPDF } = require('../export/pdfExporter');

const router = Router();

router.post('/pdf', authenticate, async (req, res, next) => {
  try {
    const html = renderBriefHTML(req.body);
    const pdfBuffer = await exportBriefToPDF(html);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="daily-brief.pdf"',
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
