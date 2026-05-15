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

const NEU_UP: React.CSSProperties = {
  boxShadow: '-7px -7px 16px rgba(29,33,56,0.75), 7px 7px 16px rgba(6,7,15,1)',
  backgroundColor: '#0e1020',
};

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
        className={`w-[320px] shrink-0 rounded-xl p-4 flex flex-col gap-3 border ${
          chatCard.actionRequired
            ? 'border-l-4 border-l-[#25D366] border-slate-700'
            : 'border-slate-700'
        }`}
        style={NEU_UP}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <span
            className="text-[10px] font-semibold tracking-[0.15em] uppercase"
            style={{ color: 'rgba(232,234,246,0.22)' }}
          >
            Chat {chatCard.index}
          </span>
          {chatCard.actionRequired && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-[#25D366]">
              <span className="h-2 w-2 rounded-full bg-[#25D366]" />
              Action needed
            </span>
          )}
        </div>

        {/* One-liner */}
        <p
          className="text-sm leading-relaxed line-clamp-3 flex-1"
          style={{ color: 'rgba(232,234,246,0.75)' }}
        >
          {chatCard.oneLiner || (
            <span style={{ color: 'rgba(232,234,246,0.28)' }}>No summary available</span>
          )}
        </p>

        {/* View Full button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-auto w-full rounded-md py-2 text-xs font-semibold tracking-wide transition-colors"
          style={{
            backgroundColor: 'rgba(37,211,102,0.1)',
            color: '#25D366',
            border: '1px solid rgba(37,211,102,0.25)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(37,211,102,0.18)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(37,211,102,0.1)';
          }}
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
              className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors"
              style={{
                backgroundColor: 'rgba(232,234,246,0.08)',
                color: 'rgba(232,234,246,0.55)',
                border: '1px solid rgba(232,234,246,0.12)',
              }}
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
