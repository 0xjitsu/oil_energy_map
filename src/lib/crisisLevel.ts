import type { TimelineEvent, ScenarioParams } from '@/types';

export type CrisisLevel = 'CALM' | 'ELEVATED' | 'CRISIS';

export interface CrisisTokens {
  '--accent-primary': string;
  '--bg-card-crisis': string;
  '--border-crisis': string;
  '--scan-line-opacity': string;
}

const TOKEN_MAP: Record<CrisisLevel, CrisisTokens> = {
  CALM: {
    '--accent-primary': '#3b82f6',
    '--bg-card-crisis': 'rgba(10, 15, 26, 0.7)',
    '--border-crisis': 'rgba(255,255,255,0.06)',
    '--scan-line-opacity': '0',
  },
  ELEVATED: {
    '--accent-primary': '#f59e0b',
    '--bg-card-crisis': 'rgba(20, 15, 10, 0.7)',
    '--border-crisis': 'rgba(245,158,11,0.15)',
    '--scan-line-opacity': '0',
  },
  CRISIS: {
    '--accent-primary': '#ef4444',
    '--bg-card-crisis': 'rgba(30, 10, 10, 0.7)',
    '--border-crisis': 'rgba(239,68,68,0.2)',
    '--scan-line-opacity': '0.03',
  },
};

/**
 * Compute a 0–100 crisis score from live signals.
 *
 * Formula:
 *   redCount × 8   (max 40)
 * + yellowCount × 2 (max 20)
 * + brentΔ%         (max 20)
 * + hormuzWeeks/4×20 (max 20)
 * = min(100, sum)
 *
 * Returns 25 on error (safe CALM default).
 */
export function computeCrisisScore(
  events: TimelineEvent[],
  scenarioParams: ScenarioParams,
  brentPreviousWeek: number,
): number {
  try {
    const redCount = events.filter((e) => e.severity === 'red').length;
    const yellowCount = events.filter((e) => e.severity === 'yellow').length;

    const redScore = Math.min(40, redCount * 8);
    const yellowScore = Math.min(20, yellowCount * 2);

    const brentDelta =
      brentPreviousWeek > 0
        ? Math.abs((scenarioParams.brentPrice - brentPreviousWeek) / brentPreviousWeek) * 100
        : 0;
    const brentScore = Math.min(20, brentDelta);

    const hormuzScore = Math.min(20, (scenarioParams.hormuzWeeks / 4) * 20);

    return Math.min(100, redScore + yellowScore + brentScore + hormuzScore);
  } catch {
    return 25;
  }
}

export function getCrisisLevel(score: number): CrisisLevel {
  if (score >= 61) return 'CRISIS';
  if (score >= 31) return 'ELEVATED';
  return 'CALM';
}

export function getCrisisTokens(level: CrisisLevel): CrisisTokens {
  return TOKEN_MAP[level];
}
