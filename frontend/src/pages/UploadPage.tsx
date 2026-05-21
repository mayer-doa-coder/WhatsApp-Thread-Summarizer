import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UploadZone from '../components/UploadZone';
import { SummaryType, generateBrief } from '../services/api';
import { useSummarize } from '../hooks/useSummarize';

const SUMMARY_TYPES: { value: SummaryType; label: string; desc: string }[] = [
  { value: 'short',    label: 'Short',    desc: '2–3 sentences'  },
  { value: 'medium',   label: 'Medium',   desc: '~100 words'     },
  { value: 'detailed', label: 'Detailed', desc: '~300 words'     },
];

const FOCUS_PILLS = ['Decisions', 'Risks', 'Deadlines', 'Action items', 'Follow-ups'];

export default function UploadPage() {
  const navigate = useNavigate();
  const { loading, error, summary, trigger } = useSummarize();

  const [files, setFiles] = useState<File[]>([]);
  const [zoneError, setZoneError] = useState<string | undefined>(undefined);
  const [summaryType, setSummaryType] = useState<SummaryType>('medium');

  // Agent intent state
  const [focusPills, setFocusPills] = useState<string[]>([]);
  const [customIntent, setCustomIntent] = useState('');

  // Daily brief state
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  useEffect(() => {
    if (summary) navigate('/summary', { state: summary });
  }, [summary, navigate]);

  const focusOn = [...focusPills, customIntent.trim()].filter(Boolean).join(', ') || undefined;

  function togglePill(pill: string) {
    setFocusPills((prev) =>
      prev.includes(pill) ? prev.filter((p) => p !== pill) : [...prev, pill],
    );
  }

  function handleProcess() {
    if (files.length === 0 || loading) return;
    trigger(files[0], summaryType, focusOn);
  }

  async function handleGenerateBrief() {
    if (files.length < 2 || briefLoading) return;
    setBriefLoading(true);
    setBriefError(null);
    try {
      const res = await generateBrief({ files });
      navigate('/daily-brief', { state: res.brief });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setBriefError(err.response?.data?.message ?? err.message);
      } else if (err instanceof Error) {
        setBriefError(err.message);
      } else {
        setBriefError('Brief generation failed. Please try again.');
      }
    } finally {
      setBriefLoading(false);
    }
  }

  const canProcess = files.length > 0 && !loading && !briefLoading;
  const canBrief = files.length >= 2 && !loading && !briefLoading;
  const combinedError = error || briefError;

  return (
    <div className="page-shell flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl fade-up">
        {/* Page title */}
        <div className="mb-10 text-center">
          <p className="section-kicker">Ambient Intelligence</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-100">Summarize a chat</h1>
          <p className="mt-3 text-sm text-slate-400">
            Upload a WhatsApp <code className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-xs text-slate-300">.txt</code> export and get an AI-generated summary in seconds.
          </p>
        </div>

        {/* Agent intent panel */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Agent intent</p>
              <h2 className="font-display text-2xl text-slate-100 mt-2">Tell the agent what matters most</h2>
              <p className="text-sm text-slate-400 mt-2">Pin the context you want highlighted before summarization.</p>
            </div>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={customIntent}
                onChange={(e) => setCustomIntent(e.target.value)}
                placeholder="e.g. Highlight decisions, blockers, and deadlines"
                className="input-field"
              />
              <div className="flex flex-wrap gap-2">
                {FOCUS_PILLS.map((pill) => {
                  const active = focusPills.includes(pill);
                  return (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => togglePill(pill)}
                      className={[
                        'pill transition-all',
                        active
                          ? 'bg-[var(--accent)]/20 border-[var(--accent)]/60 text-[var(--accent)] shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                          : 'hover:border-white/30 hover:text-slate-200',
                      ].join(' ')}
                    >
                      {active && <span className="mr-1 text-[var(--accent)]">✓</span>}
                      {pill}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main card */}
        <div className="surface-card rounded-3xl p-6 sm:p-8 space-y-6">
          <UploadZone files={files} setFiles={setFiles} error={zoneError} setError={setZoneError} />

          {/* Summary type */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
              Summary length
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SUMMARY_TYPES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSummaryType(value)}
                  className={[
                    'rounded-xl border px-3 py-2.5 text-left transition-all',
                    summaryType === value
                      ? 'border-[var(--accent)]/60 bg-white/[0.08] shadow-[0_0_18px_rgba(56,189,248,0.2)]'
                      : 'border-white/[0.12] bg-white/[0.04] hover:border-white/[0.2] hover:bg-white/[0.08]',
                  ].join(' ')}
                >
                  <span className={`block text-sm font-semibold ${summaryType === value ? 'text-[var(--accent)]' : 'text-slate-200'}`}>
                    {label}
                  </span>
                  <span className="block text-xs text-slate-500 mt-0.5">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Errors */}
          {combinedError && (
            <div role="alert" className="rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">
              {combinedError}
            </div>
          )}

          {/* Summarize single file */}
          <button
            onClick={handleProcess}
            disabled={!canProcess}
            aria-busy={loading}
            className={[
              'w-full',
              canProcess ? 'btn-primary' : 'btn-primary opacity-60 cursor-not-allowed',
            ].join(' ')}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing…
              </span>
            ) : 'Process'}
          </button>

          {/* Generate Daily Brief — only visible when 2+ files are selected */}
          {files.length >= 2 && (
            <button
              onClick={handleGenerateBrief}
              disabled={!canBrief}
              aria-busy={briefLoading}
              className={[
                'w-full btn-outline',
                !canBrief ? 'opacity-60 cursor-not-allowed' : '',
              ].join(' ')}
            >
              {briefLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating brief…
                </span>
              ) : (
                `Generate Daily Brief (${files.length} files)`
              )}
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Export from WhatsApp: open a chat → ⋮ → More → Export chat → Without media
        </p>
      </div>
    </div>
  );
}
