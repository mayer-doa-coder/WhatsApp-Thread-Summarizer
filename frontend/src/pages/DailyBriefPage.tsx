import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import BriefChatCardWidget from '../components/BriefChatCard';
import { type ChatCardMeta } from '../components/BriefChatCard';
import { type SummaryData } from '../components/SummaryCard';
import { type BriefResult } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AmbientRadar from '../components/AmbientRadar';

const PAGE_SPRING = { type: 'spring', stiffness: 260, damping: 28 } as const;

// ── Mock data — used only as a preview when no real brief has been generated ──

const MOCK_BRIEF: BriefResult = {
  generatedAt: new Date().toISOString(),
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
  totalActionItems: [],
  filesProcessed: 5,
  filesExcluded: 0,
};

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="section-kicker mb-3">{children}</p>;
}

function parseKeyPerson(person: string): { name: string; role: string } {
  const [name, ...rest] = person.split(':');
  return {
    name: name?.trim() ?? person,
    role: rest.join(':').trim(),
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DailyBriefPage() {
  const reduced = useReducedMotion();
  const { token } = useAuth();
  const { showError } = useToast();
  const location = useLocation();
  const realBrief = location.state as BriefResult | null;
  const briefData = realBrief ?? MOCK_BRIEF;
  const isPreview = !realBrief;

  const briefContainerRef = useRef<HTMLDivElement>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isCopiedHtml, setIsCopiedHtml] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) clearTimeout(copyTimeoutRef.current);
    };
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
        body: JSON.stringify(briefData),
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

  const [spatialView, setSpatialView] = useState(false);
  if (spatialView) {
    return <AmbientRadar brief={briefData} onExit={() => setSpatialView(false)} />;
  }

  const { overviewParagraph, chatCards, crossChatInsights, keyPeople } = briefData;

  const briefContainerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const sectionEnterVariants = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
  };

  const chatContainerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.075 } },
  };

  const chatItemVariants = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] } },
  };

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={PAGE_SPRING}
      className="page-shell px-4 py-8 sm:px-6 sm:py-10"
    >
      <div className="mx-auto max-w-6xl space-y-8">

        {/* ── Preview banner ── */}
        {isPreview && (
          <div className="preview-banner rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <p className="preview-banner-text text-sm">
              <span className="font-semibold">Showing example data.</span>{' '}
              Upload 2 or more chat files on the Summarize page to generate a real brief.
            </p>
            <Link to="/" className="btn-primary text-xs shrink-0">
              Go to Summarize →
            </Link>
          </div>
        )}

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-kicker">Daily Brief</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-100">{today}</h1>
            {!isPreview && (
              <p className="mt-1 text-xs text-slate-500">
                {briefData.filesProcessed} file{briefData.filesProcessed !== 1 ? 's' : ''} processed
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setSpatialView(true)}
              className="btn-outline text-xs tracking-wide flex items-center gap-1.5"
              title="Enter 3D Spatial View"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              Spatial View
            </button>
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
        <motion.div
          id="brief-container"
          ref={briefContainerRef}
          className="space-y-8"
          variants={briefContainerVariants}
          initial="hidden"
          animate="visible"
        >

          {/* ── Overview ── */}
          <motion.section variants={sectionEnterVariants}>
            <SectionLabel>Overview</SectionLabel>
            <div className="overview-editorial py-4">
              <p className="reading-measure text-base leading-8 text-[var(--text-muted)]">
                {overviewParagraph}
              </p>
            </div>
          </motion.section>

          {/* ── Chat Cards ── */}
          <motion.section variants={sectionEnterVariants}>
            <SectionLabel>Chats ({chatCards.length})</SectionLabel>
            <motion.div
              className="timeline space-y-5"
              variants={chatContainerVariants}
            >
              {chatCards.map((card, idx) => {
                const cardIndex = card.index ?? idx + 1;
                const chatCardMeta: ChatCardMeta = {
                  index: cardIndex,
                  oneLiner: card.oneLiner ?? card.topic,
                  actionRequired: card.actionRequired ?? false,
                };
                const fullSummary: SummaryData = {
                  topic: card.topic,
                  keyDecisions: card.keyDecisions,
                  actionItems: card.actionItems,
                  notableFacts: card.notableFacts ?? [],
                  participants: card.participants,
                  summaryText: card.summaryText,
                };
                return (
                  <motion.div key={cardIndex} className="timeline-item" variants={chatItemVariants}>
                    <BriefChatCardWidget
                      chatCard={chatCardMeta}
                      fullSummary={fullSummary}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.section>

          {/* ── Cross-Chat Insights ── */}
          <motion.section variants={sectionEnterVariants}>
            <SectionLabel>Cross-Chat Insights</SectionLabel>
            <div className="insights-floating py-3">
              {crossChatInsights.length === 0 ? (
                <p className="text-sm text-[var(--text-subtle)]">
                  No cross-chat connections identified.
                </p>
              ) : (
                <ul className="reading-measure list-disc ml-5 space-y-2">
                  {crossChatInsights.map((insight, i) => (
                    <li key={i} className="text-sm leading-relaxed text-[var(--text-muted)]">
                      {insight}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.section>

          {/* ── Key People Tag Cloud ── */}
          <motion.section variants={sectionEnterVariants}>
            <SectionLabel>Key People</SectionLabel>
            {keyPeople.length === 0 ? (
              <p className="text-sm text-[var(--text-subtle)]">
                No key people identified.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {keyPeople.map((person, i) => {
                  const { name, role } = parseKeyPerson(person);
                  return (
                    <span key={i} className="key-person-chip">
                      <span className="key-person-name">{name}</span>
                      {role ? <span className="key-person-role">: {role}</span> : null}
                    </span>
                  );
                })}
              </div>
            )}
          </motion.section>

        </motion.div>{/* end #brief-container */}

      </div>
    </motion.div>
  );
}
