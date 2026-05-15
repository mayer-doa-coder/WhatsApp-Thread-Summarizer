import React, { useRef, useState } from 'react';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isTextFile(file: File): boolean {
  return file.type === 'text/plain' || file.name.endsWith('.txt');
}

export default function UploadZone({ onFileSelected }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<File | null>(null);
  const [rejected, setRejected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function accept(file: File) {
    setSelected(file);
    setRejected(false);
    setDragOver(false);
    onFileSelected(file);
  }

  function reject() {
    setRejected(true);
    setDragOver(false);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(true);
    setRejected(false);
  }

  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    isTextFile(file) ? accept(file) : reject();
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    isTextFile(file) ? accept(file) : reject();
    e.target.value = '';
  }

  const borderColor = dragOver
    ? '#25D366'
    : rejected
    ? '#ef4444'
    : selected
    ? '#25D366'
    : '#334155';

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        border: `2px dashed ${borderColor}`,
        borderRadius: '12px',
        backgroundColor: dragOver ? '#0d2a1f' : '#0f172a',
        padding: '48px 32px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background-color 0.15s',
        userSelect: 'none',
        minWidth: '320px',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".txt,text/plain"
        style={{ display: 'none' }}
        onChange={onChange}
      />

      {selected && !rejected ? (
        <div>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>✓</div>
          <p style={{ color: '#25D366', fontWeight: 600, margin: '0 0 4px', fontSize: '1rem' }}>
            {selected.name}
          </p>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            {formatBytes(selected.size)}
          </p>
          <p style={{ color: '#475569', fontSize: '0.75rem', marginTop: '12px' }}>
            Click or drop to replace
          </p>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '2rem', marginBottom: '12px', color: dragOver ? '#25D366' : '#334155' }}>
            ↑
          </div>
          <p style={{ color: '#e2e8f0', fontWeight: 600, margin: '0 0 8px', fontSize: '1rem' }}>
            {dragOver ? 'Drop to upload' : 'Drop your WhatsApp export here'}
          </p>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 16px' }}>
            or click to browse
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
          {rejected && (
            <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '12px', marginBottom: 0 }}>
              Only .txt files are accepted.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
