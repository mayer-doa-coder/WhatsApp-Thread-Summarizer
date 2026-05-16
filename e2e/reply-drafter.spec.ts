import { test, expect, Page } from '@playwright/test';

// ── Clipboard permissions ──────────────────────────────────────────────────────
// Required so headless Chromium can execute navigator.clipboard.writeText()
// without throwing a security/permission error.
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

// ── Mocked API responses ───────────────────────────────────────────────────────
// Upload and summarize are intercepted to eliminate LLM latency for the path
// that isn't under test here. The /api/reply call is NOT intercepted — this
// test exercises real AI generation for the reply drafter.

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
        { timestamp: '2026-05-01T08:00:00.000Z', sender: 'Alice', content: 'Hi, we need to plan the Q2 launch.', type: 'text' },
        { timestamp: '2026-05-01T08:01:00.000Z', sender: 'Bob', content: 'Agreed. June 28th is the target date.', type: 'text' },
        { timestamp: '2026-05-01T08:02:00.000Z', sender: 'Alice', content: 'Bob, please prepare the action items by Friday.', type: 'text' },
        { timestamp: '2026-05-01T08:03:00.000Z', sender: 'Bob', content: 'Will do. I will also follow up with stakeholders.', type: 'text' },
        { timestamp: '2026-05-01T08:04:00.000Z', sender: 'Alice', content: 'Great. Let us regroup on Friday.', type: 'text' },
      ],
    },
  ],
};

// Must satisfy the isSummaryData type-guard in SummaryPage.tsx:
// topic:string, keyDecisions:string[], actionItems:string[], notableFacts:string[],
// participants:string[], summaryText:string
const MOCK_SUMMARY_RESPONSE = {
  summary: {
    topic: 'Q2 Launch Planning',
    participants: ['Alice', 'Bob'],
    dateRange: { from: '2026-05-01T08:00:00.000Z', to: '2026-05-01T09:00:00.000Z' },
    messageCount: 5,
    keyDecisions: ['Launch date set for June 28th'],
    actionItems: ['Bob to prepare action items by Friday', 'Follow up with stakeholders'],
    notableFacts: ['Team agreed on Q2 timeline'],
    summaryText: 'Alice and Bob discussed the Q2 launch plan. The target date is June 28th. Bob will prepare action items by Friday and follow up with stakeholders.',
  },
  model: 'mock-model',
  processingMs: 1,
  inputMessages: 5,
  truncated: false,
};

const MOCK_CHAT_BUFFER = Buffer.from(
  '[01/05/2026, 08:00:00 AM] Alice: Hi, we need to plan the Q2 launch.\n' +
  '[01/05/2026, 08:01:00 AM] Bob: Agreed. June 28th is the target date.\n',
  'utf-8',
);

// ── Auth helper ────────────────────────────────────────────────────────────────

async function loginIfCredentialsProvided(page: Page): Promise<void> {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  if (!email || !password) return;

  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('/', { timeout: 15_000 });
}

// ── Helper: reach the Summary page via mocked API ─────────────────────────────

async function navigateToSummaryPage(page: Page): Promise<void> {
  // Intercept POST /api/upload — return pre-parsed messages instantly
  await page.route('**/api/upload', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_UPLOAD_RESPONSE),
    }),
  );

  // Intercept POST /api/summarize — return mock summary instantly
  await page.route('**/api/summarize', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SUMMARY_RESPONSE),
    }),
  );

  await page.goto('/');

  // Inject the mock file into the hidden <input type="file">
  await page.locator('#upload-zone-input').setInputFiles({
    name: 'chat.txt',
    mimeType: 'text/plain',
    buffer: MOCK_CHAT_BUFFER,
  });

  await expect(page.getByText('chat.txt')).toBeVisible();
  await page.getByRole('button', { name: 'Process' }).click();

  // Both API calls are mocked so navigation is near-instant
  await page.waitForURL('**/summary', { timeout: 10_000 });

  // Wait for the skeleton to resolve and the summary card to appear
  await expect(page.getByText('Action Items')).toBeVisible();
}

// ── Test ───────────────────────────────────────────────────────────────────────

test('generates replies and copies to clipboard', async ({ page }) => {
  // ── 1. Authenticate ──────────────────────────────────────────────────────────
  await loginIfCredentialsProvided(page);

  // ── 2. Navigate to the Summary page (upload is mocked for speed) ─────────────
  await navigateToSummaryPage(page);

  // ── 3. Open the Reply Drafter panel ──────────────────────────────────────────
  await page.getByRole('button', { name: /draft a reply/i }).click();

  const panel = page.getByRole('dialog', { name: /reply drafter/i });
  await expect(panel).toBeVisible();

  // ── 4. Select the "Casual" tone ───────────────────────────────────────────────
  await panel.getByRole('button', { name: 'Casual' }).click();

  // Verify the active state changed (button styling switches; test the click lands)
  // The tone button is a plain <button> — just assert it is visible and clickable
  await expect(panel.getByRole('button', { name: 'Casual' })).toBeVisible();

  // ── 5. Click "Generate Drafts" — real /api/reply call ────────────────────────
  await panel.getByRole('button', { name: 'Generate Drafts' }).click();

  // Button transitions to "Generating…" while the LLM request is in-flight
  await expect(panel.getByRole('button', { name: /generating/i })).toBeVisible();

  // ── 6. Wait for exactly 3 real draft cards to appear ─────────────────────────
  // Placeholder DraftCards have no role (isPlaceholder = true), so role="article"
  // only appears on real options. Timeout covers LLM latency up to 55 s.
  await expect(page.getByRole('article')).toHaveCount(3, { timeout: 55_000 });

  // ── 7. Copy the first card and assert the "Copied!" badge ────────────────────
  const firstCard = page.getByRole('article').first();

  // Aria-label on the copy button: "Copy option 1 to clipboard"
  await firstCard.getByRole('button', { name: /copy option 1 to clipboard/i }).click();

  // The button text switches to "Copied!" for 2 000 ms
  await expect(firstCard.getByText('Copied!')).toBeVisible();

  // Bonus: verify the clipboard actually received the text
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText.length).toBeGreaterThan(0);
});
