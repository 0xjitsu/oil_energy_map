'use client';

import { useState } from 'react';
import { useAlerts } from '@/hooks/useAlerts';
import AlertDrawer from './AlertDrawer';
import AlertRuleModal from './AlertRuleModal';

export function AlertBell() {
  const alerts = useAlerts();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setDrawerOpen(true)}
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
        onClose={() => setDrawerOpen(false)}
        alerts={alerts}
        onAddRule={() => { setDrawerOpen(false); setModalOpen(true); }}
      />

      <AlertRuleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(rule) => {
          alerts.addRule(rule);
          setModalOpen(false);
        }}
      />
    </>
  );
}
