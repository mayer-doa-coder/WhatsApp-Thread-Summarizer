import { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

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

const ITEM_SPRING  = { type: 'spring', stiffness: 320, damping: 26 } as const;
const STATE_SPRING = { type: 'spring', stiffness: 300, damping: 28 } as const;

/* ── Document icon ─────────────────────────────── */
function DocIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

/* ── Trash icon ─────────────────────────────────── */
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

export default function UploadZone({ files, setFiles, error, setError }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [typeRejected, setTypeRejected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Counter prevents false onDragLeave events fired when cursor moves over child elements
  const dragCounterRef = useRef<number>(0);
  const reduced = useReducedMotion();

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

  /* Zone border/bg state classes */
  const zoneClass = [
    'relative w-full rounded-2xl border select-none overflow-hidden',
    'transition-all duration-300 ease-out',
    // Switch border-style: solid + glowing when a file is dragged over, dashed otherwise
    dragOver ? 'border-solid' : 'border-dashed',
    atLimit
      ? 'border-white/[0.05] opacity-50 cursor-default bg-transparent'
      : dragOver
        ? 'border-[var(--accent)] bg-[var(--accent)]/[0.05] shadow-[0_0_50px_rgba(56,189,248,0.25),0_0_0_1px_rgba(56,189,248,0.35),inset_0_0_30px_rgba(56,189,248,0.06)] cursor-copy'
        : files.length > 0
          ? 'border-[var(--accent)]/30 bg-[var(--accent)]/[0.02] cursor-pointer'
          : 'border-white/[0.07] bg-transparent hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/[0.02] hover:shadow-[0_0_28px_rgba(56,189,248,0.08)] cursor-pointer',
  ].join(' ');

  return (
    // Task 1: outer wrapper is now a motion.div
    // Task 2: whileHover scales the whole zone up smoothly with a spring
    <motion.div
      className="w-full"
      whileHover={reduced ? {} : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      {/*
        Using <motion.label> makes the ENTIRE bounding box a native
        click target for the hidden file input — no onClick handler needed.
        The remove buttons call e.preventDefault() to opt out.
      */}
      <motion.label
        htmlFor={atLimit ? undefined : 'upload-zone-input'}
        aria-label={
          atLimit
            ? 'File limit reached.'
            : files.length > 0
              ? 'Files loaded. Click to add more, or drag new files here.'
              : 'Upload WhatsApp export files. Click anywhere or drag .txt files here.'
        }
        // Task 3: onDragEnter/onDragLeave with a counter ref to prevent false leave
        // events triggered when the pointer moves over child elements.
        onDragEnter={(e: React.DragEvent<HTMLLabelElement>) => {
          e.preventDefault();
          dragCounterRef.current += 1;
          if (!atLimit) { setDragOver(true); setTypeRejected(false); }
        }}
        onDragOver={(e: React.DragEvent<HTMLLabelElement>) => {
          // Must preventDefault here to allow the drop event to fire
          e.preventDefault();
        }}
        onDragLeave={(e: React.DragEvent<HTMLLabelElement>) => {
          e.preventDefault();
          dragCounterRef.current -= 1;
          if (dragCounterRef.current === 0) setDragOver(false);
        }}
        onDrop={(e: React.DragEvent<HTMLLabelElement>) => {
          e.preventDefault();
          dragCounterRef.current = 0;
          setDragOver(false);
          if (!atLimit) addFiles(Array.from(e.dataTransfer.files));
        }}
        animate={reduced ? {} : dragOver ? { scale: 1.018 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className={zoneClass}
      >
        {/* Hidden file input */}
        <input
          ref={inputRef}
          id="upload-zone-input"
          type="file"
          accept=".txt,text/plain"
          multiple
          className="sr-only"
          onChange={(e) => { if (e.target.files) { addFiles(Array.from(e.target.files)); e.target.value = ''; } }}
        />

        {/* Drag-over ripple rings */}
        <AnimatePresence>
          {dragOver && !reduced && (
            <>
              {[0, 0.35, 0.7].map((delay, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-2xl border border-[var(--accent)]/18 pointer-events-none"
                  initial={{ opacity: 0.7, scale: 0.92 }}
                  animate={{ opacity: 0, scale: 1.12 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.3, delay, repeat: Infinity, ease: 'easeOut' }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* ── State content (empty / single file / multi-file) ── */}
        <AnimatePresence mode="wait">

          {/* Empty state */}
          {files.length === 0 && (
            <motion.div
              key="empty"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={STATE_SPRING}
              className="flex flex-col items-center justify-center gap-4 px-6 py-10 text-center"
            >
              {/* Task 3: upload icon bounces continuously while a file is dragged over */}
              <motion.div
                animate={
                  reduced ? {} :
                  dragOver
                    ? { y: [0, -8, -4, -8], scale: 1.18 }
                    : { y: 0, scale: 1 }
                }
                transition={
                  reduced ? {} :
                  dragOver
                    ? {
                        y: { repeat: Infinity, duration: 0.85, ease: 'easeInOut' },
                        scale: { type: 'spring', stiffness: 350, damping: 22 },
                      }
                    : { type: 'spring', stiffness: 350, damping: 22 }
                }
                className={[
                  'flex h-14 w-14 items-center justify-center',
                  'transition-all duration-500',
                  dragOver
                    ? 'bg-[var(--accent)]/15 shadow-[0_0_24px_rgba(56,189,248,0.35)]'
                    : 'bg-white/[0.05]',
                  'rounded-[60%_40%_30%_70%/60%_30%_70%_40%]',
                ].join(' ')}
              >
                <svg
                  className={`h-6 w-6 transition-colors duration-300 ${dragOver ? 'text-[var(--accent)]' : 'text-slate-400'}`}
                  fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </motion.div>

              <div>
                <p className={`text-sm font-medium transition-colors duration-300 ${dragOver ? 'text-[var(--accent)]' : 'text-slate-300'}`}>
                  {dragOver ? 'Release to upload' : 'Drop your WhatsApp exports here'}
                </p>
                <p className={`mt-1 text-xs transition-colors duration-300 ${dragOver ? 'text-[var(--accent)]/60' : 'text-slate-500'}`}>
                  or click anywhere to browse · .txt only · up to {MAX_FILES} files
                </p>
              </div>

              <AnimatePresence>
                {typeRejected && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    transition={ITEM_SPRING} role="alert" className="text-xs text-red-400"
                  >
                    Only .txt files are accepted.
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Single file: prominent centered card */}
          {files.length === 1 && (
            <motion.div
              key="single"
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
              transition={STATE_SPRING}
              className="flex flex-col items-center justify-center gap-4 px-6 py-8 text-center"
            >
              {/* Document icon */}
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/25">
                <DocIcon className="h-7 w-7 text-[var(--accent)]" />
              </div>

              {/* File info */}
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-slate-100 max-w-[220px] truncate" title={files[0].name}>
                  {files[0].name}
                </p>
                <p className="text-xs text-slate-400">{formatBytes(files[0].size)}</p>
              </div>

              {/* Prominent remove */}
              <motion.button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFile(0); }}
                whileHover={reduced ? {} : { scale: 1.04 }}
                whileTap={reduced ? {} : { scale: 0.95 }}
                transition={ITEM_SPRING}
                aria-label={`Remove ${files[0].name}`}
                className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 transition-all hover:border-red-400/50 hover:bg-red-500/20 hover:text-red-300"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Remove file
              </motion.button>

              {/* Hint to drop another */}
              {!atLimit && (
                <p className="text-xs text-slate-500">
                  Drop another file or click to add more
                </p>
              )}
            </motion.div>
          )}

          {/* Multi-file: clean inline list */}
          {files.length > 1 && (
            <motion.div
              key="multi"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
              transition={STATE_SPRING}
              className="px-4 py-4"
            >
              <ul className="space-y-1.5" aria-label="Selected files">
                <AnimatePresence initial={false}>
                  {files.map((file, idx) => (
                    <motion.li
                      key={`${file.name}-${file.size}`}
                      layout
                      initial={reduced ? { opacity: 0 } : { opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduced ? { opacity: 0 } : { opacity: 0, x: 10, transition: { duration: 0.13 } }}
                      transition={{ ...ITEM_SPRING, delay: idx * 0.03 }}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 hover:border-[var(--accent)]/22 hover:bg-[var(--accent)]/[0.03] transition-all"
                    >
                      <DocIcon className="h-4 w-4 shrink-0 text-slate-500" />
                      <span className="flex-1 min-w-0 truncate text-sm text-slate-300" title={file.name}>
                        {file.name}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500 tabular-nums">{formatBytes(file.size)}</span>
                      <motion.button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFile(idx); }}
                        whileTap={reduced ? {} : { scale: 0.8 }}
                        transition={ITEM_SPRING}
                        aria-label={`Remove ${file.name}`}
                        className="shrink-0 rounded-lg p-1 text-slate-600 transition-colors hover:bg-red-500/15 hover:text-red-400"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </motion.button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>

              {!atLimit && (
                <p className="mt-3 text-center text-xs text-slate-500">
                  Drop more files or click to add · {files.length} / {MAX_FILES} loaded
                </p>
              )}
              {atLimit && (
                <p className="mt-3 text-center text-xs text-slate-500">
                  {MAX_FILES} / {MAX_FILES} files — limit reached
                </p>
              )}
            </motion.div>
          )}

        </AnimatePresence>

        {/* Type rejection alert (shown over any state) */}
        <AnimatePresence>
          {typeRejected && files.length > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={ITEM_SPRING} role="alert"
              className="absolute bottom-3 left-0 right-0 text-center text-xs text-red-400 px-4"
            >
              Only .txt files are accepted.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.label>

      {/* Field-level error (outside zone) */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={ITEM_SPRING}
            className="mt-2 text-xs text-red-400 px-1 overflow-hidden"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
