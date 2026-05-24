import { motion, useReducedMotion } from 'framer-motion';

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

const CONTAINER_VARIANTS = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
};

const REDUCED_ITEM_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const SECTION_SPRING = { type: 'spring', stiffness: 320, damping: 26 } as const;

function SectionHeader({ label, accent }: { label: string; accent?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${accent ?? 'bg-slate-500'}`} />
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
        {label}
      </h3>
      <span className="h-px flex-1 bg-white/[0.06]" />
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-sm text-slate-500 italic">{text}</p>;
}

function BulletItem({ text }: { text: string }) {
  return (
    <motion.li
      className="flex items-start gap-3"
      whileHover={{ x: 1 }}
      transition={SECTION_SPRING}
    >
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600" />
      <span className="text-sm leading-relaxed text-slate-200">{text}</span>
    </motion.li>
  );
}

function ActionItem({ text, index }: { text: string; index: number }) {
  return (
    <motion.li
      className="flex items-start gap-3 py-1.5"
      whileHover={{ x: 1 }}
      transition={SECTION_SPRING}
    >
      <svg
        className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${index === 0 ? 'text-[var(--accent-mint)]' : 'text-slate-500'}`}
        fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
      <span className={`text-sm leading-relaxed ${index === 0 ? 'text-[var(--accent-mint)]/90' : 'text-slate-300'}`}>{text}</span>
    </motion.li>
  );
}

export default function SummaryCard({ data }: SummaryCardProps) {
  const { topic, keyDecisions, actionItems, notableFacts, participants, summaryText } = data;
  const reduced = useReducedMotion();
  const itemV = reduced ? REDUCED_ITEM_VARIANTS : ITEM_VARIANTS;

  return (
    <div className="surface-card rounded-3xl p-6 sm:p-7">
      <motion.div
        variants={itemV}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-2"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]/80">Topic</p>
        <p className="text-2xl font-semibold text-slate-100 leading-snug">
          {topic || <span className="text-slate-600 font-normal italic">No topic identified</span>}
        </p>
        {participants.length > 0 && (
          <p className="text-sm text-slate-400">
            Participants: <span className="text-slate-200">{participants.join(', ')}</span>
          </p>
        )}
      </motion.div>

      <motion.div
        variants={CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
        className="mt-6 space-y-6"
      >
        {/* Summary */}
        <motion.div variants={itemV}>
          <SectionHeader label="Summary" accent="bg-[var(--accent)]" />
          <p className="mt-3 text-base leading-relaxed text-slate-200">
            {summaryText || <EmptyNote text="No summary available" />}
          </p>
        </motion.div>

        {/* Key Decisions */}
        <motion.div variants={itemV}>
          <SectionHeader label="Key Decisions" accent="bg-[var(--accent-warm)]" />
          <div className="mt-3">
            {keyDecisions.length === 0 ? (
              <EmptyNote text="No key decisions recorded" />
            ) : (
              <ul className="space-y-2">
                {keyDecisions.map((item, i) => <BulletItem key={i} text={item} />)}
              </ul>
            )}
          </div>
        </motion.div>

        {/* Action Items */}
        <motion.div variants={itemV}>
          <SectionHeader label="Action Items" accent="bg-[var(--accent-mint)]" />
          <div className="mt-3">
            {actionItems.length === 0 ? (
              <EmptyNote text="No action items recorded" />
            ) : (
              <ul className="space-y-1.5">
                {actionItems.map((item, i) => <ActionItem key={i} text={item} index={i} />)}
              </ul>
            )}
          </div>
        </motion.div>

        {/* Notable Facts */}
        {notableFacts.length > 0 && (
          <motion.div variants={itemV}>
            <SectionHeader label="Notable Facts" accent="bg-slate-500" />
            <div className="mt-3">
              <ul className="space-y-2">
                {notableFacts.map((item, i) => <BulletItem key={i} text={item} />)}
              </ul>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
