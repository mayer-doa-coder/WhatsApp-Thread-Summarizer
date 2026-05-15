import React, { useEffect, useState } from 'react';
import { Message, Tone } from '../services/api';
import useClipboard from '../hooks/useClipboard';
import { useReplyDrafter } from '../hooks/useReplyDrafter';

export interface ReplyDrafterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  contextText: string;
}

const NEU_UP: React.CSSProperties = {
  boxShadow: '-7px -7px 16px rgba(29,33,56,0.75), 7px 7px 16px rgba(6,7,15,1)',
  backgroundColor: '#0e1020',
};

const NEU_IN: React.CSSProperties = {
  boxShadow: 'inset -4px -4px 10px rgba(29,33,56,0.6), inset 4px 4px 10px rgba(6,7,15,0.9)',
  backgroundColor: '#0e1020',
};

const NEU_IN_SM: React.CSSProperties = {
  boxShadow: 'inset -2px -2px 5px rgba(29,33,56,0.6), inset 2px 2px 5px rgba(6,7,15,0.8)',
  backgroundColor: '#0e1020',
};

const TONES: { value: Tone; label: string }[] = [
  { value: 'formal', label: 'Formal' },
  { value: 'casual', label: 'Casual' },
  { value: 'concise', label: 'Concise' },
  { value: 'empathetic', label: 'Empathetic' },
  { value: 'apologetic', label: 'Apologetic' },
  { value: 'assertive', label: 'Assertive' },
];

const PLACEHOLDER_DRAFTS: string[] = [
  'Your first reply option will appear here after you generate drafts.',
  'Your second reply option will appear here after you generate drafts.',
  'Your third reply option will appear here after you generate drafts.',
];

// ── DraftCard ─────────────────────────────────────────────────────────────────

interface DraftCardProps {
  text: string;
  index: number;
  isPlaceholder: boolean;
}

function DraftCard({ text, index, isPlaceholder }: DraftCardProps) {
  const { copyToClipboard, isCopied } = useClipboard();

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (isPlaceholder) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      copyToClipboard(text);
    }
  }

  return (
    <div
      className="rounded-xl p-4 outline-none focus-visible:ring-1 focus-visible:ring-[#25D366]/40"
      style={NEU_UP}
      tabIndex={isPlaceholder ? -1 : 0}
      role={isPlaceholder ? undefined : 'article'}
      aria-label={
        isPlaceholder ? undefined : `Reply option ${index + 1}. Press Enter or Space to copy.`
      }
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[10px] font-semibold tracking-[0.12em] uppercase"
          style={{ color: isPlaceholder ? 'rgba(232,234,246,0.2)' : 'rgba(37,211,102,0.55)' }}
        >
          Option {index + 1}
        </span>
        {!isPlaceholder && (
          <button
            onClick={() => copyToClipboard(text)}
            aria-label={isCopied ? 'Copied to clipboard' : `Copy option ${index + 1} to clipboard`}
            className="rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-150"
            style={
              isCopied
                ? {
                    backgroundColor: 'rgba(37,211,102,0.15)',
                    color: '#25D366',
                    boxShadow: '0 0 0 1px rgba(37,211,102,0.35)',
                  }
                : { ...NEU_IN_SM, color: 'rgba(232,234,246,0.45)' }
            }
          >
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>
      <p
        className="text-sm leading-relaxed"
        style={{ color: isPlaceholder ? 'rgba(232,234,246,0.28)' : 'rgba(232,234,246,0.72)' }}
      >
        {text}
      </p>
    </div>
  );
}

// ── SectionLabel ──────────────────────────────────────────────────────────────

function SectionLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  const cls = 'block text-[10px] font-semibold tracking-[0.15em] uppercase mb-2';
  const style = { color: 'rgba(232,234,246,0.22)' };
  return htmlFor ? (
    <label htmlFor={htmlFor} className={cls} style={style}>
      {children}
    </label>
  ) : (
    <p className={cls} style={style}>
      {children}
    </p>
  );
}

// ── ReplyDrafterPanel ─────────────────────────────────────────────────────────

