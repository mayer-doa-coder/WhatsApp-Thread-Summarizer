import React from 'react';
import { useToast } from '../context/ToastContext';

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={[
            'flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border pointer-events-auto',
            toast.type === 'error'
              ? 'bg-red-900 border-red-700 text-red-100'
              : 'bg-green-900 border-green-700 text-green-100',
          ].join(' ')}
        >
          <span className="flex-1 text-sm leading-relaxed">{toast.message}</span>
          <button
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity text-xl leading-none mt-[-1px]"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
