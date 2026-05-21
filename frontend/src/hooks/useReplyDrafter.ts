import { useCallback, useState } from 'react';
import axios from 'axios';
import { draftReply, Message, Tone } from '../services/api';

interface UseReplyDrafterReturn {
  loading: boolean;
  error: string | null;
  options: string[];
  generate: (messages: Message[], userIntent: string, tone: Tone) => Promise<void>;
}

export function useReplyDrafter(): UseReplyDrafterReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);

  const generate = useCallback(
    async (messages: Message[], userIntent: string, tone: Tone): Promise<void> => {
      setError(null);
      setLoading(true);

      try {
        const response = await draftReply({ messages, userIntent, tone });
        setOptions(response.options);
      } catch (err) {
        if (axios.isAxiosError(err)) {
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
    },
    [],
  );

  return { loading, error, options, generate };
}
