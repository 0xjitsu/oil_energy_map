import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareButton } from '@/components/ui/ShareButton';

// NOTE: this environment (Node 25 + vitest 2.1.9 + React 18) commits the React
// render a tick AFTER `render()` returns, so a synchronous `getBy*` query would
// miss the freshly-mounted DOM. Use the async, retrying `findBy*` queries —
// the React Testing Library recommended pattern regardless.

describe('ShareButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the default label', async () => {
    render(<ShareButton url="https://example.com/?s=1" title="Test" />);
    expect(
      await screen.findByRole('button', { name: /share this view/i }),
    ).toBeTruthy();
  });

  it('copies to clipboard and shows confirmation when Web Share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    // jsdom has no navigator.share — force the clipboard fallback path.
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    render(<ShareButton url="https://example.com/?s=120_8_60.5_1" title="Test" />);
    fireEvent.click(await screen.findByRole('button'));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://example.com/?s=120_8_60.5_1');
    });
    expect(await screen.findByText(/copied/i)).toBeTruthy();
  });
});
