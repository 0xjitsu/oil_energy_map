import { describe, it, expect } from 'vitest';
import { deriveImpactsFromPump, pumpDeltaRisk } from '@/lib/impact-model';
import { IMPACT_ITEMS } from '@/lib/constants';

describe('pumpDeltaRisk', () => {
  it('is green when both pumps are at/below baseline', () => {
    expect(pumpDeltaRisk(0, 0)).toBe('green');
  });
  it('is yellow on a moderate delta', () => {
    expect(pumpDeltaRisk(6, 2)).toBe('yellow');
  });
  it('is red on a severe delta', () => {
    expect(pumpDeltaRisk(2, 16)).toBe('red');
  });
});

describe('deriveImpactsFromPump', () => {
  it('says "No change" at baseline prices', () => {
    const impacts = deriveImpactsFromPump(IMPACT_ITEMS, 65, 59);
    const jeepney = impacts.find((i) => i.label === 'Jeepney Fare')!;
    expect(jeepney.change).toMatch(/no change/i);
  });
  it('derives positive impacts above baseline', () => {
    const impacts = deriveImpactsFromPump(IMPACT_ITEMS, 85, 79);
    const jeepney = impacts.find((i) => i.label === 'Jeepney Fare')!;
    expect(jeepney.change).toMatch(/\+₱\d/);
  });
  it('never goes negative below baseline', () => {
    const impacts = deriveImpactsFromPump(IMPACT_ITEMS, 50, 45);
    for (const i of impacts) expect(i.change).not.toMatch(/-₱/);
  });
  it('handles every IMPACT_ITEMS label (no silent passthrough)', () => {
    expect(() => deriveImpactsFromPump(IMPACT_ITEMS, 80, 75)).not.toThrow();
  });
  it('throws on an unknown label instead of leaking a stale change string', () => {
    const rogue = [{ ...IMPACT_ITEMS[0], label: 'Unknown Thing' }];
    expect(() => deriveImpactsFromPump(rogue, 80, 75)).toThrow(/unhandled impact label/);
  });
});
