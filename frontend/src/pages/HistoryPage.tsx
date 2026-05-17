import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { deleteHistoryItem, getHistory, type HistoryResponse } from '../services/api';
import { useAuth } from '../context/AuthContext';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function typeLabel(type: 'thread' | 'brief'): string {
  return type === 'brief' ? 'Daily Brief' : 'Thread Summary';
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

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
          setError(axios.isAxiosError(err) ? (err.response?.data?.message ?? err.message) : 'Failed to load history.');
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
      setError(axios.isAxiosError(err) ? (err.response?.data?.message ?? err.message) : 'Delete failed.');
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#0e1020] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
          <div>
            <h1 className="text-xl font-bold text-slate-100">History</h1>
            <p className="text-sm text-slate-500 mt-0.5">Your saved summaries and daily briefs</p>
          </div>
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              id="history-search"
              type="search"
              placeholder="Search summaries…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none transition focus:border-[#25D366]/40 focus:ring-1 focus:ring-[#25D366]/20"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="mb-5 rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div aria-live="polite" aria-busy="true" className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl border border-white/[0.05] bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-20 text-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
              <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">
                {searchTerm ? 'No results found' : 'No saved summaries yet'}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {searchTerm ? 'Try a different search term.' : 'Summarize a chat and click "Save to History".'}
              </p>
            </div>
            {!searchTerm && (
              <button
                onClick={() => navigate('/')}
                className="rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-[#20bc59] transition-colors"
              >
                Summarize a chat
              </button>
            )}
          </div>
        )}

        {/* List */}
        {!loading && filtered.length > 0 && (
          <div className="rounded-xl border border-white/[0.07] overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <caption className="sr-only">Your Summary History</caption>
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Type</th>
                  <th scope="col" className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Preview</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-500">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-3.5 max-w-[180px]">
                      <span className="block truncate text-sm font-medium text-slate-200" title={s.filename}>{s.filename}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.type === 'brief' ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-white/[0.06] text-slate-400'}`}>
                        {typeLabel(s.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell max-w-xs">
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{s.summaryText}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setPreviewItem(s)}
                        aria-label={`View summary for ${s.filename}`}
                        className="mr-2 rounded-lg border border-white/[0.07] px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-white/[0.15] hover:text-slate-200 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(s.id)}
                        aria-label={`Delete summary for ${s.filename}`}
                        className="rounded-lg border border-red-900/40 px-3 py-1.5 text-xs font-medium text-red-500/70 hover:border-red-700/50 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewItem && (
        <div
          role="dialog" aria-modal="true" aria-labelledby="preview-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-white/[0.09] bg-[#111827] p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="min-w-0">
                <h2 id="preview-title" className="text-base font-semibold text-slate-100 truncate">{previewItem.filename}</h2>
                <p className="text-xs text-slate-500 mt-1">{formatDate(previewItem.createdAt)} · {typeLabel(previewItem.type)} · {previewItem.messageCount} messages</p>
              </div>
              <button onClick={() => setPreviewItem(null)} aria-label="Close preview" autoFocus
                className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-colors">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{previewItem.summaryText}</p>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirmId !== null && (
        <div
          role="dialog" aria-modal="true" aria-labelledby="delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.09] bg-[#111827] p-6 shadow-2xl">
            <h2 id="delete-title" className="text-base font-semibold text-slate-100 mb-1.5">Delete summary?</h2>
            <p className="text-sm text-slate-500 mb-6">This cannot be undone. The summary will be permanently removed.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-white/[0.08] px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:border-white/20 transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirmDelete} autoFocus
                className="rounded-lg bg-red-700 hover:bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors">
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
