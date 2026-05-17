import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadZone from '../components/UploadZone';
import { SummaryType } from '../services/api';
import { useSummarize } from '../hooks/useSummarize';

const SUMMARY_TYPES: { value: SummaryType; label: string; desc: string }[] = [
  { value: 'short',    label: 'Short',    desc: '2–3 sentences'  },
  { value: 'medium',   label: 'Medium',   desc: '~100 words'     },
  { value: 'detailed', label: 'Detailed', desc: '~300 words'     },
];

export default function UploadPage() {
  const navigate = useNavigate();
  const { loading, error, summary, trigger } = useSummarize();

  const [files, setFiles] = useState<File[]>([]);
  const [zoneError, setZoneError] = useState<string | undefined>(undefined);
  const [summaryType, setSummaryType] = useState<SummaryType>('medium');

  useEffect(() => {
    if (summary) navigate('/summary', { state: summary });
  }, [summary, navigate]);

  function handleProcess() {
    if (files.length === 0 || loading) return;
    trigger(files[0], summaryType);
  }

  const canProcess = files.length > 0 && !loading;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#0e1020] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Page title */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-100">Summarize a chat</h1>
          <p className="mt-2 text-sm text-slate-500">
            Upload a WhatsApp <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-slate-400">.txt</code> export and get an AI-generated summary in seconds.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#111827] p-6 space-y-6">
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
                    'rounded-lg border px-3 py-2.5 text-left transition-all',
                    summaryType === value
                      ? 'border-[#25D366]/50 bg-[#25D366]/[0.08]'
                      : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]',
                  ].join(' ')}
                >
                  <span className={`block text-sm font-semibold ${summaryType === value ? 'text-[#25D366]' : 'text-slate-200'}`}>
                    {label}
                  </span>
                  <span className="block text-xs text-slate-500 mt-0.5">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" className="rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleProcess}
            disabled={!canProcess}
            aria-busy={loading}
            className={[
              'w-full rounded-xl py-3 text-sm font-semibold transition-all',
              canProcess
                ? 'bg-[#25D366] text-slate-950 hover:bg-[#20bc59] shadow-[0_0_20px_rgba(37,211,102,0.2)]'
                : 'bg-white/[0.05] text-slate-600 cursor-not-allowed',
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
        </div>

        <p className="mt-4 text-center text-xs text-slate-600">
          Export from WhatsApp: open a chat → ⋮ → More → Export chat → Without media
        </p>
      </div>
    </div>
  );
}
