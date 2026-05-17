import { describe, it, expect } from 'vitest';
import { composeDieselLine } from '@/components/layout/CrisisHero';

describe('composeDieselLine', () => {
  it('reports a rise when diesel is up week-over-week', () => {
    expect(composeDieselLine(59.4, 1.2)).toBe('Diesel is ₱59.40/L — up ₱1.20 this week.');
  });

  it('reports a drop when diesel is down', () => {
    expect(composeDieselLine(58.0, -0.75)).toBe('Diesel is ₱58.00/L — down ₱0.75 this week.');
  });

  it('reports flat when the weekly move is negligible', () => {
    expect(composeDieselLine(59.4, 0.004)).toBe('Diesel is ₱59.40/L — flat this week.');
  });
});
