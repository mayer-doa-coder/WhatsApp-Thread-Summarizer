'use strict';

/**
 * Escapes HTML special characters to prevent XSS in the rendered document.
 * @param {unknown} value
 * @returns {string}
 */
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Renders a bulleted list of strings, or an em-dash if the array is empty.
 * @param {string[]} items
 * @returns {string}
 */
function bulletList(items) {
  if (!Array.isArray(items) || items.length === 0) return '<span style="color:#999;">—</span>';
  return `<ul style="margin:4px 0 0 0;padding-left:18px;">${items.map((s) => `<li style="margin-bottom:3px;">${esc(s)}</li>`).join('')}</ul>`;
}

/**
 * Renders the full Daily Brief as a standalone, PDF-safe HTML document.
 *
 * @param {{
 *   overviewParagraph: string,
 *   chatCards: Array<{
 *     filename: string,
 *     topic: string,
 *     participants: string[],
 *     messageCount: number,
 *     dateRange: { from: string, to: string },
 *     actionItems: string[],
 *     keyDecisions: string[],
 *     summaryText: string,
 *     oneLiner: string,
 *     actionRequired: boolean,
 *   }>,
 *   crossChatInsights: string[],
 *   keyPeople: string[],
 * }} briefData
 * @returns {string} - Complete <!DOCTYPE html> document string
 */
function renderBriefHTML(briefData) {
  const {
    overviewParagraph = '',
    chatCards = [],
    crossChatInsights = [],
    keyPeople = [],
  } = briefData;

  const generatedAt = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const cardsHtml = chatCards.map((card) => {
    const borderColor = card.actionRequired ? '#25D366' : '#e0e0e0';
    const participants = Array.isArray(card.participants) ? card.participants.join(', ') : '—';
    const dateFrom = card.dateRange?.from ? new Date(card.dateRange.from).toLocaleDateString('en-GB') : '';
    const dateTo   = card.dateRange?.to   ? new Date(card.dateRange.to).toLocaleDateString('en-GB')   : '';
    const dateLabel = dateFrom && dateTo ? `${dateFrom} – ${dateTo}` : dateFrom || '—';

    return `
    <div style="
      border-left: 4px solid ${borderColor};
      background: #fafafa;
      border-radius: 4px;
      padding: 16px 20px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    ">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px;">
        <div>
          <h3 style="margin:0;font-size:15px;color:#0e1020;">${esc(card.topic || card.filename)}</h3>
          <p style="margin:2px 0 0;font-size:11px;color:#888;">${esc(card.filename)} &nbsp;·&nbsp; ${esc(participants)} &nbsp;·&nbsp; ${esc(dateLabel)} &nbsp;·&nbsp; ${Number(card.messageCount) || 0} messages</p>
        </div>
        ${card.actionRequired ? `<span style="
          background:#25D366;color:#fff;font-size:10px;font-weight:700;
          padding:2px 8px;border-radius:20px;white-space:nowrap;margin-left:12px;
        ">ACTION REQUIRED</span>` : ''}
      </div>

      <p style="margin:8px 0 10px;font-size:12px;color:#444;font-style:italic;">${esc(card.oneLiner)}</p>

      <p style="margin:0 0 8px;font-size:12px;color:#333;line-height:1.6;">${esc(card.summaryText)}</p>

      ${card.actionItems && card.actionItems.length > 0 ? `
      <div style="margin-top:10px;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#25D366;text-transform:uppercase;letter-spacing:0.05em;">Action Items</p>
        ${bulletList(card.actionItems)}
      </div>` : ''}

      ${card.keyDecisions && card.keyDecisions.length > 0 ? `
      <div style="margin-top:10px;">
        <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#0e1020;text-transform:uppercase;letter-spacing:0.05em;">Key Decisions</p>
        ${bulletList(card.keyDecisions)}
      </div>` : ''}
    </div>`;
  }).join('');

  const insightsHtml = crossChatInsights.length > 0
    ? `<div style="page-break-inside:avoid;margin-bottom:32px;">
        <h2 style="font-size:16px;color:#0e1020;margin:0 0 12px;padding-bottom:6px;border-bottom:2px solid #25D366;">Cross-Chat Insights</h2>
        ${bulletList(crossChatInsights)}
       </div>`
    : '';

  const keyPeopleHtml = keyPeople.length > 0
    ? `<div style="page-break-inside:avoid;margin-bottom:32px;">
        <h2 style="font-size:16px;color:#0e1020;margin:0 0 12px;padding-bottom:6px;border-bottom:2px solid #25D366;">Key People</h2>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${keyPeople.map((p) => `<span style="
            background:#f0fdf4;color:#166534;font-size:11px;font-weight:600;
            padding:4px 12px;border-radius:20px;border:1px solid #bbf7d0;
          ">${esc(p)}</span>`).join('')}
        </div>
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Daily Brief — ${esc(generatedAt)}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 13px;
      line-height: 1.6;
      color: #1a1a2e;
      background: #fff;
      margin: 0;
      padding: 0;
    }
    h1, h2, h3 {
      font-weight: 700;
    }
    ul {
      font-size: 12px;
      color: #444;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="border-bottom:3px solid #25D366;padding-bottom:16px;margin-bottom:28px;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#25D366;text-transform:uppercase;letter-spacing:0.1em;">WhatsApp Thread Summarizer</p>
    <h1 style="margin:0 0 4px;font-size:26px;color:#0e1020;">Daily Brief</h1>
    <p style="margin:0;font-size:12px;color:#888;">${esc(generatedAt)}</p>
  </div>

  <!-- Overview -->
  <div style="margin-bottom:32px;page-break-inside:avoid;">
    <h2 style="font-size:16px;color:#0e1020;margin:0 0 10px;padding-bottom:6px;border-bottom:2px solid #25D366;">Overview</h2>
    <p style="margin:0;font-size:13px;color:#333;line-height:1.7;">${esc(overviewParagraph)}</p>
  </div>

  <!-- Chat Cards -->
  ${chatCards.length > 0 ? `
  <div style="margin-bottom:32px;">
    <h2 style="font-size:16px;color:#0e1020;margin:0 0 16px;padding-bottom:6px;border-bottom:2px solid #25D366;">Chats (${chatCards.length})</h2>
    ${cardsHtml}
  </div>` : ''}

  <!-- Cross-Chat Insights -->
  ${insightsHtml}

  <!-- Key People -->
  ${keyPeopleHtml}

  <!-- Footer -->
  <div style="border-top:1px solid #e5e7eb;padding-top:12px;margin-top:8px;">
    <p style="margin:0;font-size:10px;color:#bbb;text-align:center;">Generated by WhatsApp Thread Summarizer &nbsp;·&nbsp; ${esc(generatedAt)}</p>
  </div>
</body>
</html>`;
}

module.exports = { renderBriefHTML };