export default function ReplyDrafterPanel({ isOpen, onClose, contextText }: ReplyDrafterPanelProps) {
  const [selectedTone, setSelectedTone] = useState<Tone>('formal');
  const [userIntent, setUserIntent] = useState('');

  const { loading, error, options, generate } = useReplyDrafter();

  // Build a single-message proxy from contextText so the API gets non-empty messages.
  const proxyMessages: Message[] = [
    {
      timestamp: new Date().toISOString(),
      sender: null,
      content: contextText || 'Please respond to this conversation.',
      type: 'text',
    },
  ];

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  function handleGenerate() {
    generate(proxyMessages, userIntent, selectedTone);
  }

  const displayDrafts = options.length > 0 ? options : PLACEHOLDER_DRAFTS;
  const isPlaceholder = options.length === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backgroundColor: 'rgba(6,7,15,0.72)' }}
      />

      {/* Slide-in panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reply Drafter"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          backgroundColor: '#0e1020',
          boxShadow: '-12px 0 48px rgba(6,7,15,0.9)',
        }}
      >
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div
          className="flex shrink-0 items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(232,234,246,0.06)' }}
        >
          <div>
            <p
              className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-1"
              style={{ color: 'rgba(232,234,246,0.22)' }}
            >
              Reply Drafter
            </p>
            <h2 className="text-base font-bold" style={{ color: '#e8eaf6' }}>
              Draft a Reply
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close reply drafter"
            className="rounded-lg p-2 transition-opacity hover:opacity-60"
            style={{ color: 'rgba(232,234,246,0.4)' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Scrollable body ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Conversation context */}
          <div>
            <SectionLabel>Conversation Context</SectionLabel>
            <div className="rounded-lg p-3" style={NEU_IN}>
              <p
                className="text-xs leading-relaxed line-clamp-4"
                style={{ color: 'rgba(232,234,246,0.45)' }}
              >
                {contextText || 'No context provided.'}
              </p>
            </div>
          </div>

          {/* Tone selector */}
          <div>
            <SectionLabel>Tone</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {TONES.map(({ value, label }) => {
                const active = selectedTone === value;
                return (
                  <button
                    key={value}
                    onClick={() => setSelectedTone(value)}
                    className="rounded-full px-3 py-1 text-xs font-medium transition-all duration-150"
                    style={
                      active
                        ? {
                            backgroundColor: 'rgba(37,211,102,0.12)',
                            color: '#25D366',
                            boxShadow: '0 0 0 1px rgba(37,211,102,0.35)',
                          }
                        : {
                            ...NEU_UP,
                            color: 'rgba(232,234,246,0.4)',
                          }
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User intent */}
          <div>
            <SectionLabel htmlFor="reply-intent">Your Intent</SectionLabel>
            <textarea
              id="reply-intent"
              rows={3}
              value={userIntent}
              onChange={(e) => setUserIntent(e.target.value)}
              placeholder="What do you want to communicate? e.g. agree to the meeting, apologise for the delay…"
              className="w-full resize-none rounded-lg p-3 text-sm outline-none placeholder:opacity-30 focus:ring-1 focus:ring-[#25D366]/30"
              style={{
                ...NEU_IN,
                color: 'rgba(232,234,246,0.8)',
              }}
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full rounded-xl py-2.5 text-sm font-bold transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #2bcc60, #1a9946)',
              color: '#ffffff',
              boxShadow: loading ? 'none' : '0 0 14px rgba(37,211,102,0.25)',
            }}
          >
            {loading ? 'Generating…' : 'Generate Drafts'}
          </button>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                border: '1px solid rgba(239,68,68,0.35)',
                backgroundColor: 'rgba(127,29,29,0.25)',
                color: '#fca5a5',
              }}
            >
              {error}
            </div>
          )}

          {/* Draft cards — Tab-navigable when options are real */}
          <div className="space-y-3 pb-2">
            <SectionLabel>Draft Options</SectionLabel>
            {displayDrafts.map((text, idx) => (
              <DraftCard key={idx} text={text} index={idx} isPlaceholder={isPlaceholder} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
