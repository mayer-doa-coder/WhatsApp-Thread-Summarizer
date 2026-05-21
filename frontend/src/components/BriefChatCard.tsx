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
      <motion.div
        whileHover={reduced ? {} : { y: -4, scale: 1.01 }}
        transition={CARD_SPRING}
        className={`surface-card card-interactive w-full rounded-2xl p-5 flex flex-col gap-3 ${
          chatCard.actionRequired
            ? 'border-l-4 border-l-[var(--accent-mint)] border-r border-t border-b border-[var(--card-border)]'
            : ''
        }`}
        style={chatCard.actionRequired ? {
          background: 'linear-gradient(135deg, rgba(52,211,153,0.06) 0%, rgba(14,22,44,0.6) 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(52,211,153,0.08), inset 0 1px 0 rgba(255,255,255,0.07)',
        } : undefined}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="section-kicker text-[10px]">Chat {chatCard.index}</span>
          {chatCard.actionRequired && (
            <motion.span
              className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--accent-mint)]"
              animate={reduced ? {} : { opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="h-2 w-2 rounded-full bg-[var(--accent-mint)] shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              Action needed
            </motion.span>
          )}
        </div>

        <p className="text-sm leading-relaxed line-clamp-3 flex-1 text-[var(--text-muted)]">
          {chatCard.oneLiner || (
            <span className="text-[var(--text-subtle)]">No summary available</span>
          )}
        </p>

        <motion.button
          onClick={() => setIsModalOpen(true)}
          whileHover={reduced ? {} : { scale: 1.02 }}
          whileTap={reduced ? {} : { scale: 0.96 }}
          transition={CARD_SPRING}
          className="mt-auto w-full rounded-xl border border-[var(--card-border)] bg-[var(--soft-bg)] py-2 text-xs font-semibold tracking-wide text-[var(--text-strong)] transition-all hover:bg-[var(--btn-outline-hover-bg)] hover:border-[var(--accent)]/30 hover:shadow-[0_0_16px_rgba(56,189,248,0.1)] hover:text-[var(--accent)]"
        >
          View Full
        </motion.button>
      </motion.div>

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
