import { useState, useCallback } from 'react';
import axios from 'axios';

export function useApiState<T, A extends unknown[]>(fn: (...args: A) => Promise<T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: A) => {
      setLoading(true);
      setError(null);
      try {
        return await fn(...args);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
        } else {
          setError('Something went wrong. Please try again.');
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fn]
  );

  return { run, loading, error };
}