import { test, expect } from '@playwright/test';

// XSS payload embedded in a realistic WhatsApp chat log line.
// The backend parser will forward whatever text content it finds;
// the mock summarize response injects the raw payload into summaryText
// so the SummaryPage renders it through React's JSX interpolation.
const XSS_PAYLOAD = '<script>alert("xss-failure")</script>';

const XSS_CHAT_BUFFER = Buffer.from(
  `[01/05/2026, 08:00:00 AM] Alice: User says: ${XSS_PAYLOAD}\n`,
  'utf-8',
);

// Upload mock — satisfies the full ParsedFile shape expected by SummaryPage.
const MOCK_UPLOAD_RESPONSE = {
  files: [
    {
      filename: 'xss-chat.txt',
      sizeBytes: XSS_CHAT_BUFFER.length,
      encoding: 'utf-8',
      messageCount: 1,
      truncated: false,
      parseWarnings: [],
      participants: ['Alice'],
      dateRange: {
        from: '2026-05-01T08:00:00.000Z',
        to: '2026-05-01T08:00:00.000Z',
      },
      typeCounts: { text: 1, media: 0, system: 0, deleted: 0 },
      messages: [
        {
          timestamp: '2026-05-01T08:00:00.000Z',
          sender: 'Alice',
          content: `User says: ${XSS_PAYLOAD}`,
          type: 'text',
        },
      ],
    },
  ],
};

// Summarize mock — XSS payload deliberately placed in summaryText so
// SummaryPage's <SummaryCard> must render it via {summaryText} JSX.
// All fields required by the isSummaryData type-guard must be present.
const MOCK_SUMMARIZE_RESPONSE = {
  summary: {
    topic: 'XSS Security Test',
    participants: ['Alice'],
    dateRange: {
      from: '2026-05-01T08:00:00.000Z',
      to: '2026-05-01T08:00:00.000Z',
    },
    messageCount: 1,
    keyDecisions: ['No decisions made'],
    actionItems: ['No action items'],
    notableFacts: ['Payload present in message'],
    summaryText: `User says: ${XSS_PAYLOAD}`,
  },
  model: 'mock-model',
  processingMs: 1,
  inputMessages: 1,
  truncated: false,
};

test('XSS payload in summaryText is escaped — no script executes', async ({ page }) => {
  // ── 1. Fail-fast dialog trap ───────────────────────────────────────────────
  // If the browser fires any alert/confirm/prompt the payload executed as JS.
  // We dismiss it immediately to unblock page teardown, then fail the test.
  let dialogFired = false;
  page.on('dialog', async (dialog) => {
    dialogFired = true;
    await dialog.dismiss();
  });

  // ── 2. Mock API routes ─────────────────────────────────────────────────────
  await page.route('**/api/upload', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_UPLOAD_RESPONSE),
    }),
  );

  await page.route('**/api/summarize', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SUMMARIZE_RESPONSE),
    }),
  );

  // ── 3. Load the upload page and inject the XSS file ───────────────────────
  await page.goto('/');
  await page.locator('#upload-zone-input').setInputFiles({
    name: 'xss-chat.txt',
    mimeType: 'text/plain',
    buffer: XSS_CHAT_BUFFER,
  });

  await expect(page.getByText('xss-chat.txt')).toBeVisible();

  // ── 4. Trigger the summarize pipeline ─────────────────────────────────────
  await page.getByRole('button', { name: 'Process' }).click();
  await page.waitForURL('**/summary', { timeout: 10_000 });

  // ── 5. Assert the summary card rendered (proves React reached the payload) ─
  await expect(page.getByText('Action Items')).toBeVisible();

  // ── 6. Assert payload appears as escaped literal text, not executed JS ─────
  // React's JSX interpolation ({summaryText}) renders < as &lt; in the DOM,
  // so the visible display text is the raw angle-bracket string — not a tag.
  // Playwright's toContainText matches visible text, not raw HTML.
  await expect(page.locator('body')).toContainText(XSS_PAYLOAD);

  // ── 7. Confirm no dialog ever fired ───────────────────────────────────────
  expect(dialogFired, 'XSS alert() executed — payload was not escaped').toBe(false);
});
