import { useCallback, useState } from 'react';
import { isAxiosError } from 'axios';
import { uploadAndSummarize, SummaryResult, SummaryType } from '../services/api';

interface UseSummarizeReturn {
  loading: boolean;
  error: string | null;
  summary: SummaryResult | null;
  trigger: (file: File, summaryType: SummaryType, focusOn?: string) => Promise<void>;
  reset: () => void;
}

export function useSummarize(): UseSummarizeReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryResult | null>(null);

  const trigger = useCallback(async (file: File, summaryType: SummaryType, focusOn?: string): Promise<void> => {
    setError(null);
    setLoading(true);

    try {
      const response = await uploadAndSummarize(file, summaryType, focusOn);
      setSummary(response.summary);
    } catch (err) {
      if (isAxiosError(err)) {
        const serverMessage = err.response?.data?.message as string | undefined;
        setError(serverMessage ?? err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSummary(null);
    setError(null);
  }, []);

  return { loading, error, summary, trigger, reset };
}
