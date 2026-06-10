import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertsProvider, useAlertsContext } from '@/lib/AlertsProvider';
import type { AlertRule } from '@/types';

// Mirror the real return shape of usePrices() (src/hooks/usePrices.ts:9-12).
vi.mock('@/hooks/usePrices', () => ({
  usePrices: vi.fn(),
}));

import { usePrices } from '@/hooks/usePrices';

const RULES_KEY = 'oil-intel-alert-rules';

// This vitest worker's global `localStorage` is a non-functional stub (its
// methods are undefined — a Node webstorage/jsdom collision), so stub a real
// in-memory Storage. useAlerts references the bare `localStorage` global at
// call time, so vi.stubGlobal reaches it.
function makeStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

function Probe() {
  const alerts = useAlertsContext();
  return <div>unread:{alerts.unreadCount}</div>;
}

/** Default mock: no live feed, no prices — matches DataProvider DEFAULT_VALUE. */
function mockNoPrices() {
  vi.mocked(usePrices).mockReturnValue({
    prices: [],
    isLive: false,
    lastUpdated: null,
    priceHistory: {},
  });
}

describe('AlertsProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('provides the shared alerts store to consumers', async () => {
    mockNoPrices();
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

  it('evaluates alert rules against live poll prices and increments unreadCount', async () => {
    // Seed localStorage with one enabled rule: brent-crude above 10 (will
    // always trigger for a value of 999). useAlerts reads rules in its useState
    // initializer, so seeding before render is sufficient.
    const rule: AlertRule = {
      id: 'test-rule-1',
      benchmarkId: 'brent-crude',
      direction: 'above',
      threshold: 10,
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(RULES_KEY, JSON.stringify([rule]));

    // Mock a successful live poll: isLive=true + a fresh lastUpdated timestamp.
    vi.mocked(usePrices).mockReturnValue({
      prices: [
        {
          id: 'brent-crude',
          name: 'Brent Crude',
          value: 999,
          previousWeek: 999,
          unit: '$/bbl',
          tooltip: '',
        },
      ],
      isLive: true,
      lastUpdated: new Date(),
      priceHistory: {},
    });

    render(
      <AlertsProvider>
        <Probe />
      </AlertsProvider>,
    );

    // The effect fires synchronously in jsdom; findByText retries until it sees
    // the updated count, proving checkPrices ran and produced a notification.
    expect(await screen.findByText(/unread:1/)).toBeTruthy();
  });
});
