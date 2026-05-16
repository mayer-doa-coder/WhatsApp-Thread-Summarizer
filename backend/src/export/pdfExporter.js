'use strict';

const puppeteer = require('puppeteer');

/**
 * @param {string} briefHtml - Full HTML document string to render as PDF
 * @returns {Promise<Buffer>} - PDF buffer ready for streaming or writing to disk
 */
async function exportBriefToPDF(briefHtml) {
  const launchArgs = ['--no-sandbox', '--disable-setuid-sandbox'];

  const launchOptions = {
    args: launchArgs,
    headless: true,
  };

  // Allow overriding the browser executable via env var for environments where
  // Puppeteer's bundled Chromium is unavailable (e.g., local dev with system Chrome).
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.setContent(briefHtml, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = { exportBriefToPDF };
