'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { PriceBenchmark, AlertRule, AlertNotification } from '@/types';

const RULES_KEY = 'oil-intel-alert-rules';
const HISTORY_KEY = 'oil-intel-alert-history';
const MAX_HISTORY = 50;
const COOLDOWN_MS = 30 * 60 * 1000;

function loadFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]');
  } catch { return []; }
}

function persistRules(rules: AlertRule[]): void {
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}

function persistHistory(history: AlertNotification[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function useAlerts() {
  const [rules, setRules] = useState<AlertRule[]>(() => loadFromStorage<AlertRule>(RULES_KEY));
  const [history, setHistory] = useState<AlertNotification[]>(() => loadFromStorage<AlertNotification>(HISTORY_KEY));
  const permissionRef = useRef<NotificationPermission>('default');

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      permissionRef.current = Notification.permission;
    }
  }, []);

  const addRule = useCallback((rule: Omit<AlertRule, 'id' | 'createdAt' | 'enabled'>) => {
    if (typeof Notification !== 'undefined' && permissionRef.current === 'default') {
      Notification.requestPermission().then((p) => { permissionRef.current = p; });
    }
    const newRule: AlertRule = {
      ...rule,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      enabled: true,
    };
    setRules((prev) => {
      const updated = [...prev, newRule];
      persistRules(updated);
      return updated;
    });
  }, []);

  const removeRule = useCallback((id: string) => {
    setRules((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      persistRules(updated);
      return updated;
    });
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules((prev) => {
      const updated = prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r);
      persistRules(updated);
      return updated;
    });
  }, []);

  const checkPrices = useCallback((prices: PriceBenchmark[]) => {
    const now = Date.now();

    setRules((prevRules) => {
      const newNotifications: AlertNotification[] = [];
      const updatedRules = prevRules.map((rule) => {
        if (!rule.enabled) return rule;
        if (rule.lastTriggeredAt && now - new Date(rule.lastTriggeredAt).getTime() < COOLDOWN_MS) return rule;

        const benchmark = prices.find((p) => p.id === rule.benchmarkId);
        if (!benchmark) return rule;

        const triggered =
          (rule.direction === 'above' && benchmark.value >= rule.threshold) ||
          (rule.direction === 'below' && benchmark.value <= rule.threshold);

        if (!triggered) return rule;

        const timestamp = new Date().toISOString();
        newNotifications.push({
          id: crypto.randomUUID(),
          ruleId: rule.id,
          benchmarkId: rule.benchmarkId,
          benchmarkName: benchmark.name,
          value: benchmark.value,
          threshold: rule.threshold,
          direction: rule.direction,
          timestamp,
          read: false,
        });

        if (typeof Notification !== 'undefined' && permissionRef.current === 'granted') {
          new Notification('Price Alert', {
            body: `${benchmark.name} is ${rule.direction} ${rule.threshold} ${benchmark.unit} (now: ${benchmark.value})`,
            icon: '/favicon.ico',
          });
        }

        return { ...rule, lastTriggeredAt: timestamp };
      });

      if (newNotifications.length > 0) {
        persistRules(updatedRules);
        setHistory((prevHistory) => {
          const updated = [...newNotifications, ...prevHistory].slice(0, MAX_HISTORY);
          persistHistory(updated);
          return updated;
        });
        return updatedRules;
      }

      return prevRules;
    });
  }, []);

  const markRead = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.map((n) => n.id === id ? { ...n, read: true } : n);
      persistHistory(updated);
      return updated;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setHistory((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      persistHistory(updated);
      return updated;
    });
  }, []);

  const unreadCount = useMemo(() => history.filter((n) => !n.read).length, [history]);

  return { rules, history, unreadCount, addRule, removeRule, toggleRule, checkPrices, markRead, markAllRead };
}
