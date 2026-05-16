import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadZone from '../components/UploadZone';
import { SummaryType } from '../services/api';
import { useSummarize } from '../hooks/useSummarize';

const SUMMARY_TYPES: { value: SummaryType; label: string }[] = [
  { value: 'short',    label: 'Short (2–3 sentences)' },
  { value: 'medium',   label: 'Medium (~100 words)'   },
  { value: 'detailed', label: 'Detailed (~300 words)'  },
];

export default function UploadPage() {
  const navigate = useNavigate();
  const { loading, error, summary, trigger } = useSummarize();

  const [files, setFiles] = useState<File[]>([]);
  const [zoneError, setZoneError] = useState<string | undefined>(undefined);
  const [summaryType, setSummaryType] = useState<SummaryType>('medium');

  useEffect(() => {
    if (summary) {
      navigate('/summary', { state: summary });
    }
  }, [summary, navigate]);

  function handleProcess() {
    if (files.length === 0 || loading) return;
    trigger(files[0], summaryType);
  }

  const isDisabled = files.length === 0 || loading;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0e1020',
        color: '#e8eaf6',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '48px 24px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', color: '#25D366' }}>
        WhatsApp Thread Summarizer
      </h1>
      <p style={{ color: 'rgba(232,234,246,0.35)', marginBottom: '40px', fontSize: '0.9rem' }}>
        Upload a WhatsApp export (.txt) and get an AI-generated summary.
      </p>

      <UploadZone
        files={files}
        setFiles={setFiles}
        error={zoneError}
        setError={setZoneError}
      />

      <div style={{ marginTop: '28px', width: '100%', maxWidth: '400px' }}>
        <label
          htmlFor="summary-type"
          style={{ display: 'block', color: 'rgba(232,234,246,0.45)', fontSize: '0.85rem', marginBottom: '8px' }}
        >
          Summary length
        </label>
        <select
          id="summary-type"
          value={summaryType}
          onChange={(e) => setSummaryType(e.target.value as SummaryType)}
          className="focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-[#0e1020]"
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: '#0e1020',
            color: '#e8eaf6',
            border: '1px solid rgba(232,234,246,0.12)',
            borderRadius: '8px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '-4px -4px 10px rgba(29,33,56,0.6), 4px 4px 10px rgba(6,7,15,0.9)',
          }}
        >
          {SUMMARY_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleProcess}
        disabled={isDisabled}
        aria-busy={loading}
        className="focus:outline-none focus:ring-2 focus:ring-[#25D366]/70 focus:ring-offset-2 focus:ring-offset-[#0e1020]"
        style={{
          marginTop: '24px',
          padding: '12px 40px',
          background: isDisabled
            ? 'rgba(232,234,246,0.06)'
            : 'linear-gradient(135deg, #2bcc60, #1a9946)',
          color: isDisabled ? 'rgba(232,234,246,0.25)' : '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.15s',
          boxShadow: isDisabled ? 'none' : '0 0 14px rgba(37,211,102,0.25)',
        }}
      >
        {loading ? 'Processing…' : 'Process'}
      </button>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {loading ? 'Processing your file, please wait.' : ''}
      </div>

      {error && (
        <div
          role="alert"
          className="border border-red-500 rounded-xl px-5 py-3 mt-6 w-full max-w-md text-sm"
          style={{ backgroundColor: 'rgba(127,29,29,0.35)', color: '#fca5a5' }}
        >
          <span className="font-semibold">Error: </span>{error}
        </div>
      )}
    </div>
  );
}
