'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { PriceBenchmark, AlertRule, AlertNotification } from '@/types';

const RULES_KEY = 'oil-intel-alert-rules';
const HISTORY_KEY = 'oil-intel-alert-history';
const MAX_HISTORY = 50;
const COOLDOWN_MS = 30 * 60 * 1000;

function loadRules(): AlertRule[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RULES_KEY) ?? '[]');
  } catch { return []; }
}

function loadHistory(): AlertNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch { return []; }
}

export function useAlerts() {
  const [rules, setRules] = useState<AlertRule[]>(loadRules);
  const [history, setHistory] = useState<AlertNotification[]>(loadHistory);
  const permissionRef = useRef<NotificationPermission>('default');

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      permissionRef.current = Notification.permission;
    }
  }, []);

  const saveRules = useCallback((updated: AlertRule[]) => {
    setRules(updated);
    localStorage.setItem(RULES_KEY, JSON.stringify(updated));
  }, []);

  const saveHistory = useCallback((updated: AlertNotification[]) => {
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
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
    saveRules([...rules, newRule]);
  }, [rules, saveRules]);

  const removeRule = useCallback((id: string) => {
    saveRules(rules.filter((r) => r.id !== id));
  }, [rules, saveRules]);

  const toggleRule = useCallback((id: string) => {
    saveRules(rules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }, [rules, saveRules]);

  const checkPrices = useCallback((prices: PriceBenchmark[]) => {
    const now = Date.now();
    const newNotifications: AlertNotification[] = [];

    for (const rule of rules) {
      if (!rule.enabled) continue;
      if (rule.lastTriggeredAt && now - new Date(rule.lastTriggeredAt).getTime() < COOLDOWN_MS) continue;

      const benchmark = prices.find((p) => p.id === rule.benchmarkId);
      if (!benchmark) continue;

      const triggered =
        (rule.direction === 'above' && benchmark.value >= rule.threshold) ||
        (rule.direction === 'below' && benchmark.value <= rule.threshold);

      if (triggered) {
        const notification: AlertNotification = {
          id: crypto.randomUUID(),
          ruleId: rule.id,
          benchmarkId: rule.benchmarkId,
          benchmarkName: benchmark.name,
          value: benchmark.value,
          threshold: rule.threshold,
          direction: rule.direction,
          timestamp: new Date().toISOString(),
          read: false,
        };
        newNotifications.push(notification);
        rule.lastTriggeredAt = notification.timestamp;

        if (typeof Notification !== 'undefined' && permissionRef.current === 'granted') {
          new Notification('Price Alert', {
            body: `${benchmark.name} is ${rule.direction} ${rule.threshold} ${benchmark.unit} (now: ${benchmark.value})`,
            icon: '/favicon.ico',
          });
        }
      }
    }

    if (newNotifications.length > 0) {
      saveRules([...rules]);
      const updated = [...newNotifications, ...history].slice(0, MAX_HISTORY);
      saveHistory(updated);
    }
  }, [rules, history, saveRules, saveHistory]);

  const markRead = useCallback((id: string) => {
    saveHistory(history.map((n) => n.id === id ? { ...n, read: true } : n));
  }, [history, saveHistory]);

  const markAllRead = useCallback(() => {
    saveHistory(history.map((n) => ({ ...n, read: true })));
  }, [history, saveHistory]);

  const unreadCount = history.filter((n) => !n.read).length;

  return { rules, history, unreadCount, addRule, removeRule, toggleRule, checkPrices, markRead, markAllRead };
}
