import { test, expect, Page } from '@playwright/test';

// ── Mock WhatsApp export ───────────────────────────────────────────────────────
// Uses the iOS 12-hour timestamp format documented in docs/format-research.md.
// Enough messages to produce non-trivial Action Items in the LLM response.
const MOCK_CHAT = [
  '[01/05/2026, 10:30:00 AM] Alice: Hi team, we need to finalise the Q2 launch plan today.',
  '[01/05/2026, 10:30:45 AM] Bob: Agreed. The deadline is June 28th — that gives us 8 weeks.',
  '[01/05/2026, 10:31:22 AM] Alice: Bob, can you prepare the full action items list and share it by Friday?',
  '[01/05/2026, 10:32:01 AM] Bob: Sure. I will also follow up with the stakeholders about the demo schedule.',
  '[01/05/2026, 10:32:55 AM] Charlie: Should we book the venue for the launch event now?',
  '[01/05/2026, 10:33:18 AM] Alice: Yes — book it for June 28th. Charlie, can you own that?',
  '[01/05/2026, 10:33:45 AM] Charlie: On it. I will send invites once the venue is confirmed.',
  '[01/05/2026, 10:34:10 AM] Bob: Who is handling the press release?',
  '[01/05/2026, 10:34:38 AM] Alice: Diana will draft it this week. She needs the feature list by Wednesday.',
  '[01/05/2026, 10:35:02 AM] Bob: I will get her the feature list by Tuesday EOD.',
  '[01/05/2026, 10:35:30 AM] Charlie: Should we do a dry-run demo before the launch?',
  '[01/05/2026, 10:36:00 AM] Alice: Yes — schedule the dry-run for June 21st. Bob, please set that up.',
  '[01/05/2026, 10:36:28 AM] Bob: Will do. I will send a calendar invite today.',
  '[01/05/2026, 10:36:55 AM] Alice: Perfect. Key decisions: launch June 28th, dry-run June 21st, Diana owns press release.',
  '[01/05/2026, 10:37:20 AM] Charlie: Got it. Anything else before we wrap up?',
  '[01/05/2026, 10:37:44 AM] Alice: That covers everything. Let us regroup Friday to review progress.',
].join('\n');

// ── Auth helper ────────────────────────────────────────────────────────────────

/**
 * Logs in via the UI using TEST_EMAIL / TEST_PASSWORD env vars.
 * Skips silently when credentials are not configured — the upload page
 * is public, so the core summarize flow works without authentication.
 * Auth is required only to exercise the "Save to History" button.
 */
async function loginIfCredentialsProvided(page: Page): Promise<void> {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  if (!email || !password) return;

  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  // Wait for redirect back to the upload page after successful login
  await page.waitForURL('/', { timeout: 15_000 });
}

// ── Tests ──────────────────────────────────────────────────────────────────────

test.describe('Upload and Summarize', () => {
  test.beforeEach(async ({ page }) => {
    await loginIfCredentialsProvided(page);
  });

  test('uploads a mock chat export and asserts the summary card renders with Action Items', async ({
    page,
  }) => {
    // ── 1. Navigate to the upload page ────────────────────────────────────────
    await page.goto('/');
    await expect(page).toHaveTitle(/WhatsApp/i);

    // ── 2. Inject the mock file into the hidden <input type="file"> ───────────
    // Playwright's setInputFiles handles hidden inputs (display:none) natively.
    // No disk file is needed — content is passed directly as a Buffer.
    const mockBuffer = Buffer.from(MOCK_CHAT, 'utf-8');
    await page.locator('#upload-zone-input').setInputFiles({
      name: 'chat.txt',
      mimeType: 'text/plain',
      buffer: mockBuffer,
    });

    // The file list should now show the injected filename
    await expect(page.getByText('chat.txt')).toBeVisible();

    // ── 3. Click Process and wait for the AI pipeline to complete ─────────────
    await page.getByRole('button', { name: 'Process' }).click();

    // Button transitions to "Processing…" while the LLM call is in-flight
    await expect(page.getByRole('button', { name: /processing/i })).toBeVisible();

    // ── 4. Wait for navigation to /summary (up to the full 60 s timeout) ──────
    await page.waitForURL('**/summary', { timeout: 60_000 });

    // ── 5. Assert the summary card rendered correctly ─────────────────────────
    // Section labels use CSS text-transform:uppercase visually but the DOM text
    // is title-case, so Playwright text matchers work on the original strings.
    await expect(page.getByText('Action Items')).toBeVisible();
    await expect(page.getByText('Key Decisions')).toBeVisible();
    await expect(page.getByText('Participants')).toBeVisible();

    // The card should contain at least one of our known speakers
    await expect(
      page.locator('text=/Alice|Bob|Charlie/i').first(),
    ).toBeVisible();

    // "Draft a Reply →" button should be present on the summary page
    await expect(page.getByRole('button', { name: /draft a reply/i })).toBeVisible();
  });
});
