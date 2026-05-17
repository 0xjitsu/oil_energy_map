import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SCENARIO,
  encodeScenario,
  decodeScenario,
} from '@/lib/scenario-url';
import type { ScenarioParams } from '@/types';

describe('encodeScenario', () => {
  it('encodes the four params as an underscore-delimited string in fixed order', () => {
    const params: ScenarioParams = {
      brentPrice: 120,
      hormuzWeeks: 8,
      forexRate: 60.5,
      refineryOffline: true,
    };
    expect(encodeScenario(params)).toBe('120_8_60.5_1');
  });

  it('encodes refineryOffline=false as 0', () => {
    expect(encodeScenario(DEFAULT_SCENARIO)).toBe('106_2_58.42_0');
  });
});

describe('decodeScenario', () => {
  it('round-trips an encoded scenario', () => {
    const params: ScenarioParams = {
      brentPrice: 120,
      hormuzWeeks: 8,
      forexRate: 60.5,
      refineryOffline: true,
    };
    expect(decodeScenario(encodeScenario(params))).toEqual(params);
  });

  it('returns the default scenario for null / empty input', () => {
    expect(decodeScenario(null)).toEqual(DEFAULT_SCENARIO);
    expect(decodeScenario('')).toEqual(DEFAULT_SCENARIO);
  });

  it('returns the default scenario for a malformed string', () => {
    expect(decodeScenario('not-a-scenario')).toEqual(DEFAULT_SCENARIO);
    expect(decodeScenario('120_8')).toEqual(DEFAULT_SCENARIO);
  });

  it('clamps out-of-range numbers into slider bounds', () => {
    // brent 999 -> max 180; hormuz -5 -> min 0; forex 200 -> max 65
    expect(decodeScenario('999_-5_200_1')).toEqual({
      brentPrice: 180,
      hormuzWeeks: 0,
      forexRate: 65,
      refineryOffline: true,
    });
  });

  it('rounds brent and hormuz to integers and forex to one decimal', () => {
    expect(decodeScenario('106.7_2.4_58.418_0')).toEqual({
      brentPrice: 107,
      hormuzWeeks: 2,
      forexRate: 58.4,
      refineryOffline: false,
    });
  });
});
