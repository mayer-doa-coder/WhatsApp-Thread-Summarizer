import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  useActionItems,
  useDecisionItems,
  topicKey,
  type ActionStatus,
} from '../hooks/useActionItems';

export interface SummaryData {
  topic: string;
  keyDecisions: string[];
  actionItems: string[];
  notableFacts: string[];
  participants: string[];
  summaryText: string;
}

interface SummaryCardProps {
  data: SummaryData;
  /** Override the auto-generated localStorage key (e.g. pass history item ID). */
  storageKey?: string;
  /** When true the card is view-only — no editing or status changes. */
  readOnly?: boolean;
}

const SECTION_SPRING = { type: 'spring', stiffness: 320, damping: 26 } as const;
const ITEM_SPRING    = { type: 'spring', stiffness: 380, damping: 30 } as const;

const STATUS_META: Record<ActionStatus, { label: string; nextLabel: string; iconClass: string; textClass: string }> = {
  pending: {
    label:     'Pending',
    nextLabel: 'Mark active',
    iconClass: 'text-slate-600 hover:text-slate-400',
    textClass: 'text-slate-200',
  },
  active: {
    label:     'Active',
    nextLabel: 'Mark done',
    iconClass: 'text-[var(--accent)] drop-shadow-[0_0_4px_rgba(56,189,248,0.6)]',
    textClass: 'text-[var(--accent-mint)]',
  },
  done: {
    label:     'Done',
    nextLabel: 'Reset',
    iconClass: 'text-[var(--accent-mint)]',
    textClass: 'text-slate-500 line-through decoration-slate-600',
  },
};

// ── Status icon ───────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: ActionStatus }) {
  if (status === 'done') {
    return (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    );
  }
  if (status === 'active') {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="5" />
      </svg>
    );
  }
  // pending
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

// ── Interactive action item ───────────────────────────────────────────────────

function InteractiveActionItem({
  text,
  status,
  onCycle,
  onEdit,
  readOnly,
  reduced,
}: {
  text: string;
  status: ActionStatus;
  onCycle: () => void;
  onEdit: (t: string) => void;
  readOnly: boolean;
  reduced: boolean | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(text);
  const taRef                 = useRef<HTMLTextAreaElement>(null);
  const meta                  = STATUS_META[status];

  useEffect(() => { setDraft(text); }, [text]);

  useEffect(() => {
    if (editing && taRef.current) {
      taRef.current.focus();
      const len = taRef.current.value.length;
      taRef.current.setSelectionRange(len, len);
    }
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== text) onEdit(trimmed);
    else setDraft(text);
    setEditing(false);
  }

  return (
    <motion.li
      layout
      className="group flex items-start gap-3 py-1"
      initial={reduced ? { opacity: 0 } : { opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={ITEM_SPRING}
    >
      {/* Status toggle */}
      {readOnly ? (
        <span className={`mt-0.5 shrink-0 ${meta.iconClass}`}>
          <StatusIcon status={status} />
        </span>
      ) : (
        <button
          type="button"
          onClick={onCycle}
          title={meta.nextLabel}
          aria-label={`${meta.label} — click to ${meta.nextLabel.toLowerCase()}`}
          className={`mt-0.5 shrink-0 transition-all duration-150 cursor-pointer ${meta.iconClass}`}
        >
          <StatusIcon status={status} />
        </button>
      )}

      {/* Text / editor */}
      {editing ? (
        <textarea
          ref={taRef}
          value={draft}
          rows={2}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setDraft(text); setEditing(false); }
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); }
          }}
          className="flex-1 resize-none rounded-lg border border-[var(--accent)]/30 bg-white/[0.04] px-2.5 py-1 text-sm text-slate-100 outline-none focus:border-[var(--accent)]/60 focus:ring-1 focus:ring-[var(--accent)]/20"
        />
      ) : (
        <span className="flex-1 min-w-0 flex items-start gap-2">
          <span className={`text-sm leading-relaxed transition-colors duration-150 ${meta.textClass}`}>
            {text}
          </span>
          {!readOnly && (
            <button
              type="button"
              title="Edit"
              aria-label="Edit this action item"
              onClick={() => { setDraft(text); setEditing(true); }}
              className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-slate-600 hover:text-slate-300"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
              </svg>
            </button>
          )}
        </span>
      )}
    </motion.li>
  );
}

// ── Decision item ─────────────────────────────────────────────────────────────

