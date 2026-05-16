import { test, expect, Page } from '@playwright/test';

// ── Mock responses ─────────────────────────────────────────────────────────────
// Upload and summarize are mocked for speed.
// Auth (/api/auth/*) and History (/api/history) hit the REAL backend.

const MOCK_UPLOAD_RESPONSE = {
  files: [
    {
      filename: 'chat.txt',
      sizeBytes: 512,
      encoding: 'utf-8',
      messageCount: 5,
      truncated: false,
      parseWarnings: [],
      participants: ['Alice', 'Bob'],
      dateRange: { from: '2026-05-01T08:00:00.000Z', to: '2026-05-01T09:00:00.000Z' },
      typeCounts: { text: 5, media: 0, system: 0, deleted: 0 },
      messages: [
        { timestamp: '2026-05-01T08:00:00.000Z', sender: 'Alice', content: 'Hi, planning the Q2 launch.', type: 'text' },
        { timestamp: '2026-05-01T08:01:00.000Z', sender: 'Bob',   content: 'Agreed. June 28th target.', type: 'text' },
        { timestamp: '2026-05-01T08:02:00.000Z', sender: 'Alice', content: 'Prepare action items by Friday.', type: 'text' },
        { timestamp: '2026-05-01T08:03:00.000Z', sender: 'Bob',   content: 'Will do. Following up with stakeholders.', type: 'text' },
        { timestamp: '2026-05-01T08:04:00.000Z', sender: 'Alice', content: 'Great. Regroup Friday.', type: 'text' },
      ],
    },
  ],
};

// Must satisfy isSummaryData type-guard in SummaryPage.tsx:
// topic, keyDecisions, actionItems, notableFacts, participants, summaryText
// SummaryPage posts: filename = summary.topic || 'Untitled Thread'
const SUMMARY_TOPIC = 'E2E Auth History Chat';
const MOCK_SUMMARY_RESPONSE = {
  summary: {
    topic: SUMMARY_TOPIC,
    participants: ['Alice', 'Bob'],
    dateRange: { from: '2026-05-01T08:00:00.000Z', to: '2026-05-01T09:00:00.000Z' },
    messageCount: 5,
    keyDecisions: ['Launch date set for June 28th'],
    actionItems: ['Bob to prepare action items by Friday'],
    notableFacts: ['Team agreed on Q2 timeline'],
    summaryText: 'Alice and Bob discussed the Q2 launch. Target date is June 28th.',
  },
  model: 'mock-model',
  processingMs: 1,
  inputMessages: 5,
  truncated: false,
};

const MOCK_CHAT_BUFFER = Buffer.from('mock chat log', 'utf-8');

// ── Helper: intercept upload + summarize, inject file, reach Summary page ──────

async function navigateToSummaryPage(page: Page): Promise<void> {
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
      body: JSON.stringify(MOCK_SUMMARY_RESPONSE),
    }),
  );

  await page.goto('/');

  await page.locator('#upload-zone-input').setInputFiles({
    name: 'chat.txt',
    mimeType: 'text/plain',
    buffer: MOCK_CHAT_BUFFER,
  });

  await expect(page.getByText('chat.txt')).toBeVisible();
  await page.getByRole('button', { name: 'Process' }).click();

  await page.waitForURL('**/summary', { timeout: 10_000 });
  await expect(page.getByText('Action Items')).toBeVisible();
}

// ── Test ───────────────────────────────────────────────────────────────────────

test('registers a user, saves a summary to history, views it, then deletes it', async ({ page }) => {
  // ── 1. Register a fresh account ────────────────────────────────────────────
  // Unique email per run — no database reset needed.
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  await page.goto('/register');
  await page.getByLabel('Email address').fill(testEmail);
  await page.getByLabel('Password', { exact: true }).fill(testPassword);
  await page.getByLabel('Confirm password').fill(testPassword);
  await page.getByRole('button', { name: 'Create account' }).click();

  // Successful registration redirects to the upload page
  await page.waitForURL('/', { timeout: 15_000 });

  // ── 2. Upload a mock chat and reach the Summary page ───────────────────────
  await navigateToSummaryPage(page);

  // ── 3. Save the summary to history ─────────────────────────────────────────
  // "Save to History" is only rendered when a user is authenticated.
  // It POSTs to the real /api/history with the current user's JWT.
  const saveBtn = page.getByRole('button', { name: 'Save to History' });
  await expect(saveBtn).toBeVisible();
  await saveBtn.click();

  // The ToastContext shows a success toast (auto-dismissed after 4 s)
  await expect(page.getByText('Saved to history!', { exact: false })).toBeVisible({ timeout: 10_000 });

  // Button transitions to "Saved ✓" once the API call completes
  await expect(page.getByRole('button', { name: 'Saved ✓' })).toBeVisible({ timeout: 10_000 });

  // ── 4. Navigate to the History page ────────────────────────────────────────
  await page.goto('/history');
  await expect(page.getByRole('heading', { name: 'History' })).toBeVisible();

  // ── 5. Assert the saved entry appears in the table ─────────────────────────
  // SummaryPage posts filename = summary.topic = SUMMARY_TOPIC
  await expect(page.getByText(SUMMARY_TOPIC)).toBeVisible({ timeout: 10_000 });
  // The type badge for a thread save reads "Thread Summary"
  await expect(page.getByText('Thread Summary').first()).toBeVisible();

  // ── 6. Delete the entry ────────────────────────────────────────────────────
  // aria-label on the Delete button: "Delete summary for <filename>"
  await page
    .getByRole('button', { name: `Delete summary for ${SUMMARY_TOPIC}` })
    .click();

  // A confirmation modal appears
  const confirmDialog = page.getByRole('dialog', { name: /delete summary/i });
  await expect(confirmDialog).toBeVisible();
  await confirmDialog.getByRole('button', { name: 'Confirm Delete' }).click();

  // ── 7. Assert the entry is gone from the DOM ────────────────────────────────
  await expect(page.getByText(SUMMARY_TOPIC)).toHaveCount(0, { timeout: 10_000 });
});
