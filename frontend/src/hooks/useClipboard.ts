import { useCallback, useEffect, useRef, useState } from 'react';

interface UseClipboardReturn {
  copyToClipboard: (text: string) => void;
  isCopied: boolean;
}

export default function useClipboard(): UseClipboardReturn {
  const [isCopied, setIsCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    const onSuccess = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      setIsCopied(true);
      timerRef.current = setTimeout(() => {
        setIsCopied(false);
        timerRef.current = null;
      }, 2000);
    };

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
        legacyCopy(text, onSuccess);
      });
    } else {
      legacyCopy(text, onSuccess);
    }
  }, []);

  return { copyToClipboard, isCopied };
}

function legacyCopy(text: string, onSuccess: () => void): void {
  const el = document.createElement('textarea');
  el.value = text;
  el.style.position = 'fixed';
  el.style.top = '0';
  el.style.left = '0';
  el.style.opacity = '0';
  el.style.pointerEvents = 'none';
  document.body.appendChild(el);
  el.focus();
  el.select();
  try {
    document.execCommand('copy');
    onSuccess();
  } finally {
    document.body.removeChild(el);
  }
}
