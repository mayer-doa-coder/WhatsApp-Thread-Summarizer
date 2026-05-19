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
    setTypeRejected(textOnly.length < incoming.length);
    if (textOnly.length === 0) return;
    const newTotal = files.length + textOnly.length;
    if (newTotal > MAX_FILES) {
      setFiles([...files, ...textOnly.slice(0, MAX_FILES - files.length)]);
      setError?.('Maximum of 10 files allowed.');
    } else {
      setFiles([...files, ...textOnly]);
      setError?.('');
    }
  }

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    if (next.length < MAX_FILES) setError?.('');
  }

  const atLimit = files.length >= MAX_FILES;

  return (
    <div className="w-full">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={atLimit ? -1 : 0}
        aria-label={
          atLimit
            ? 'File limit reached. Remove a file to add more.'
            : 'Upload WhatsApp export files. Click or press Enter to browse, or drag and drop .txt files here.'
        }
        aria-disabled={atLimit}
        onClick={() => !atLimit && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!atLimit && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => { e.preventDefault(); if (!atLimit) { setDragOver(true); setTypeRejected(false); } }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!atLimit) addFiles(Array.from(e.dataTransfer.files)); }}
        className={[
          'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200 select-none',
          atLimit
            ? 'border-white/[0.06] opacity-50 cursor-not-allowed'
            : dragOver
            ? 'border-[var(--accent)] bg-white/5 shadow-[0_0_22px_rgba(37,99,235,0.25)]'
            : files.length > 0
            ? 'border-[var(--accent)]/50 bg-white/[0.04]'
            : 'border-white/[0.14] bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.06]',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          id="upload-zone-input"
          type="file"
          accept=".txt,text/plain"
          multiple
          className="sr-only"
          onChange={(e) => { if (e.target.files) { addFiles(Array.from(e.target.files)); e.target.value = ''; } }}
        />

        {/* Icon */}
        <div className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${dragOver ? 'bg-white/10' : 'bg-white/[0.05]'}`}>
          <svg className={`h-5 w-5 transition-colors ${dragOver ? 'text-[var(--accent)]' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        <div>
            <p className="text-sm font-medium text-slate-100">
            {dragOver ? 'Drop files to upload' : atLimit ? 'File limit reached' : 'Drop your WhatsApp exports here'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {atLimit ? '10 / 10 files added' : `or click to browse · .txt only · up to ${MAX_FILES} files`}
          </p>
        </div>

        {typeRejected && (
          <p role="alert" className="text-xs text-red-400">Only .txt files are accepted.</p>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-400 px-1">{error}</p>}

      {/* File list */}
      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5" aria-label="Selected files">
          {files.map((file, idx) => (
            <li
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.12] bg-white/[0.05] px-3 py-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-mint)]" />
                <span className="truncate text-sm text-slate-300" title={file.name}>
                  {file.name}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-500">{formatBytes(file.size)}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                  aria-label={`Remove ${file.name}`}
                  className="text-slate-600 hover:text-slate-300 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
