import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { deleteHistoryItem, getHistory, type HistoryResponse } from '../services/api';
import { useAuth } from '../context/AuthContext';

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
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    cancelledRef.current = false;

    async function load() {
      try {
        const data = await getHistory();
        if (!cancelledRef.current) setSummaries(data);
      } catch (err) {
        if (!cancelledRef.current) {
          const msg = axios.isAxiosError(err)
            ? (err.response?.data?.message ?? err.message)
            : 'Failed to load history.';
          setError(msg);
        }
      } finally {
        if (!cancelledRef.current) setLoading(false);
      }
    }

    load();
    return () => { cancelledRef.current = true; };
  }, [token, navigate]);

  const filteredSummaries = summaries.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.filename.toLowerCase().includes(term) ||
      s.summaryText.toLowerCase().includes(term) ||
      s.type.toLowerCase().includes(term) ||
      formatDate(s.createdAt).toLowerCase().includes(term)
    );
  });

  async function handleConfirmDelete() {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteConfirmId(null);
    try {
      await deleteHistoryItem(id);
      setSummaries((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? err.message)
        : 'Delete failed. Please try again.';
      setError(msg);
    }
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  function typeLabel(type: 'thread' | 'brief'): string {
    return type === 'brief' ? 'Daily Brief' : 'Thread Summary';
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">History</h1>
            <p className="mt-1 text-sm text-slate-500">Your saved summaries and daily briefs</p>
          </div>
          <div className="w-full max-w-md">
            <label htmlFor="history-search" className="sr-only">Search summaries</label>
            <input
              id="history-search"
              type="search"
              placeholder="Search by filename, type or date…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366]/50 transition"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-500/40 bg-red-900/25 px-4 py-3 text-sm text-red-400"
          >
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div aria-live="polite" aria-busy="true" className="space-y-3 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredSummaries.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-24 text-center">
            <p className="text-slate-500 text-sm">
              {searchTerm ? 'No results match your search.' : 'No saved summaries yet.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/')}
                className="mt-4 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-[#20bc59] focus:outline-none focus:ring-2 focus:ring-[#25D366]/70 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                Summarize a chat
              </button>
            )}
          </div>
        )}

        {/* Table */}
        {!loading && filteredSummaries.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-sm">
              <caption className="sr-only">Your Summary History</caption>
              <thead className="bg-slate-900 text-slate-400 uppercase text-xs tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">Date</th>
                  <th scope="col" className="px-4 py-3">Filename</th>
                  <th scope="col" className="px-4 py-3">Type</th>
                  <th scope="col" className="px-4 py-3">Preview</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummaries.map((s, i) => (
                  <tr
                    key={s.id}
                    className={`border-t border-slate-800 transition-colors ${
                      i % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/40'
                    } hover:bg-slate-800/50`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-slate-400 text-xs">
                      {formatDate(s.createdAt)}
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <span className="block truncate font-medium text-slate-200" title={s.filename}>
                        {s.filename}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                          s.type === 'brief'
                            ? 'bg-[#25D366]/15 text-[#25D366]'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {typeLabel(s.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="line-clamp-2 text-slate-400 text-xs leading-relaxed">
                        {s.summaryText}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setPreviewItem(s)}
                        aria-label={`View summary for ${s.filename}`}
                        className="mr-2 rounded px-3 py-1 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(s.id)}
                        aria-label={`Delete summary for ${s.filename}`}
                        className="rounded px-3 py-1 text-xs font-medium bg-red-900/40 hover:bg-red-800/60 text-red-400 hover:text-red-300 border border-red-800/40 transition focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-950"
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
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-4 sm:p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4 gap-4">
              <div className="min-w-0">
                <h2 id="preview-modal-title" className="text-lg font-semibold text-slate-100 truncate">{previewItem.filename}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatDate(previewItem.createdAt)} · {typeLabel(previewItem.type)} · {previewItem.messageCount} messages
                </p>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                aria-label="Close preview"
                className="flex-shrink-0 text-slate-500 hover:text-slate-200 text-2xl leading-none transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                &times;
              </button>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {previewItem.summaryText}
            </p>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmId !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
        >
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h2 id="delete-modal-title" className="text-lg font-semibold text-slate-100 mb-2">Delete summary?</h2>
            <p className="text-sm text-slate-400 mb-6">
              This cannot be undone. The summary will be permanently removed from your history.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                autoFocus
                className="rounded-lg px-4 py-2 text-sm font-medium bg-red-700 hover:bg-red-600 text-white transition focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
