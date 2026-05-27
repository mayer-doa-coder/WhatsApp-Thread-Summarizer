import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import SummaryCard, { SummaryData } from './SummaryCard';

export interface ChatCardMeta {
  index: number;
  filename?: string;
  topic?: string;
  oneLiner: string;
  actionRequired: boolean;
}

interface BriefChatCardProps {
  chatCard: ChatCardMeta;
  fullSummary: SummaryData;
}

const MODAL_SPRING = { type: 'spring', stiffness: 380, damping: 34 } as const;

function cleanLabel(filename: string): string {
  return filename
    .replace(/\.txt$/i, '')
    .replace(/[-_]/g, ' ')
    .toLowerCase();
}

export default function BriefChatCard({ chatCard, fullSummary }: BriefChatCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsModalOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isModalOpen]);

  const label = chatCard.filename
    ? cleanLabel(chatCard.filename)
    : `chat ${chatCard.index}`;

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setIsModalOpen(true)}
        whileTap={reduced ? {} : { scale: 0.998 }}
        className={`brief-chat-feed-item group ${chatCard.actionRequired ? 'brief-chat-card-action' : ''}`}
        aria-label={`Open summary: ${label}`}
      >
        {/*
          3-column editorial row:
          [label]  [summary · constrained width]  [action dot + arrow]
        */}
        <div className="flex items-center gap-5 sm:gap-7 w-full">

          {/* ── Column 1: Chat label (fixed width) ── */}
          <div className="w-[6.5rem] sm:w-[8rem] shrink-0 flex flex-col gap-0.5 overflow-hidden">
            <span className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 group-hover:text-slate-400 transition-colors duration-150">
              {label}
            </span>
            {chatCard.actionRequired && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--accent-mint)] opacity-80">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-mint)] shrink-0" />
                action
              </span>
            )}
          </div>

          {/* ── Column 2: Summary text (constrained, grows) ── */}
          <p className="flex-1 min-w-0 text-[13.5px] leading-relaxed text-[var(--text-muted)] line-clamp-2 group-hover:text-[var(--text-strong)] transition-colors duration-150 max-w-[58ch]">
            {chatCard.oneLiner || (
              <span className="text-[var(--text-subtle)] italic">No summary available</span>
            )}
          </p>

          {/* ── Column 3: Arrow affordance ── */}
          <div className="shrink-0 ml-auto pl-2">
            <svg
              className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-[3px] transition-all duration-150"
              fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </div>
      </motion.button>

      {/* Full-summary modal — layout unchanged */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`Full summary for ${label}`}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.93, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
              transition={MODAL_SPRING}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                onClick={() => setIsModalOpen(false)}
                whileTap={reduced ? {} : { scale: 0.88, rotate: 90 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all border border-white/[0.12] bg-white/[0.08] text-slate-300 hover:bg-[var(--accent)]/15 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                aria-label="Close modal"
              >
                ✕
              </motion.button>
              <SummaryCard data={fullSummary} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
