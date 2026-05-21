import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import UploadZone from '../components/UploadZone';
import { SummaryType, generateBrief } from '../services/api';
import { useSummarize } from '../hooks/useSummarize';

const SUMMARY_TYPES: { value: SummaryType; label: string; desc: string }[] = [
  { value: 'short',    label: 'Short',    desc: '2–3 sentences' },
  { value: 'medium',   label: 'Medium',   desc: '~100 words'    },
  { value: 'detailed', label: 'Detailed', desc: '~300 words'    },
];

const FOCUS_PILLS = ['Decisions', 'Risks', 'Deadlines', 'Action items', 'Follow-ups'];

const PAGE_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 28 } },
  exit:   { opacity: 0, y: -8, transition: { duration: 0.16 } },
};

const SPRING     = { type: 'spring', stiffness: 380, damping: 26 } as const;
const FAST_SPRING = { type: 'spring', stiffness: 420, damping: 30 } as const;

export default function UploadPage() {
  const navigate = useNavigate();
  const { loading, error, summary, trigger } = useSummarize();
  const reduced = useReducedMotion();

  const [files, setFiles]           = useState<File[]>([]);
  const [zoneError, setZoneError]   = useState<string | undefined>(undefined);
  const [summaryType, setSummaryType] = useState<SummaryType>('medium');
  const [focusPills, setFocusPills] = useState<string[]>([]);
  const [customIntent, setCustomIntent] = useState('');
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError]   = useState<string | null>(null);

  useEffect(() => {
    if (summary) navigate('/summary', { state: summary });
  }, [summary, navigate]);

  const focusOn       = [...focusPills, customIntent.trim()].filter(Boolean).join(', ') || undefined;
  const canProcess    = files.length > 0 && !loading && !briefLoading;
  const canBrief      = files.length >= 2 && !loading && !briefLoading;
  const combinedError = error || briefError;
  const hasCustomize  = focusPills.length > 0 || customIntent.trim().length > 0;

  function togglePill(pill: string) {
    setFocusPills((prev) =>
      prev.includes(pill) ? prev.filter((p) => p !== pill) : [...prev, pill],
    );
  }

  function handleProcess() {
    if (!canProcess) return;
    trigger(files[0], summaryType, focusOn);
  }

  async function handleGenerateBrief() {
    if (!canBrief) return;
    setBriefLoading(true);
    setBriefError(null);
    try {
      const res = await generateBrief({ files });
      navigate('/daily-brief', { state: res.brief });
    } catch (err) {
      if (isAxiosError(err)) {
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

  return (
    <motion.div
      variants={reduced ? {} : PAGE_VARIANTS}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="page-shell flex flex-col items-center justify-center px-4 py-6 sm:py-8"
    >
      <div className="w-full max-w-5xl">

        {/* ── Compact header ─────────────────────────────────── */}
        <motion.div
          initial={reduced ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.04 }}
          className="mb-5 text-center"
        >
          <p className="section-kicker tracking-[0.22em]">Ambient Intelligence</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-gradient">
            Summarize a chat
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Drop a WhatsApp{' '}
            <code className="rounded-md border border-white/[0.12] bg-white/[0.07] px-1.5 py-0.5 font-mono text-xs text-slate-200">.txt</code>
            {' '}export — get an AI summary in seconds.
          </p>
        </motion.div>

        {/* ── Two-column workspace ────────────────────────────── */}
        <motion.div
          initial={reduced ? {} : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-[1fr_260px] lg:grid-cols-[1fr_300px] gap-4"
        >

          {/* ── LEFT: Upload zone ── */}
          <div className="surface-card rounded-3xl p-6 flex flex-col">
            {/* Zone label */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Upload files</p>
              {files.length > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={FAST_SPRING}
                  className="rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/40 px-2.5 py-0.5 text-xs font-semibold text-[var(--accent)]"
                >
                  {files.length} {files.length === 1 ? 'file' : 'files'} ready
                </motion.span>
              )}
            </div>

            {/* Ambient glow wrapper — soft cyan emanation behind the drop zone */}
            <div className="relative flex-1">
              <div
                className="pointer-events-none absolute inset-0 -m-3 rounded-3xl opacity-0 transition-opacity duration-700"
                style={{
                  background: 'radial-gradient(ellipse at 50% 60%, rgba(56,189,248,0.10) 0%, transparent 70%)',
                  opacity: files.length > 0 ? 1 : undefined,
                }}
                aria-hidden="true"
              />
              <UploadZone files={files} setFiles={setFiles} error={zoneError} setError={setZoneError} />
            </div>

            {/* Multi-file hint */}
            <AnimatePresence>
              {files.length === 1 && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={SPRING}
                  className="mt-3 text-xs text-slate-400 text-center overflow-hidden"
                >
                  Add 2+ files to unlock <span className="text-[var(--accent-mint)]">Daily Brief</span>
                </motion.p>
              )}
            </AnimatePresence>

            {/* Export hint */}
            <p className="mt-3 text-center text-xs text-hint">
              WhatsApp: open chat → ⋮ → More → Export chat → Without media
            </p>
          </div>

          {/* ── RIGHT: Controls + CTA ── */}
          <div className="flex flex-col gap-3">

            {/* Summary length */}
            <div className="surface-card rounded-3xl p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                Summary length
              </p>
              <div className="flex flex-col gap-2">
                {SUMMARY_TYPES.map(({ value, label, desc }) => {
                  const active = summaryType === value;
                  return (
                    <motion.button
                      key={value}
                      type="button"
                      onClick={() => setSummaryType(value)}
                      whileTap={reduced ? {} : { scale: 0.97 }}
                      transition={FAST_SPRING}
                      className={[
                        'flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-200',
                        active
                          ? 'radio-btn-active'
                          : 'border-white/[0.1] bg-white/[0.03] hover:border-white/[0.2] hover:bg-white/[0.06]',
                      ].join(' ')}
                    >
                      <span className="min-w-0">
                        <span className={`block text-sm font-semibold ${active ? 'text-[var(--accent)]' : 'text-slate-200'}`}>
                          {label}
                        </span>
                        <span className="block text-xs text-slate-500 mt-0.5">{desc}</span>
                      </span>
                      {active && (
                        <motion.span
                          layoutId="summary-check"
                          className="h-4 w-4 rounded-full border-2 border-[var(--accent)] flex items-center justify-center flex-shrink-0 ml-3"
                          transition={FAST_SPRING}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Customize focus — collapsible */}
            <div className="surface-card rounded-3xl overflow-hidden">
              <motion.button
                type="button"
                onClick={() => setCustomizeOpen((o) => !o)}
                whileTap={reduced ? {} : { scale: 0.98 }}
                transition={FAST_SPRING}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                  </svg>
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Customize focus
                  </span>
                  {hasCustomize && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                  )}
                </span>
                <motion.svg
                  animate={{ rotate: customizeOpen ? 180 : 0 }}
                  transition={FAST_SPRING}
                  className="h-4 w-4 text-slate-500"
                  fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </motion.svg>
              </motion.button>

              <AnimatePresence initial={false}>
                {customizeOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/[0.06] px-6 pb-5 pt-4 space-y-3">
                      <input
                        type="text"
                        value={customIntent}
                        onChange={(e) => setCustomIntent(e.target.value)}
                        placeholder="e.g. Highlight blockers and deadlines"
                        className="input-field text-sm"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {FOCUS_PILLS.map((pill) => {
                          const active = focusPills.includes(pill);
                          return (
                            <motion.button
                              key={pill}
                              type="button"
                              onClick={() => togglePill(pill)}
                              whileTap={reduced ? {} : { scale: 0.91 }}
                              transition={SPRING}
                              className={[
                                'pill text-xs transition-all',
                                active
                                  ? 'bg-[var(--accent)]/20 border-[var(--accent)]/60 text-[var(--accent)] shadow-[0_0_10px_rgba(56,189,248,0.18)]'
                                  : 'hover:border-white/25 hover:text-slate-200',
                              ].join(' ')}
                            >
                              <AnimatePresence initial={false}>
                                {active && (
                                  <motion.span
                                    key="check"
                                    initial={reduced ? {} : { opacity: 0, width: 0, marginRight: 0 }}
                                    animate={{ opacity: 1, width: 'auto', marginRight: 4 }}
                                    exit={{ opacity: 0, width: 0, marginRight: 0 }}
                                    transition={FAST_SPRING}
                                    className="inline-block text-[var(--accent)] overflow-hidden"
                                  >
                                    ✓
                                  </motion.span>
                                )}
                              </AnimatePresence>
                              {pill}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error */}
            <AnimatePresence>
              {combinedError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={SPRING}
                  role="alert"
                  className="overflow-hidden rounded-2xl border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400"
                >
                  {combinedError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA group — pushed to bottom */}
            <div className="mt-auto flex flex-col gap-2.5">
              <motion.button
                onClick={handleProcess}
                disabled={!canProcess}
                aria-busy={loading}
                whileHover={reduced ? {} : canProcess ? { scale: 1.01 } : {}}
                whileTap={reduced ? {} : canProcess ? { scale: 0.97 } : {}}
                transition={SPRING}
                className={[
                  'w-full btn-primary py-3.5 text-base',
                  !canProcess ? 'opacity-50 cursor-not-allowed' : '',
                ].join(' ')}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2.5">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Summarizing…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2l1.8 5.4a1 1 0 00.63.63L20 10l-5.57 1.97a1 1 0 00-.63.63L12 18l-1.8-5.4a1 1 0 00-.63-.63L4 10l5.57-1.97a1 1 0 00.63-.63L12 2z"/>
                      <path d="M19 0l.7 2.1a.4.4 0 00.25.25L22 3l-2.05.75a.4.4 0 00-.25.25L19 6l-.7-2.1a.4.4 0 00-.25-.25L16 3l2.05-.65a.4.4 0 00.25-.25L19 0z" opacity="0.7"/>
                    </svg>
                    Summarize
                  </span>
                )}
              </motion.button>

              <AnimatePresence>
                {files.length >= 2 && (
                  <motion.button
                    initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    transition={SPRING}
                    onClick={handleGenerateBrief}
                    disabled={!canBrief}
                    aria-busy={briefLoading}
                    whileTap={reduced ? {} : canBrief ? { scale: 0.97 } : {}}
                    className={[
                      'w-full btn-outline overflow-hidden',
                      !canBrief ? 'opacity-50 cursor-not-allowed' : '',
                    ].join(' ')}
                  >
                    {briefLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating…
                      </span>
                    ) : `Daily Brief · ${files.length} files`}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

          </div>{/* end right column */}
        </motion.div>

      </div>
    </motion.div>
  );
}
