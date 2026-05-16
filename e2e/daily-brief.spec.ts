import { test, expect } from '@playwright/test';

// ── Multi-file upload fixtures ─────────────────────────────────────────────────
// Three distinct in-memory chat buffers — no disk I/O needed.
// The /api/upload endpoint is mocked, so content need only be valid .txt bytes.

const MOCK_CHAT_FILES = [
  {
    name: 'chat1.txt',
    mimeType: 'text/plain' as const,
    buffer: Buffer.from(
      '[01/05/2026, 08:00:00 AM] Alice: Planning the Q2 launch.\n' +
      '[01/05/2026, 08:01:00 AM] Bob: June 28th is the target date.\n',
      'utf-8',
    ),
  },
  {
    name: 'chat2.txt',
    mimeType: 'text/plain' as const,
    buffer: Buffer.from(
      '[01/05/2026, 09:00:00 AM] Carol: Invoice dispute resolved with Acme.\n' +
      '[01/05/2026, 09:01:00 AM] Dave: Credit note issued for £1,200.\n',
      'utf-8',
    ),
  },
  {
    name: 'chat3.txt',
    mimeType: 'text/plain' as const,
    buffer: Buffer.from(
      '[01/05/2026, 10:00:00 AM] Emma: August holiday dates confirmed.\n' +
      '[01/05/2026, 10:01:00 AM] Frank: Departure August 3rd, Sara books the hotel.\n',
      'utf-8',
    ),
  },
];

// Minimal syntactically valid PDF — enough for the browser to create a blob URL.
// The test verifies the download event fires, not PDF rendering quality.
const MOCK_PDF_BODY = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 1\n0000000000 65535 f \n' +
  'trailer\n<< /Size 1 /Root 1 0 R >>\nstartxref\n9\n%%EOF\n',
  'ascii',
);

// ── Tests ──────────────────────────────────────────────────────────────────────

test.describe('Daily Brief', () => {
  test.skip(
    !process.env.TEST_EMAIL || !process.env.TEST_PASSWORD,
    'Skipped — set TEST_EMAIL and TEST_PASSWORD to run (auth required for PDF download)',
  );

  test('renders the brief page and initiates a PDF download', async ({ page }) => {
    // Extended timeout: 3-file AI pipeline can take up to 90 s on slow inference
    test.setTimeout(90_000);

    const email = process.env.TEST_EMAIL!;
    const password = process.env.TEST_PASSWORD!;

    // ── 1. Authenticate ──────────────────────────────────────────────────────
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForURL('/', { timeout: 15_000 });

    // ── 2. Demonstrate multi-file upload fixture ─────────────────────────────
    // /api/upload and /api/brief are mocked so this step completes instantly.
    // NOTE: The frontend router does not yet navigate upload → /daily-brief;
    // the test navigates there directly after demonstrating file injection.
    await page.route('**/api/upload', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ files: MOCK_CHAT_FILES.map((f) => ({ filename: f.name, messageCount: 2 })) }),
      }),
    );
    await page.route('**/api/brief', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ brief: {}, model: 'mock', processingMs: 1 }),
      }),
    );

    // Inject all 3 files at once into the hidden file input
    await page.locator('#upload-zone-input').setInputFiles(MOCK_CHAT_FILES);

    // Verify the upload zone lists all three filenames
    await expect(page.getByText('chat1.txt')).toBeVisible();
    await expect(page.getByText('chat2.txt')).toBeVisible();
    await expect(page.getByText('chat3.txt')).toBeVisible();

    // ── 3. Navigate to the Daily Brief page ──────────────────────────────────
    // DailyBriefPage is at /daily-brief and renders MOCK_BRIEF data while the
    // upload→brief navigation pipeline is pending frontend wiring.
    await page.goto('/daily-brief');

    // ── 4. Assert the brief structure is present ─────────────────────────────
    // Section labels are rendered with CSS text-transform:uppercase but the
    // underlying DOM text is title-case, so these matchers work as-is.
    await expect(page.getByText('Overview').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Cross-Chat Insights')).toBeVisible();
    await expect(page.getByText('Key People')).toBeVisible();

    // Assert at least one chat card from MOCK_BRIEF is rendered
    await expect(
      page.getByText('Team agreed to ship Friday pending final QA sign-off.'),
    ).toBeVisible();

    // ── 5. Mock /api/export/pdf to avoid real Puppeteer rendering in E2E ─────
    // The mock must be registered BEFORE clicking the button.
    await page.route('**/api/export/pdf', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        headers: {
          'content-disposition': 'attachment; filename="daily-brief.pdf"',
          'content-length': String(MOCK_PDF_BODY.length),
        },
        body: MOCK_PDF_BODY,
      }),
    );

    // ── 6. Intercept the download event concurrently with the click ──────────
    // waitForEvent must START before the click — Promise.all guarantees ordering.
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /download pdf/i }).click(),
    ]);

    // ── 7. Assert the download initiated with the expected filename ───────────
    // DailyBriefPage sets a.download = `daily-brief-${date}.pdf`
    expect(download.suggestedFilename()).toMatch(/daily-brief.*\.pdf/);

    // Discard the temporary download artifact
    await download.delete();
  });
});
