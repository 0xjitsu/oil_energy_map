import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertsProvider, useAlertsContext } from '@/lib/AlertsProvider';

function Probe() {
  const alerts = useAlertsContext();
  return <div>unread:{alerts.unreadCount}</div>;
}

describe('AlertsProvider', () => {
  it('provides the shared alerts store to consumers', async () => {
    render(
      <AlertsProvider>
        <Probe />
      </AlertsProvider>,
    );
    expect(await screen.findByText(/unread:0/)).toBeTruthy();
  });

  it('throws a clear error when used outside the provider', () => {
    // Suppress the expected console error noise from React.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/AlertsProvider/);
    spy.mockRestore();
  });
});
