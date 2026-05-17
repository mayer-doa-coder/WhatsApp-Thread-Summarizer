import React, { useEffect, useState } from 'react';
import { Message, Tone } from '../services/api';
import useClipboard from '../hooks/useClipboard';
import { useReplyDrafter } from '../hooks/useReplyDrafter';

export interface ReplyDrafterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  contextText: string;
}

const TONES: { value: Tone; label: string }[] = [
  { value: 'formal',     label: 'Formal'     },
  { value: 'casual',     label: 'Casual'     },
  { value: 'concise',    label: 'Concise'    },
  { value: 'empathetic', label: 'Empathetic' },
  { value: 'apologetic', label: 'Apologetic' },
  { value: 'assertive',  label: 'Assertive'  },
];

const PLACEHOLDER_DRAFTS = [
  'Your first reply option will appear here.',
  'Your second reply option will appear here.',
  'Your third reply option will appear here.',
];

function DraftCard({ text, index, isPlaceholder }: { text: string; index: number; isPlaceholder: boolean }) {
  const { copyToClipboard, isCopied } = useClipboard();

  return (
    <div className={`rounded-xl border p-4 transition-colors ${isPlaceholder ? 'border-white/[0.04] opacity-40' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14]'}`}>
      <div className="flex items-center justify-between mb-2.5">
        <span className={`text-xs font-medium ${isPlaceholder ? 'text-slate-600' : 'text-slate-500'}`}>
          Option {index + 1}
        </span>
        {!isPlaceholder && (
          <button
            onClick={() => copyToClipboard(text)}
            aria-label={isCopied ? 'Copied' : `Copy option ${index + 1}`}
            className={[
              'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
              isCopied
                ? 'bg-[#25D366]/10 text-[#25D366]'
                : 'bg-white/[0.06] text-slate-400 hover:bg-white/[0.1] hover:text-slate-200',
            ].join(' ')}
          >
            {isCopied ? '✓ Copied' : 'Copy'}
          </button>
        )}
      </div>
      <p className={`text-sm leading-relaxed ${isPlaceholder ? 'text-slate-600 italic' : 'text-slate-300'}`}>
        {text}
      </p>
    </div>
  );
}

export default function ReplyDrafterPanel({ isOpen, onClose, contextText }: ReplyDrafterPanelProps) {
  const [selectedTone, setSelectedTone] = useState<Tone>('casual');
  const [userIntent, setUserIntent] = useState('');
  const { loading, error, options, generate } = useReplyDrafter();

  const proxyMessages: Message[] = [{
    timestamp: new Date().toISOString(),
    sender: null,
    content: contextText || 'Please respond to this conversation.',
    type: 'text',
  }];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const displayDrafts = options.length > 0 ? options : PLACEHOLDER_DRAFTS;
  const isPlaceholder = options.length === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Reply Drafter"
        className={[
          'fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl',
          'md:left-auto md:right-0 md:top-0 md:bottom-0 md:w-96 md:rounded-none',
          'border-t border-white/[0.07] md:border-t-0 md:border-l',
          'bg-[#111827] transition-transform duration-300 ease-out',
          'max-h-[88vh] md:max-h-none overflow-hidden',
          isOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full',
        ].join(' ')}
      >
        {/* Mobile drag handle */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Reply Drafter</h2>
            <p className="text-xs text-slate-500 mt-0.5">Generate 3 ready-to-send options</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Context */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Context</p>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                {contextText || 'No context provided.'}
              </p>
            </div>
          </div>

          {/* Tone */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Tone</p>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSelectedTone(value)}
                  className={[
                    'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                    selectedTone === value
                      ? 'border-[#25D366]/40 bg-[#25D366]/[0.1] text-[#25D366]'
                      : 'border-white/[0.07] text-slate-500 hover:border-white/[0.15] hover:text-slate-300',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Intent */}
          <div>
            <label htmlFor="reply-intent" className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">
              Your intent <span className="normal-case text-slate-600">(optional)</span>
            </label>
            <textarea
              id="reply-intent"
              rows={2}
              value={userIntent}
              onChange={(e) => setUserIntent(e.target.value)}
              placeholder="e.g. agree to the meeting but mention I'm 5 min late…"
              className="w-full resize-none rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition focus:border-[#25D366]/40 focus:ring-1 focus:ring-[#25D366]/20"
            />
          </div>

          {/* Generate */}
          <button
            onClick={() => generate(proxyMessages, userIntent, selectedTone)}
            disabled={loading}
            className={[
              'w-full rounded-xl py-2.5 text-sm font-semibold transition-all',
              loading
                ? 'bg-white/[0.05] text-slate-500 cursor-not-allowed'
                : 'bg-[#25D366] text-slate-950 hover:bg-[#20bc59]',
            ].join(' ')}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating…
              </span>
            ) : 'Generate Drafts'}
          </button>

          {error && (
            <div role="alert" className="rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2.5 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Drafts */}
          <div className="space-y-2.5 pb-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Drafts</p>
            {displayDrafts.map((text, idx) => (
              <DraftCard key={idx} text={text} index={idx} isPlaceholder={isPlaceholder} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
