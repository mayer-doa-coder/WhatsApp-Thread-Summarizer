import React, { useState } from 'react';
import UploadZone from '../components/UploadZone';
import { uploadAndSummarize, SummaryType, SummarizeResponse } from '../services/api';

const SUMMARY_TYPES: { value: SummaryType; label: string }[] = [
  { value: 'short', label: 'Short (2–3 sentences)' },
  { value: 'medium', label: 'Medium (~100 words)' },
  { value: 'detailed', label: 'Detailed (~300 words)' },
];

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [summaryType, setSummaryType] = useState<SummaryType>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<SummarizeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleProcess() {
    if (!selectedFile || isProcessing) return;
    setIsProcessing(true);
    setError(null);
    setResult(null);
    try {
      const summary = await uploadAndSummarize(selectedFile, summaryType);
      console.log('Summary result:', summary);
      setResult(summary);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error.';
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#e2e8f0',
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
      <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '0.9rem' }}>
        Upload a WhatsApp export (.txt) and get an AI-generated summary.
      </p>

      <UploadZone onFileSelected={setSelectedFile} />

      <div style={{ marginTop: '28px', width: '100%', maxWidth: '400px' }}>
        <label
          htmlFor="summary-type"
          style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px' }}
        >
          Summary length
        </label>
        <select
          id="summary-type"
          value={summaryType}
          onChange={(e) => setSummaryType(e.target.value as SummaryType)}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
            borderRadius: '8px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            outline: 'none',
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
        disabled={!selectedFile || isProcessing}
        style={{
          marginTop: '24px',
          padding: '12px 40px',
          backgroundColor: !selectedFile || isProcessing ? '#1e293b' : '#25D366',
          color: !selectedFile || isProcessing ? '#475569' : '#0f172a',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: !selectedFile || isProcessing ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.15s, color 0.15s',
        }}
      >
        {isProcessing ? 'Processing…' : 'Process'}
      </button>

      {error && (
        <div
          style={{
            marginTop: '24px',
            padding: '14px 18px',
            backgroundColor: '#1e293b',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            color: '#ef4444',
            fontSize: '0.875rem',
            maxWidth: '480px',
            width: '100%',
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: '24px',
            padding: '20px',
            backgroundColor: '#1e293b',
            border: '1px solid #25D366',
            borderRadius: '8px',
            maxWidth: '640px',
            width: '100%',
          }}
        >
          <h2 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#25D366' }}>
            {result.summary.topic}
          </h2>
          <p style={{ margin: '0 0 16px', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6 }}>
            {result.summary.summaryText}
          </p>
          {result.summary.actionItems.length > 0 && (
            <div>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 6px' }}>Action items</p>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#cbd5e1', fontSize: '0.875rem' }}>
                {result.summary.actionItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
