import React, { useRef, useState } from 'react';

const MAX_FILES = 10;

export interface UploadZoneProps {
  files: File[];
  setFiles: (files: File[]) => void;
  error?: string;
  setError?: (err: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isTextFile(file: File): boolean {
  return file.type === 'text/plain' || file.name.endsWith('.txt');
}

export default function UploadZone({ files, setFiles, error, setError }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [typeRejected, setTypeRejected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(incoming: File[]) {
    const textOnly = incoming.filter(isTextFile);
    const hasRejected = textOnly.length < incoming.length;
    setTypeRejected(hasRejected);

    if (textOnly.length === 0) return;

    const newTotal = files.length + textOnly.length;
    if (newTotal > MAX_FILES) {
      const allowed = textOnly.slice(0, MAX_FILES - files.length);
      setFiles([...files, ...allowed]);
      setError?.('Maximum of 10 files allowed.');
    } else {
      setFiles([...files, ...textOnly]);
      if (newTotal <= MAX_FILES) setError?.('');
    }
  }

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    if (next.length < MAX_FILES) setError?.('');
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(true);
    setTypeRejected(false);
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    addFiles(Array.from(e.target.files));
    e.target.value = '';
  }

  const atLimit = files.length >= MAX_FILES;
  const borderColor = dragOver ? '#25D366' : typeRejected || error ? '#ef4444' : files.length > 0 ? '#25D366' : '#334155';

  return (
    <div style={{ width: '100%', maxWidth: '400px' }}>
      {/* Drop zone */}
      <div
        onClick={() => !atLimit && inputRef.current?.click()}
        onDragOver={atLimit ? undefined : onDragOver}
        onDragLeave={atLimit ? undefined : onDragLeave}
        onDrop={atLimit ? undefined : onDrop}
        style={{
          border: `2px dashed ${borderColor}`,
          borderRadius: '12px',
          backgroundColor: dragOver ? '#0d2a1f' : '#0f172a',
          padding: '40px 32px',
          textAlign: 'center',
          cursor: atLimit ? 'not-allowed' : 'pointer',
          transition: 'border-color 0.15s, background-color 0.15s',
          userSelect: 'none',
          opacity: atLimit ? 0.55 : 1,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,text/plain"
          multiple
          style={{ display: 'none' }}
          onChange={onChange}
        />

        <div style={{ fontSize: '2rem', marginBottom: '10px', color: dragOver ? '#25D366' : '#334155' }}>
          ↑
        </div>
        <p style={{ color: '#e2e8f0', fontWeight: 600, margin: '0 0 6px', fontSize: '1rem' }}>
          {dragOver ? 'Drop to upload' : atLimit ? 'File limit reached' : 'Drop your WhatsApp exports here'}
        </p>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 14px' }}>
          {atLimit ? '10 / 10 files added' : `or click to browse · up to ${MAX_FILES} files`}
        </p>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 10px',
            border: '1px solid #1e293b',
            borderRadius: '4px',
            color: '#475569',
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
          }}
        >
          .txt only
        </span>

        {typeRejected && (
          <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '10px', marginBottom: 0 }}>
            Only .txt files are accepted.
          </p>
        )}
      </div>

      {/* 10-file limit warning */}
      {error && (
        <p className="text-red-400 text-xs mt-2 px-1">{error}</p>
      )}

      {/* Selected file list */}
      {files.length > 0 && (
        <ul
          className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1"
          aria-label="Selected files"
        >
          {files.map((file, idx) => (
            <li
              key={`${file.name}-${file.size}-${idx}`}
              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid rgba(37,211,102,0.15)',
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  style={{ color: '#25D366', fontSize: '0.7rem', flexShrink: 0 }}
                >
                  ✓
                </span>
                <span
                  className="truncate text-xs font-medium"
                  style={{ color: '#e2e8f0' }}
                  title={file.name}
                >
                  {file.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span style={{ color: '#64748b', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                  {formatBytes(file.size)}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                  aria-label={`Remove ${file.name}`}
                  className="rounded p-0.5 transition-opacity hover:opacity-60"
                  style={{ color: '#64748b', lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
