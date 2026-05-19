import React, { useEffect, useState } from 'react';
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

export default function BriefChatCard({ chatCard, fullSummary }: BriefChatCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isModalOpen]);

  return (
    <>
      {/* Card */}
      <div
        className={`surface-card w-full md:w-[320px] md:shrink-0 rounded-xl p-4 flex flex-col gap-3 border ${
          chatCard.actionRequired
            ? 'border-l-4 border-l-[var(--accent-mint)]'
            : 'border-white/[0.12]'
        }`}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <span className="section-kicker text-[10px]">
            Chat {chatCard.index}
          </span>
          {chatCard.actionRequired && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--accent-mint)]">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-mint)]" />
              Action needed
            </span>
          )}
        </div>

        {/* One-liner */}
        <p className="text-sm leading-relaxed line-clamp-3 flex-1 text-slate-200">
          {chatCard.oneLiner || (
            <span className="text-slate-500">No summary available</span>
          )}
        </p>

        {/* View Full button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-auto w-full rounded-lg border border-white/[0.16] bg-white/[0.06] py-2 text-xs font-semibold tracking-wide text-slate-200 transition hover:bg-white/[0.12]"
        >
          View Full
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Full summary for chat ${chatCard.index}`}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors border border-white/[0.12] bg-white/[0.08] text-slate-300 hover:bg-white/[0.12]"
              aria-label="Close modal"
            >
              ✕
            </button>

            <SummaryCard data={fullSummary} />
          </div>
        </div>
      )}
    </>
  );
}