function DecisionItem({
  text,
  acknowledged,
  onToggle,
  readOnly,
  reduced,
}: {
  text: string;
  acknowledged: boolean;
  onToggle: () => void;
  readOnly: boolean;
  reduced: boolean | null;
}) {
  return (
    <motion.li
      layout
      className="group flex items-start gap-3 py-1"
      initial={reduced ? { opacity: 0 } : { opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={ITEM_SPRING}
    >
      {readOnly ? (
        <span className={`mt-0.5 shrink-0 h-1.5 w-1.5 rounded-full ${acknowledged ? 'bg-[var(--accent-mint)]' : 'bg-slate-600'}`} />
      ) : (
        <button
          type="button"
          onClick={onToggle}
          title={acknowledged ? 'Mark as pending' : 'Mark as decided'}
          aria-label={`${acknowledged ? 'Decided' : 'Pending'} — click to toggle`}
          className={`mt-0.5 shrink-0 transition-all duration-150 cursor-pointer ${
            acknowledged ? 'text-[var(--accent-mint)]' : 'text-slate-600 hover:text-slate-400'
          }`}
        >
          {acknowledged ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" />
            </svg>
          )}
        </button>
      )}
      <span className={`text-sm leading-relaxed transition-colors duration-150 ${
        acknowledged ? 'text-slate-500 line-through decoration-slate-600' : 'text-slate-200'
      }`}>
        {text}
      </span>
    </motion.li>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ label, accent, badge }: { label: string; accent?: string; badge?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${accent ?? 'bg-slate-500'}`} />
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">{label}</h3>
      {badge && (
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-slate-500">
          {badge}
        </span>
      )}
      <span className="h-px flex-1 bg-white/[0.06]" />
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-sm text-slate-500 italic">{text}</p>;
}

// ── Action items summary bar ──────────────────────────────────────────────────

function ActionSummaryBar({ pending, active, done }: { pending: number; active: number; done: number }) {
  const total = pending + active + done;
  if (total === 0) return null;
  return (
    <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2 px-0.5">
      {done > 0 && <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-mint)]" />{done} done</span>}
      {active > 0 && <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />{active} active</span>}
      {pending > 0 && <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-slate-600" />{pending} pending</span>}
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

export default function SummaryCard({ data, storageKey, readOnly = false }: SummaryCardProps) {
  const { topic, keyDecisions, actionItems, notableFacts, participants, summaryText } = data;
  const reduced = useReducedMotion();

  const key = storageKey ?? topicKey(topic || summaryText.slice(0, 60));

  const { items: actionStates, cycleStatus, updateText } = useActionItems(key, actionItems);
  const { items: decisionStates, toggle: toggleDecision }  = useDecisionItems(key, keyDecisions);

  const doneCnt    = actionStates.filter((i) => i.status === 'done').length;
  const activeCnt  = actionStates.filter((i) => i.status === 'active').length;
  const pendingCnt = actionStates.filter((i) => i.status === 'pending').length;

  const CONTAINER_V = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
  };
  const SECTION_V = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
  };

  return (
    <div className="surface-card rounded-3xl p-6 sm:p-7">
      {/* ── Topic + participants ── */}
      <motion.div
        variants={SECTION_V}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-2"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]/80">Topic</p>
        <p className="text-2xl font-semibold text-slate-100 leading-snug">
          {topic || <span className="text-slate-600 font-normal italic">No topic identified</span>}
        </p>
        {participants.length > 0 && (
          <p className="text-sm text-slate-400">
            Participants:{' '}
            <span className="text-slate-200">{participants.join(', ')}</span>
          </p>
        )}
      </motion.div>

      <motion.div
        variants={CONTAINER_V}
        initial="hidden"
        animate="visible"
        className="mt-6 space-y-6"
      >
        {/* ── Summary ── */}
        <motion.div variants={SECTION_V}>
          <SectionHeader label="Summary" accent="bg-[var(--accent)]" />
          <p className="mt-3 text-base leading-relaxed text-slate-200">
            {summaryText || <EmptyNote text="No summary available" />}
          </p>
        </motion.div>

        {/* ── Key Decisions ── */}
        <motion.div variants={SECTION_V}>
          <SectionHeader
            label="Key Decisions"
            accent="bg-[var(--accent-warm)]"
            badge={!readOnly ? 'click to acknowledge' : undefined}
          />
          <div className="mt-3">
            {keyDecisions.length === 0 ? (
              <EmptyNote text="No key decisions recorded" />
            ) : (
              <AnimatePresence initial={false}>
                <ul className="space-y-0.5">
                  {decisionStates.map((d, i) => (
                    <DecisionItem
                      key={i}
                      text={d.text}
                      acknowledged={d.acknowledged}
                      onToggle={() => toggleDecision(i)}
                      readOnly={readOnly}
                      reduced={reduced}
                    />
                  ))}
                </ul>
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        {/* ── Action Items ── */}
        <motion.div variants={SECTION_V}>
          <SectionHeader
            label="Action Items"
            accent="bg-[var(--accent-mint)]"
            badge={!readOnly && actionItems.length > 0 ? `${doneCnt}/${actionItems.length} done` : undefined}
          />
          <div className="mt-3">
            {actionItems.length === 0 ? (
              <EmptyNote text="No action items recorded" />
            ) : (
              <>
                <AnimatePresence initial={false}>
                  <ul className="space-y-0.5">
                    {actionStates.map((item, i) => (
                      <InteractiveActionItem
                        key={i}
                        text={item.text}
                        status={item.status}
                        onCycle={() => cycleStatus(i)}
                        onEdit={(t) => updateText(i, t)}
                        readOnly={readOnly}
                        reduced={reduced}
                      />
                    ))}
                  </ul>
                </AnimatePresence>
                {!readOnly && (
                  <ActionSummaryBar pending={pendingCnt} active={activeCnt} done={doneCnt} />
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* ── Notable Facts ── */}
        {notableFacts.length > 0 && (
          <motion.div variants={SECTION_V}>
            <SectionHeader label="Notable Facts" accent="bg-slate-500" />
            <div className="mt-3">
              <ul className="space-y-1.5">
                {notableFacts.map((item, i) => (
                  <motion.li
                    key={i}
                    className="flex items-start gap-3 py-0.5"
                    transition={SECTION_SPRING}
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600" />
                    <span className="text-sm leading-relaxed text-slate-200">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* ── Interactive legend (read-write mode only) ── */}
        {!readOnly && actionItems.length > 0 && (
          <motion.p variants={SECTION_V} className="text-[11px] text-slate-600 border-t border-white/[0.05] pt-4">
            Click the status icon to cycle: pending → active → done.
            Double-click or use the pencil to edit item text.
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
