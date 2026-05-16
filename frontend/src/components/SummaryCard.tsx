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

const NEU_UP: React.CSSProperties = {
  boxShadow: '-7px -7px 16px rgba(29,33,56,0.75), 7px 7px 16px rgba(6,7,15,1)',
  backgroundColor: '#0e1020',
};

const NEU_IN: React.CSSProperties = {
  boxShadow: 'inset -4px -4px 10px rgba(29,33,56,0.6), inset 4px 4px 10px rgba(6,7,15,0.9)',
  backgroundColor: '#0e1020',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-2"
      style={{ color: 'rgba(232,234,246,0.22)' }}
    >
      {children}
    </p>
  );
}

function InsetBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg p-4" style={NEU_IN}>
      {children}
    </div>
  );
}

function BulletList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'rgba(232,234,246,0.28)' }}>
        {emptyLabel}
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-3 text-sm">
          <span
            className="mt-[5px] h-[6px] w-[6px] shrink-0 rounded-full"
            style={{ backgroundColor: '#25D366', opacity: 0.6 }}
          />
          <span style={{ color: 'rgba(232,234,246,0.65)' }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ActionItemRow({ item, index }: { item: string; index: number }) {
  const intensity = Math.max(0.04, 0.08 - index * 0.015);
  const barOpacity = Math.max(0.25, 0.6 - index * 0.12);
  const isFirst = index === 0;

  return (
    <div
      className="relative flex items-center rounded-md overflow-hidden"
      style={{ backgroundColor: `rgba(37,211,102,${intensity})` }}
    >
      <span
        className="absolute left-0 top-0 h-full w-1 rounded-sm"
        style={{ backgroundColor: '#25D366', opacity: barOpacity }}
      />
      <p
        className="pl-4 pr-3 py-2 text-sm leading-snug"
        style={{
          color: isFirst ? `rgba(37,211,102,0.9)` : 'rgba(232,234,246,0.65)',
        }}
      >
        {item}
      </p>
    </div>
  );
}

export default function SummaryCard({ data }: SummaryCardProps) {
  const { topic, keyDecisions, actionItems, notableFacts, participants, summaryText } = data;

  return (
    <div
      className="rounded-2xl border-l-4 border-[#25D366] p-4 sm:p-6 space-y-6"
      style={NEU_UP}
    >
      {/* Topic */}
      <div>
        <SectionLabel>Topic</SectionLabel>
        <InsetBox>
          <p className="text-sm font-semibold" style={{ color: 'rgba(232,234,246,0.8)' }}>
            {topic || <span style={{ color: 'rgba(232,234,246,0.28)' }}>No topic identified</span>}
          </p>
        </InsetBox>
      </div>

      {/* Summary text */}
      <div>
        <SectionLabel>Summary</SectionLabel>
        <InsetBox>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(232,234,246,0.65)' }}>
            {summaryText || <span style={{ color: 'rgba(232,234,246,0.28)' }}>No summary available</span>}
          </p>
        </InsetBox>
      </div>

      {/* Key Decisions */}
      <div>
        <SectionLabel>Key Decisions</SectionLabel>
        <InsetBox>
          <BulletList items={keyDecisions} emptyLabel="No key decisions recorded" />
        </InsetBox>
      </div>

      {/* Action Items */}
      <div>
        <SectionLabel>Action Items</SectionLabel>
        <div className="rounded-lg p-4 space-y-2" style={NEU_IN}>
          {actionItems.length === 0 ? (
            <p className="text-sm" style={{ color: 'rgba(232,234,246,0.28)' }}>
              No action items recorded
            </p>
          ) : (
            actionItems.map((item, idx) => (
              <ActionItemRow key={idx} item={item} index={idx} />
            ))
          )}
        </div>
      </div>

      {/* Notable Facts */}
      <div>
        <SectionLabel>Notable Facts</SectionLabel>
        <InsetBox>
          <BulletList items={notableFacts} emptyLabel="No notable facts recorded" />
        </InsetBox>
      </div>

      {/* Participants */}
      <div>
        <SectionLabel>Participants</SectionLabel>
        <InsetBox>
          {participants.length === 0 ? (
            <p className="text-sm" style={{ color: 'rgba(232,234,246,0.28)' }}>
              No participants identified
            </p>
          ) : (
            <p className="text-sm" style={{ color: 'rgba(232,234,246,0.55)' }}>
              {participants.join(' · ')}
            </p>
          )}
        </InsetBox>
      </div>
    </div>
  );
}
