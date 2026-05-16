'use strict';

// Puppeteer v25+ ships as ESM. require() and import() both fail in Jest's CJS
// module sandbox because Jest transforms import() at the AST level to require().
// new Function('return import(...)') creates the import at runtime as a string,
// bypassing Jest's static transform while remaining fully valid Node.js.

/**
 * @param {string} briefHtml - Full HTML document string to render as PDF
 * @param {{ navigationTimeout?: number }} [options]
 * @returns {Promise<Buffer>} - PDF buffer ready for streaming or writing to disk
 */
async function exportBriefToPDF(briefHtml, options = {}) {
  const { navigationTimeout = 120_000 } = options;
  // eslint-disable-next-line no-new-func
  const { default: puppeteer } = await new Function('return import("puppeteer")')();
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
    page.setDefaultNavigationTimeout(navigationTimeout);
    page.setDefaultTimeout(navigationTimeout);
    await page.setContent(briefHtml, { waitUntil: 'load', timeout: navigationTimeout });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = { exportBriefToPDF };
