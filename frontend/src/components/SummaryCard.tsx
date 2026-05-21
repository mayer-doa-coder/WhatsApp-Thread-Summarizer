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
    <div className="flex items-center gap-2 mb-3">
      {accent && (
        <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${accent}`} />
      )}
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
        {label}
      </h3>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-sm text-slate-500 italic">{text}</p>;
}

function BulletItem({ text }: { text: string }) {
  return (
    <motion.li
      className="flex items-start gap-3 group"
      whileHover={{ x: 2 }}
      transition={SECTION_SPRING}
    >
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600 group-hover:bg-[var(--accent)] transition-colors duration-200" />
      <span className="text-sm leading-relaxed text-slate-200">{text}</span>
    </motion.li>
  );
}

function ActionItem({ text, index }: { text: string; index: number }) {
  return (
    <motion.li
      className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 cursor-default ${
        index === 0
          ? 'bg-[var(--success-bg)] border border-[var(--accent-mint)]/40 shadow-[0_0_20px_rgba(16,185,129,0.18)]'
          : 'bg-white/[0.03] border border-white/[0.06]'
      }`}
      whileHover={{ scale: 1.01, x: 2 }}
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
    <div className="surface-card rounded-2xl overflow-hidden">
      {/* Gradient topic bar */}
      <motion.div
        variants={itemV}
        initial="hidden"
        animate="visible"
        className="relative border-b border-white/[0.1] px-6 py-5 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(52,211,153,0.05) 50%, rgba(14,20,38,0.6) 100%)',
        }}
      >
        {/* Decorative blob */}
        <div
          className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }}
        />
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]/70 mb-1">Topic</p>
        <p className="text-base font-semibold text-slate-100 leading-snug relative z-10">
          {topic || <span className="text-slate-600 font-normal italic">No topic identified</span>}
        </p>
      </motion.div>

      <motion.div
        variants={CONTAINER_VARIANTS}
        initial="hidden"
        animate="visible"
        className="p-6 space-y-7"
      >
        {/* Participants */}
        {participants.length > 0 && (
          <motion.div variants={itemV}>
            <SectionHeader label="Participants" accent="bg-[var(--accent-violet)]" />
            <div className="flex flex-wrap gap-2">
              {participants.map((p, i) => (
                <motion.span
                  key={i}
                  initial={reduced ? {} : { opacity: 0, scale: 0.8, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  whileHover={reduced ? {} : { scale: 1.06, y: -1 }}
                  transition={{ type: 'spring', stiffness: 340, damping: 22, delay: i * 0.05 }}
                  className="rounded-full border border-white/[0.12] bg-white/[0.05] px-3 py-1 text-xs text-slate-300 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] hover:bg-[var(--accent)]/5 transition-colors cursor-default"
                >
                  {p}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Summary */}
        <motion.div variants={itemV}>
          <SectionHeader label="Summary" accent="bg-[var(--accent)]" />
          <p className="text-sm leading-relaxed text-slate-300">
            {summaryText || <EmptyNote text="No summary available" />}
          </p>
        </motion.div>

        {/* Key Decisions */}
        <motion.div variants={itemV}>
          <SectionHeader label="Key Decisions" accent="bg-[var(--accent-warm)]" />
          {keyDecisions.length === 0 ? (
            <EmptyNote text="No key decisions recorded" />
          ) : (
            <ul className="space-y-2">
              {keyDecisions.map((item, i) => <BulletItem key={i} text={item} />)}
            </ul>
          )}
        </motion.div>

        {/* Action Items */}
        <motion.div variants={itemV}>
          <SectionHeader label="Action Items" accent="bg-[var(--accent-mint)]" />
          {actionItems.length === 0 ? (
            <EmptyNote text="No action items recorded" />
          ) : (
            <ul className="space-y-2">
              {actionItems.map((item, i) => <ActionItem key={i} text={item} index={i} />)}
            </ul>
          )}
        </motion.div>

        {/* Notable Facts */}
        {notableFacts.length > 0 && (
          <motion.div variants={itemV}>
            <SectionHeader label="Notable Facts" accent="bg-slate-500" />
            <ul className="space-y-2">
              {notableFacts.map((item, i) => <BulletItem key={i} text={item} />)}
            </ul>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
