import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import SummaryCard, { SummaryData } from './SummaryCard';

export interface ChatCardMeta {
  index: number;
  oneLiner: string;
  actionRequired: boolean;
}

interface BriefChatCardProps {
  chatCard: ChatCardMeta;
  fullSummary: SummaryData;
}

const MODAL_SPRING = { type: 'spring', stiffness: 380, damping: 34 } as const;
const CARD_SPRING  = { type: 'spring', stiffness: 320, damping: 28 } as const;

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

  return (
    <>
      {/* Card */}
      <motion.button
        type="button"
        onClick={() => setIsModalOpen(true)}
        whileHover={reduced ? {} : { x: 1 }}
        whileTap={reduced ? {} : { scale: 0.99 }}
        transition={CARD_SPRING}
        className={`brief-chat-feed-item w-full flex flex-col gap-3 text-left ${
          chatCard.actionRequired
            ? 'brief-chat-card-action'
            : ''
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="section-kicker text-xs tracking-wider">Chat {chatCard.index}</span>
          {chatCard.actionRequired && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-mint)]">
              <span className="relative inline-flex h-2 w-2 flex-shrink-0">
                {!reduced && (
                  <span className="action-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-mint)]" />
                )}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent-mint)] shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              </span>
              Action needed
            </span>
          )}
        </div>

        <p className="text-sm leading-relaxed line-clamp-3 flex-1 text-[var(--text-muted)]">
          {chatCard.oneLiner || (
            <span className="text-[var(--text-subtle)]">No summary available</span>
          )}
        </p>

        <div className="mt-auto flex items-center justify-end gap-1.5 text-sm font-semibold text-[var(--text-subtle)]">
          <span className="view-thread-affordance">View thread</span>
          <span aria-hidden="true" className="view-thread-chevron">›</span>
        </div>
      </motion.button>

      {/* Modal */}
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
            aria-label={`Full summary for chat ${chatCard.index}`}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 20 }}
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
