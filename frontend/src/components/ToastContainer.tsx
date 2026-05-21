import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useToast } from '../context/ToastContext';

const SPRING = { type: 'spring', stiffness: 380, damping: 30 } as const;

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();
  const reduced = useReducedMotion();

  return (
    <div
      aria-live="assertive"
      aria-atomic="false"
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-full max-w-xs pointer-events-none"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            role="alert"
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 60, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: 60, scale: 0.88, transition: { duration: 0.18 } }}
            transition={SPRING}
            className={[
              'flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg pointer-events-auto',
              toast.type === 'error'
                ? 'border-red-500/30 bg-red-950 text-red-300'
                : 'border-[var(--accent-mint)]/40 bg-[var(--success-bg)] text-[var(--accent-mint)]',
            ].join(' ')}
          >
            {toast.type === 'error' ? (
              <svg className="h-4 w-4 shrink-0 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 shrink-0 text-[var(--accent-mint)]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
            <span className="flex-1 text-sm">{toast.message}</span>
            <motion.button
              whileTap={reduced ? {} : { scale: 0.85 }}
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
