import { describe, it, expect } from 'vitest';
import { getLiveSupplyRisk } from '@/components/layout/ExecutiveSnapshot';

describe('getLiveSupplyRisk', () => {
  it('is LOW when brent is flat and no events', () => {
    expect(getLiveSupplyRisk(80, 80, 0, 0).label).toBe('LOW');
  });
  it('escalates with red events', () => {
    expect(getLiveSupplyRisk(80, 80, 3, 0).label).toBe('HIGH');
  });
  it('is CRITICAL on a big brent move plus red events', () => {
    expect(getLiveSupplyRisk(100, 80, 3, 5).label).toBe('CRITICAL');
  });
  it('never divides by zero', () => {
    expect(getLiveSupplyRisk(80, 0, 0, 0).label).toBe('LOW');
  });
});
