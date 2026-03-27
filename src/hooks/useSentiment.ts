'use client';

import { useState, useEffect, useCallback } from 'react';

export interface SentimentResult {
  headline: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
}

const POLL_INTERVAL = 15 * 60 * 1000; // 15 minutes

export function useSentiment() {
  const [sentiments, setSentiments] = useState<SentimentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSentiment = useCallback(() => {
    fetch('/api/sentiment')
      .then((r) => {
        if (!r.ok) throw new Error(`API returned ${r.status}`);
        return r.json();
      })
      .then((data: SentimentResult[] | { error: string }) => {
        if (Array.isArray(data)) {
          setSentiments(data);
          setError(null);
        } else {
          setError(data.error ?? 'Unknown error');
        }
        setIsLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchSentiment();
    const id = setInterval(fetchSentiment, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchSentiment]);

  // Overall score: -1 (all negative) to +1 (all positive)
  const overallScore =
    sentiments.length === 0
      ? 0
      : sentiments.reduce((acc, s) => {
          const sign = s.sentiment === 'positive' ? 1 : s.sentiment === 'negative' ? -1 : 0;
          return acc + sign * s.score;
        }, 0) / sentiments.length;

  return { sentiments, overallScore, isLoading, error };
}
