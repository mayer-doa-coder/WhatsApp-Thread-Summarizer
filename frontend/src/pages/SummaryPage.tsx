import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SummaryCard, { SummaryData } from '../components/SummaryCard';
import ReplyDrafterPanel from '../components/ReplyDrafterPanel';
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

export default function SummaryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { showSuccess, showError } = useToast();

  const [isDrafterOpen, setIsDrafterOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
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
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center bg-[#0e1020]">
        <p className="text-sm text-slate-600">Redirecting…</p>
      </div>
    );
  }

  async function handleSaveToHistory() {
    if (!token || !summary) return;
    setIsSaving(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL ?? 'http://localhost:4000'}/api/history`,
        {
          filename: summary.topic || 'Untitled Thread',
          type: 'thread',
          summaryText: summary.summaryText,
          participants: summary.participants,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setIsSaved(true);
      showSuccess('Saved to history!');
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? err.message)
        : 'Failed to save. Please try again.';
      showError(msg);
    } finally {
      setIsSaving(false);
    }
  }

  const contextText = [summary.topic, summary.summaryText].filter(Boolean).join(' — ');

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#0e1020] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Conversation Summary</h1>
            <p className="text-sm text-slate-500 mt-0.5">AI-generated from your WhatsApp export</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-slate-400 hover:border-white/20 hover:text-slate-200 transition-colors"
            >
              ← New summary
            </button>

            {user && (
              <button
                onClick={handleSaveToHistory}
                disabled={isSaving || isSaved}
                className={[
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors border',
                  isSaved
                    ? 'border-[#25D366]/30 bg-[#25D366]/[0.08] text-[#25D366] cursor-default'
                    : 'border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.07] disabled:opacity-50 disabled:cursor-not-allowed',
                ].join(' ')}
              >
                {isSaving ? 'Saving…' : isSaved ? '✓ Saved' : 'Save to History'}
              </button>
            )}

            <button
              onClick={() => setIsDrafterOpen(true)}
              className="rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-[#20bc59] transition-colors"
            >
              Draft a Reply
            </button>
          </div>
        </div>

        {/* Card / skeleton */}
        <div aria-live="polite" aria-busy={loading}>
          {loading ? (
            <div className="rounded-2xl border border-white/[0.07] bg-[#111827] p-6 space-y-4 animate-pulse">
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
    </div>
  );
}
