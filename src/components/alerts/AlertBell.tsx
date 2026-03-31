'use client';

import { useState, useCallback } from 'react';
import { useAlerts } from '@/hooks/useAlerts';
import type { AlertRule } from '@/types';
import AlertDrawer from './AlertDrawer';
import AlertRuleModal from './AlertRuleModal';

export function AlertBell() {
  const alerts = useAlerts();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const handleAddRule = useCallback(() => {
    setDrawerOpen(false);
    setModalOpen(true);
  }, []);

  const handleSaveRule = useCallback((rule: Omit<AlertRule, 'id' | 'createdAt' | 'enabled'>) => {
    alerts.addRule(rule);
    setModalOpen(false);
  }, [alerts.addRule]);

  return (
    <>
      <button
        onClick={openDrawer}
        className="relative p-1.5 rounded-md hover:bg-surface-hover transition-colors"
        title="Price alerts"
      >
        <span className="text-sm">🔔</span>
        {alerts.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-mono flex items-center justify-center">
            {alerts.unreadCount > 9 ? '9+' : alerts.unreadCount}
          </span>
        )}
      </button>

      <AlertDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        alerts={alerts}
        onAddRule={handleAddRule}
      />

      <AlertRuleModal
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSaveRule}
      />
    </>
  );
}
