import { describe, it, expect, vi } from 'vitest';
import { statSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('next/font/google', () => ({
  IBM_Plex_Mono: () => ({ variable: '' }),
  IBM_Plex_Sans: () => ({ variable: '' }),
}));

const ORIGIN = 'https://energy-intelligence-map.vercel.app';
const MP4 = resolve(__dirname, '../../../public/og/preview.mp4');
const PLAYER = resolve(__dirname, '../../../public/og/player.html');

describe('og:video link preview', () => {
  it('declares og:video and a twitter player card with absolute https URLs', async () => {
    const { metadata } = await import('../layout');
    const og = metadata.openGraph as { videos: Array<Record<string, unknown>> };
    expect(og.videos[0]).toMatchObject({
      url: `${ORIGIN}/og/preview.mp4`,
      secureUrl: `${ORIGIN}/og/preview.mp4`,
      type: 'video/mp4',
      width: 1200,
      height: 630,
    });

    const tw = metadata.twitter as { card: string; players: Record<string, unknown> };
    expect(tw.card).toBe('player');
    expect(tw.players).toMatchObject({
      playerUrl: `${ORIGIN}/og/player.html`,
      streamUrl: `${ORIGIN}/og/preview.mp4`,
      width: 1200,
      height: 630,
    });
  });

  it('ships an MP4 under 5 MB and a player page that autoplays it', () => {
    const size = statSync(MP4).size;
    expect(size).toBeGreaterThan(0);
    expect(size).toBeLessThan(5 * 1024 * 1024);

    const html = readFileSync(PLAYER, 'utf8');
    expect(html).toMatch(/<video[^>]*src="\/og\/preview\.mp4"[^>]*autoplay[^>]*muted[^>]*loop[^>]*playsinline/);
  });

  it('keeps the og:image fallback', () => {
    expect(statSync(resolve(__dirname, '../opengraph-image.tsx')).isFile()).toBe(true);
  });
});
