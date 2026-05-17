import React from 'react';

export interface SummaryData {
  topic: string;
  keyDecisions: string[];
  actionItems: string[];
  notableFacts: string[];
  participants: string[];
  summaryText: string;
}

interface SummaryCardProps {
  data: SummaryData;
}

function SectionHeader({ label }: { label: string }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
      {label}
    </h3>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-sm text-slate-600 italic">{text}</p>;
}

function BulletItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-600" />
      <span className="text-sm leading-relaxed text-slate-300">{text}</span>
    </li>
  );
}

function ActionItem({ text, index }: { text: string; index: number }) {
  return (
    <li className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${index === 0 ? 'bg-[#25D366]/[0.08] border border-[#25D366]/20' : 'bg-white/[0.03]'}`}>
      <svg className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${index === 0 ? 'text-[#25D366]' : 'text-slate-600'}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
      <span className={`text-sm leading-relaxed ${index === 0 ? 'text-[#25D366]/90' : 'text-slate-400'}`}>{text}</span>
    </li>
  );
}

export default function SummaryCard({ data }: SummaryCardProps) {
  const { topic, keyDecisions, actionItems, notableFacts, participants, summaryText } = data;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111827] overflow-hidden">
      {/* Topic bar */}
      <div className="border-b border-white/[0.06] px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Topic</p>
        <p className="text-base font-semibold text-slate-100 leading-snug">
          {topic || <span className="text-slate-600 font-normal italic">No topic identified</span>}
        </p>
      </div>

      <div className="p-6 space-y-7">
        {/* Participants */}
        {participants.length > 0 && (
          <div>
            <SectionHeader label="Participants" />
            <div className="flex flex-wrap gap-2">
              {participants.map((p, i) => (
                <span key={i} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-slate-400">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div>
          <SectionHeader label="Summary" />
          <p className="text-sm leading-relaxed text-slate-400">
            {summaryText || <EmptyNote text="No summary available" />}
          </p>
        </div>

        {/* Key Decisions */}
        <div>
          <SectionHeader label="Key Decisions" />
          {keyDecisions.length === 0 ? (
            <EmptyNote text="No key decisions recorded" />
          ) : (
            <ul className="space-y-2">
              {keyDecisions.map((item, i) => <BulletItem key={i} text={item} />)}
            </ul>
          )}
        </div>

        {/* Action Items */}
        <div>
          <SectionHeader label="Action Items" />
          {actionItems.length === 0 ? (
            <EmptyNote text="No action items recorded" />
          ) : (
            <ul className="space-y-2">
              {actionItems.map((item, i) => <ActionItem key={i} text={item} index={i} />)}
            </ul>
          )}
        </div>

        {/* Notable Facts */}
        {notableFacts.length > 0 && (
          <div>
            <SectionHeader label="Notable Facts" />
            <ul className="space-y-2">
              {notableFacts.map((item, i) => <BulletItem key={i} text={item} />)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
