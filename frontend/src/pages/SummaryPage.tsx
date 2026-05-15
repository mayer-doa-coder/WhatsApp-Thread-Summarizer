import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SummaryCard, { SummaryData } from '../components/SummaryCard';
import ReplyDrafterPanel from '../components/ReplyDrafterPanel';

const NEU_UP: React.CSSProperties = {
  boxShadow: '-7px -7px 16px rgba(29,33,56,0.75), 7px 7px 16px rgba(6,7,15,1)',
  backgroundColor: '#0e1020',
};

function isSummaryData(value: unknown): value is SummaryData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.topic === 'string' &&
    Array.isArray(v.keyDecisions) &&
    Array.isArray(v.actionItems) &&
    Array.isArray(v.notableFacts) &&
    Array.isArray(v.participants) &&
    typeof v.summaryText === 'string'
  );
}

export default function SummaryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrafterOpen, setIsDrafterOpen] = useState(false);

  const summary = isSummaryData(location.state) ? location.state : null;

  useEffect(() => {
    if (!summary) {
      navigate('/', { replace: true });
    }
  }, [summary, navigate]);

  if (!summary) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#0e1020' }}
      >
        <p className="text-sm" style={{ color: 'rgba(232,234,246,0.35)' }}>
          Redirecting…
        </p>
      </div>
    );
  }

  const contextText = [summary.topic, summary.summaryText].filter(Boolean).join(' — ');

  return (
    <div className="min-h-screen px-6 py-10" style={{ backgroundColor: '#0e1020' }}>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-1"
              style={{ color: 'rgba(232,234,246,0.22)' }}
            >
              Summary
            </p>
            <h1 className="text-xl font-bold" style={{ color: '#e8eaf6' }}>
              Conversation Summary
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="rounded-xl px-5 py-2 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ ...NEU_UP, color: 'rgba(232,234,246,0.45)' }}
            >
              Start Over
            </button>

            <button
              onClick={() => setIsDrafterOpen(true)}
              className="rounded-xl px-5 py-2 text-sm font-bold transition-opacity hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #2bcc60, #1a9946)',
                color: '#ffffff',
                boxShadow: '0 0 14px rgba(37,211,102,0.25)',
              }}
            >
              Draft a Reply →
            </button>
          </div>
        </div>

        {/* Summary card */}
        <SummaryCard data={summary} />
      </div>

      {/* Reply drafter panel — rendered outside the constrained max-w-3xl container */}
      <ReplyDrafterPanel
        isOpen={isDrafterOpen}
        onClose={() => setIsDrafterOpen(false)}
        contextText={contextText}
      />
    </div>
  );
}
