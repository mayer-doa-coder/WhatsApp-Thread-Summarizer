import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { motion, useReducedMotion } from 'framer-motion';
import SummaryCard, { SummaryData } from '../components/SummaryCard';
import ReplyDrafterPanel from '../components/ReplyDrafterPanel';
import { saveToHistory } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

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

const PAGE_SPRING = { type: 'spring', stiffness: 260, damping: 28 } as const;

export default function SummaryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const reduced = useReducedMotion();

  const [isDrafterOpen, setIsDrafterOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLimitReached, setSaveLimitReached] = useState(false);
  const [loading, setLoading] = useState(true);

  const summary = isSummaryData(location.state) ? location.state : null;

  useEffect(() => {
    if (!summary) {
      navigate('/', { replace: true });
    } else {
      setLoading(false);
    }
  }, [summary, navigate]);

  if (!summary) {
    return (
      <div className="page-shell flex items-center justify-center">
        <p className="text-sm text-slate-600">Redirecting…</p>
      </div>
    );
  }

  async function handleSaveToHistory() {
    if (!summary) return;
    setIsSaving(true);
    try {
      await saveToHistory({
        filename: summary.topic || 'Untitled Thread',
        type: 'thread',
        summaryText: summary.summaryText,
        participants: summary.participants,
      });
      setIsSaved(true);
      showSuccess('Saved to history!');
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 402) {
        setSaveLimitReached(true);
        showError('Free plan limit reached (10/10). Visit your Profile to see your usage.');
      } else {
        const msg = isAxiosError(err)
          ? (err.response?.data?.message ?? err.message)
          : 'Failed to save. Please try again.';
        showError(msg);
      }
    } finally {
      setIsSaving(false);
    }
  }

  const contextText = [summary.topic, summary.summaryText].filter(Boolean).join(' — ');

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={PAGE_SPRING}
      className="page-shell px-4 py-8 sm:px-6"
    >
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <p className="section-kicker">Summary</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-100">Conversation Summary</h1>
            <p className="text-sm text-slate-400 mt-0.5">AI-generated from your WhatsApp export</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="btn-outline"
            >
              ← New summary
            </button>

            {user && (
              <button
                onClick={handleSaveToHistory}
                disabled={isSaving || isSaved || saveLimitReached}
                className={[
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors border',
                  isSaved
                    ? 'border-[var(--accent)]/30 bg-[var(--success-bg)] text-[var(--accent)] cursor-default'
                    : saveLimitReached
                    ? 'border-[var(--danger)]/30 bg-red-900/10 text-[var(--danger)] cursor-not-allowed'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed',
                ].join(' ')}
                title={saveLimitReached ? 'Free plan limit reached — visit Profile to upgrade' : undefined}
              >
                {isSaving ? 'Saving…' : isSaved ? '✓ Saved' : saveLimitReached ? '✕ Limit reached' : 'Save to History'}
              </button>
            )}

            <button
              onClick={() => setIsDrafterOpen(true)}
              className="btn-primary"
            >
              Draft a Reply
            </button>
          </div>
        </div>

        {/* Card / skeleton */}
        <div aria-live="polite" aria-busy={loading} className="space-y-6">
          {loading ? (
            <div className="surface-card rounded-2xl p-6 space-y-4 animate-pulse">
              <div className="h-5 w-2/3 rounded-lg bg-white/[0.06]" />
              <div className="h-4 rounded-lg bg-white/[0.04]" />
              <div className="h-4 w-5/6 rounded-lg bg-white/[0.04]" />
              <div className="h-4 w-3/4 rounded-lg bg-white/[0.04]" />
            </div>
          ) : (
            <SummaryCard data={summary} />
          )}
        </div>
      </div>

      <ReplyDrafterPanel
        isOpen={isDrafterOpen}
        onClose={() => setIsDrafterOpen(false)}
        contextText={contextText}
      />
    </motion.div>
  );
}
