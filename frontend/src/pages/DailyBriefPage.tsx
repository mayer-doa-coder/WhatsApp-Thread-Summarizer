import React, { useEffect, useRef, useState } from 'react';
import BriefChatCardWidget from '../components/BriefChatCard';
import { type ChatCardMeta } from '../components/BriefChatCard';
import { type SummaryData } from '../components/SummaryCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// ── Local types ───────────────────────────────────────────────────────────────

interface FullBriefCard extends ChatCardMeta {
  filename: string;
  topic: string;
  participants: string[];
  messageCount: number;
  dateRange: { from: string; to: string };
  actionItems: string[];
  keyDecisions: string[];
  notableFacts: string[];
  summaryText: string;
}

interface DailyBriefData {
  overviewParagraph: string;
  chatCards: FullBriefCard[];
  crossChatInsights: string[];
  keyPeople: string[];
}

// ── Mock data (replaced by router state / API call in a future step) ──────────

const MOCK_BRIEF: DailyBriefData = {
  overviewParagraph:
    'Today was marked by active coordination across five separate threads. The engineering team aligned on a Friday ship date, while the family group finalised holiday plans. A client escalation was resolved by mid-afternoon, and two new project proposals were circulated for review. Overall sentiment was constructive with several clear action items requiring follow-up before end of day.',

  chatCards: [
    {
      index: 1,
      filename: 'work-engineering.txt',
      oneLiner: 'Team agreed to ship Friday pending final QA sign-off.',
      actionRequired: true,
      topic: 'Release planning — v2.4 ship date',
      participants: ['Alice', 'Bob', 'Carol'],
      messageCount: 87,
      dateRange: { from: '2026-05-16T08:00:00Z', to: '2026-05-16T12:30:00Z' },
      keyDecisions: ['Ship on Friday', 'Carol owns the release tag'],
      actionItems: ['Carol will tag the release by 5 PM', 'Bob will update the changelog'],
      notableFacts: ['QA gave sign-off at 11:42 AM', 'No blocking bugs remain'],
      summaryText:
        'The engineering team confirmed the Friday release after QA signed off. Carol is responsible for the release tag and Bob will update the changelog before EOD.',
    },
    {
      index: 2,
      filename: 'client-escalation.txt',
      oneLiner: 'Client invoice dispute resolved — credit note issued.',
      actionRequired: false,
      topic: 'Client escalation — Acme Corp invoice dispute',
      participants: ['Dave', 'Emma'],
      messageCount: 34,
      dateRange: { from: '2026-05-16T09:15:00Z', to: '2026-05-16T14:00:00Z' },
      keyDecisions: ['Issue a credit note for £1,200', 'Escalate to finance team'],
      actionItems: ['Emma will email the credit note by COB', 'Dave to follow up Monday'],
      notableFacts: ['Dispute originated from a duplicate charge in April'],
      summaryText:
        'Dave and Emma resolved a billing dispute with Acme Corp. A credit note for £1,200 will be issued today, with Dave scheduling a Monday follow-up to confirm receipt.',
    },
    {
      index: 3,
      filename: 'family-holiday.txt',
      oneLiner: 'Holiday dates confirmed for August — booking underway.',
      actionRequired: true,
      topic: 'Family holiday planning — August 2026',
      participants: ['Mum', 'Dad', 'Sara'],
      messageCount: 52,
      dateRange: { from: '2026-05-16T07:30:00Z', to: '2026-05-16T10:45:00Z' },
      keyDecisions: ['Depart August 3rd', 'Sara handles hotel booking'],
      actionItems: ['Sara will book the hotel by Sunday', 'Mum will check passport expiry dates'],
      notableFacts: ['Budget capped at £3,000 for the week'],
      summaryText:
        'The family settled on August 3rd as the departure date. Sara agreed to handle the hotel booking by Sunday, and Mum will verify all passports are valid.',
    },
    {
      index: 4,
      filename: 'project-alpha-proposal.txt',
      oneLiner: 'Two competing proposals shared — decision deferred to Thursday.',
      actionRequired: false,
      topic: 'Project Alpha — architecture proposal review',
      participants: ['Alice', 'Frank', 'Grace'],
      messageCount: 63,
      dateRange: { from: '2026-05-16T11:00:00Z', to: '2026-05-16T16:00:00Z' },
      keyDecisions: ['Decision deferred to Thursday all-hands'],
      actionItems: ['Frank will prepare a cost comparison by Wednesday'],
      notableFacts: ['Proposal A favours microservices; Proposal B favours a monolith'],
      summaryText:
        'Alice, Frank, and Grace debated two competing architecture proposals for Project Alpha. No decision was reached; Frank will produce a cost comparison before Thursday\'s all-hands.',
    },
    {
      index: 5,
      filename: 'friends-weekend.txt',
      oneLiner: 'Saturday hiking trip confirmed — meet at 9 AM at Riverside car park.',
      actionRequired: false,
      topic: 'Weekend plans — hiking trip',
      participants: ['Hamid', 'Isla', 'Jack'],
      messageCount: 29,
      dateRange: { from: '2026-05-16T18:00:00Z', to: '2026-05-16T19:30:00Z' },
      keyDecisions: ['Meet Saturday 9 AM at Riverside car park'],
      actionItems: ['Jack will bring extra water', 'Isla will share the route map'],
      notableFacts: ['Weather forecast is clear with 22°C expected'],
      summaryText:
        'The group confirmed a Saturday morning hike leaving from Riverside car park at 9 AM. Jack is bringing extra water and Isla will share the route map overnight.',
    },
  ],

  crossChatInsights: [
    'Alice appears in both the engineering thread and the Project Alpha review, suggesting she is a cross-team decision maker.',
    'Two threads (engineering release and Project Alpha) have Friday/Thursday deadlines — potential calendar conflict for shared team members.',
    'Action items from the client escalation and engineering threads are both time-sensitive within the same business day.',
  ],

  keyPeople: [
    'Alice: Engineering lead & Project Alpha reviewer',
    'Carol: Release owner — v2.4',
    'Emma: Client escalation point of contact',
    'Frank: Project Alpha cost analysis',
    'Sara: Family holiday booking coordinator',
  ],
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="section-kicker mb-3">
      {children}
    </p>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DailyBriefPage() {
  const { token } = useAuth();
  const { showError } = useToast();
  const briefContainerRef = useRef<HTMLDivElement>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isCopiedHtml, setIsCopiedHtml] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setLoading(false);
  }, []);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  async function handleCopyHtml() {
    const innerHTML = briefContainerRef.current?.innerHTML ?? '';
    const doc = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1">',
      '  <title>Daily Brief</title>',
      '  <script src="https://cdn.tailwindcss.com"><\/script>',
      '</head>',
      '<body class="bg-slate-950 text-slate-200 p-8 antialiased">',
      innerHTML,
      '</body>',
      '</html>',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(doc);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = doc;
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    if (copyTimeoutRef.current !== null) clearTimeout(copyTimeoutRef.current);
    setIsCopiedHtml(true);
    copyTimeoutRef.current = setTimeout(() => setIsCopiedHtml(false), 2000);
  }

  async function handleDownloadPdf() {
    setIsDownloadingPdf(true);
    let blobUrl: string | null = null;
    try {
      const apiBase = process.env.REACT_APP_API_URL ?? 'http://localhost:4000';
      const response = await fetch(`${apiBase}/api/export/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(MOCK_BRIEF),
      });
      if (!response.ok) throw new Error(`Export failed: ${response.status}`);
      const blob = await response.blob();
      const filename = `daily-brief-${new Date().toISOString().split('T')[0]}.pdf`;
      blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PDF generation failed. Please try again.';
      showError(msg);
    } finally {
      if (blobUrl) window.URL.revokeObjectURL(blobUrl);
      setIsDownloadingPdf(false);
    }
  }

  const { overviewParagraph, chatCards, crossChatInsights, keyPeople } = MOCK_BRIEF;

  return (
    <div className="page-shell px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl space-y-8 fade-up">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-kicker">Daily Brief</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-100">{today}</h1>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleCopyHtml}
              className={[
                'btn-outline text-xs tracking-wide',
                isCopiedHtml ? 'border-[var(--accent)]/40 bg-[var(--success-bg)] text-[var(--accent)]' : '',
              ].join(' ')}
            >
              {isCopiedHtml ? 'Copied!' : 'Copy as HTML'}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="btn-outline text-xs tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloadingPdf ? 'Generating PDF…' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* ── Serializable content (captured by Copy as HTML) ── */}
        <div id="brief-container" ref={briefContainerRef} className="space-y-8">

        {/* ── Overview ── */}
        <section>
          <SectionLabel>Overview</SectionLabel>
          <div className="surface-card rounded-xl p-5 border-l-4 border-l-[var(--accent-soft)]">
            <p className="text-sm leading-relaxed text-slate-300">
              {overviewParagraph}
            </p>
          </div>
        </section>

        {/* ── Chat Cards (horizontal scroll) ── */}
        <section>
          <SectionLabel>Chats ({loading ? '…' : chatCards.length})</SectionLabel>
          {loading ? (
            <div className="timeline space-y-4 animate-pulse">
              {[0, 1, 2].map((i) => (
                <div key={i} className="timeline-item">
                  <div className="h-40 rounded-2xl bg-white/[0.06]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="timeline space-y-5">
              {chatCards.map((card) => {
                const chatCardMeta: ChatCardMeta = {
                  index: card.index,
                  oneLiner: card.oneLiner,
                  actionRequired: card.actionRequired,
                };
                const fullSummary: SummaryData = {
                  topic: card.topic,
                  keyDecisions: card.keyDecisions,
                  actionItems: card.actionItems,
                  notableFacts: card.notableFacts,
                  participants: card.participants,
                  summaryText: card.summaryText,
                };
                return (
                  <div key={card.index} className="timeline-item">
                    <BriefChatCardWidget
                      chatCard={chatCardMeta}
                      fullSummary={fullSummary}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Cross-Chat Insights ── */}
        <section>
          <SectionLabel>Cross-Chat Insights</SectionLabel>
          <div className="surface-card rounded-xl p-5">
            {crossChatInsights.length === 0 ? (
              <p className="text-sm text-slate-500">
                No cross-chat connections identified.
              </p>
            ) : (
              <ul className="list-disc ml-5 space-y-2">
                {crossChatInsights.map((insight, i) => (
                  <li
                    key={i}
                    className="text-sm leading-relaxed text-slate-300"
                  >
                    {insight}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ── Key People Tag Cloud ── */}
        <section>
          <SectionLabel>Key People</SectionLabel>
          {keyPeople.length === 0 ? (
            <p className="text-sm text-slate-500">
              No key people identified.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {keyPeople.map((person, i) => (
                <span key={i} className="chip text-xs">
                  {person}
                </span>
              ))}
            </div>
          )}
        </section>

        </div>{/* end #brief-container */}

      </div>
    </div>
  );
}
