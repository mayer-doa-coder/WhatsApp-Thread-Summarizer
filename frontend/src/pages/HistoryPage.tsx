import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { deleteHistoryItem, getHistory, type HistoryResponse } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SummaryCard, { type SummaryData } from '../components/SummaryCard';
import { loadHistoryDetail } from '../hooks/useActionItems';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function typeLabel(type: 'thread' | 'brief'): string {
  return type === 'brief' ? 'Daily Brief' : 'Thread Summary';
}

const PAGE_SPRING = { type: 'spring', stiffness: 260, damping: 28 } as const;
const MODAL_SPRING = { type: 'spring', stiffness: 380, damping: 34 } as const;

export default function HistoryPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const reduced = useReducedMotion();

  const [summaries, setSummaries] = useState<HistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<HistoryResponse | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!previewItem) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setPreviewItem(null); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewItem]);

  useEffect(() => {
    if (!token) { navigate('/login', { replace: true }); return; }
    cancelledRef.current = false;
    async function load() {
      try {
        const data = await getHistory();
        if (!cancelledRef.current) setSummaries(data);
      } catch (err) {
        if (!cancelledRef.current) {
          setError(isAxiosError(err) ? (err.response?.data?.message ?? err.message) : 'Failed to load history.');
        }
      } finally {
        if (!cancelledRef.current) setLoading(false);
      }
    }
    load();
    return () => { cancelledRef.current = true; };
  }, [token, navigate]);

  const filtered = summaries.filter((s) => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return s.filename.toLowerCase().includes(t) || s.summaryText.toLowerCase().includes(t) || s.type.includes(t);
  });

  async function handleConfirmDelete() {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    try {
      await deleteHistoryItem(id);
      setSummaries((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(isAxiosError(err) ? (err.response?.data?.message ?? err.message) : 'Delete failed.');
    }
  }

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={PAGE_SPRING}
      className="page-shell px-4 py-8 sm:px-6"
    >
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
          <div>
            <p className="section-kicker">Archive</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-100">History</h1>
            <p className="text-sm text-slate-400 mt-0.5">Your saved summaries and daily briefs</p>
          </div>
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              id="history-search"
              type="search"
              placeholder="Search summaries…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-9 pr-4 py-2 text-sm placeholder-slate-600"
            />
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={PAGE_SPRING}
              role="alert"
              className="mb-5 overflow-hidden rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <div aria-live="polite" aria-busy="true" className="space-y-2">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24, delay: i * 0.07 }}
                className="h-16 rounded-xl border border-white/[0.05] bg-white/[0.02] animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty */}
        <AnimatePresence>
          {!loading && !error && filtered.length === 0 && (
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={PAGE_SPRING}
              className="flex flex-col items-center justify-center mt-20 text-center gap-4"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
                <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {searchTerm ? 'No results found' : 'No saved summaries yet'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {searchTerm ? 'Try a different search term.' : 'Summarize a chat and click "Save to History".'}
                </p>
              </div>
              {!searchTerm && (
                <motion.button
                  onClick={() => navigate('/')}
                  whileTap={reduced ? {} : { scale: 0.96 }}
                  transition={PAGE_SPRING}
                  className="btn-primary"
                >
                  Summarize a chat
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        {!loading && filtered.length > 0 && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={PAGE_SPRING}
            className="surface-card rounded-2xl overflow-hidden"
          >
            <table className="w-full text-left text-sm border-collapse">
              <caption className="sr-only">Your Summary History</caption>
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:table-cell">Type</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">Preview</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                <AnimatePresence initial={false}>
                  {filtered.map((s, i) => (
                    <motion.tr
                      key={s.id}
                      layout
                      initial={reduced ? { opacity: 0 } : { opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduced ? { opacity: 0 } : { opacity: 0, x: 10, transition: { duration: 0.14 } }}
                      transition={{ type: 'spring', stiffness: 300, damping: 26, delay: i * 0.03 }}
                      className="hover:bg-white/[0.04] transition-colors"
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-400">{formatDate(s.createdAt)}</td>
                      <td className="px-4 py-3.5 max-w-[180px]">
                        <span className="block truncate text-sm font-medium text-slate-200" title={s.filename}>{s.filename}</span>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.type === 'brief' ? 'bg-[var(--success-bg)] text-[var(--accent-mint)]' : 'bg-white/[0.08] text-slate-400'}`}>
                          {typeLabel(s.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell max-w-xs">
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{s.summaryText}</p>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <motion.button
                          onClick={() => setPreviewItem(s)}
                          whileTap={reduced ? {} : { scale: 0.93 }}
                          transition={PAGE_SPRING}
                          aria-label={`View summary for ${s.filename}`}
                          className="mr-2 btn-ghost"
                        >
                          View
                        </motion.button>
                        <motion.button
                          onClick={() => setDeleteConfirmId(s.id)}
                          whileTap={reduced ? {} : { scale: 0.93 }}
                          transition={PAGE_SPRING}
                          aria-label={`Delete summary for ${s.filename}`}
                          className="rounded-lg border border-red-900/40 px-3 py-1.5 text-xs font-medium text-red-500/70 hover:border-red-700/50 hover:text-red-400 transition-colors"
                        >
                          Delete
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </motion.div>
        )}
      </div>

      {/* Preview modal — rich view when structured data available, text fallback otherwise */}
      <AnimatePresence>
        {previewItem && (() => {
          const detail = loadHistoryDetail<SummaryData>(previewItem.id);
          return (
            <motion.div
              key="preview-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              role="dialog" aria-modal="true" aria-labelledby="preview-title"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
              onClick={() => setPreviewItem(null)}
            >
              <motion.div
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
                transition={MODAL_SPRING}
                className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal header bar */}
                <div className="sticky top-0 z-10 flex items-center justify-between gap-4 rounded-t-2xl border-b border-white/[0.07] bg-[rgba(10,17,34,0.92)] px-5 py-3.5 backdrop-blur-md">
                  <div className="min-w-0">
                    <h2 id="preview-title" className="text-sm font-semibold text-slate-100 truncate">{previewItem.filename}</h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {formatDate(previewItem.createdAt)}
                      {previewItem.messageCount ? ` · ${previewItem.messageCount} messages` : ''}
                      {' · '}
                      <span className={previewItem.type === 'brief' ? 'text-[var(--accent-mint)]' : 'text-slate-500'}>
                        {typeLabel(previewItem.type)}
                      </span>
                      {detail && (
                        <span className="ml-2 text-[var(--accent)]/60">· full data available</span>
                      )}
                    </p>
                  </div>
                  <motion.button
                    onClick={() => setPreviewItem(null)}
                    whileTap={reduced ? {} : { scale: 0.88, rotate: 90 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    aria-label="Close preview"
                    autoFocus
                    className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                {/* Modal body */}
                {detail ? (
                  /* Rich interactive view */
                  <SummaryCard
                    data={detail}
                    storageKey={previewItem.id}
                  />
                ) : (
                  /* Plain text fallback for older saves */
                  <div className="surface-card rounded-b-2xl rounded-t-none p-6">
                    <p className="text-[11px] text-slate-600 mb-4 italic">
                      This summary was saved before structured data was stored. Re-save after summarizing to unlock interactive features.
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {previewItem.summaryText}
                    </p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteConfirmId !== null && (
          <motion.div
            key="delete-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog" aria-modal="true" aria-labelledby="delete-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
              transition={MODAL_SPRING}
              className="surface-card w-full max-w-sm rounded-2xl p-6 shadow-2xl"
            >
              <h2 id="delete-title" className="text-base font-semibold text-slate-100 mb-1.5">Delete summary?</h2>
              <p className="text-sm text-slate-500 mb-6">This cannot be undone. The summary will be permanently removed.</p>
              <div className="flex justify-end gap-2">
                <motion.button
                  onClick={() => setDeleteConfirmId(null)}
                  whileTap={reduced ? {} : { scale: 0.95 }}
                  transition={MODAL_SPRING}
                  className="btn-outline"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleConfirmDelete}
                  whileTap={reduced ? {} : { scale: 0.95 }}
                  transition={MODAL_SPRING}
                  autoFocus
                  className="rounded-lg bg-red-700 hover:bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors"
                >
                  Confirm Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
