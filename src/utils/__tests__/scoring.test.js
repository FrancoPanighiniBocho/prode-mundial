import { describe, it, expect } from 'vitest';
import { computeMatchPoints, computeTotalPoints, computePhasePoints } from '../scoring';

describe('computeMatchPoints', () => {
  it('returns pleno (3 pts) for exact score match', () => {
    const result = computeMatchPoints(
      { home_score: 2, away_score: 1 },
      { home_score: 2, away_score: 1 }
    );
    expect(result).toEqual({ points: 3, pleno: true, correctOutcome: true });
  });

  it('returns 1 pt for correct outcome only', () => {
    const result = computeMatchPoints(
      { home_score: 3, away_score: 0 },
      { home_score: 1, away_score: 0 }
    );
    expect(result).toEqual({ points: 1, pleno: false, correctOutcome: true });
  });

  it('returns 0 pts for wrong prediction', () => {
    const result = computeMatchPoints(
      { home_score: 1, away_score: 0 },
      { home_score: 0, away_score: 2 }
    );
    expect(result).toEqual({ points: 0, pleno: false, correctOutcome: false });
  });

  it('returns pleno for exact draw prediction', () => {
    const result = computeMatchPoints(
      { home_score: 1, away_score: 1 },
      { home_score: 1, away_score: 1 }
    );
    expect(result).toEqual({ points: 3, pleno: true, correctOutcome: true });
  });

  it('returns 1 pt for draw prediction with wrong score', () => {
    const result = computeMatchPoints(
      { home_score: 0, away_score: 0 },
      { home_score: 1, away_score: 1 }
    );
    expect(result).toEqual({ points: 1, pleno: false, correctOutcome: true });
  });

  it('returns pleno when penalties and prediction matches pre-penalty score', () => {
    const result = computeMatchPoints(
      { home_score: 1, away_score: 1 },
      { home_score: 1, away_score: 1, penalties: true }
    );
    expect(result).toEqual({ points: 3, pleno: true, correctOutcome: true });
  });

  it('returns 0 pts when predicted home win but result is draw via penalties', () => {
    const result = computeMatchPoints(
      { home_score: 2, away_score: 1 },
      { home_score: 1, away_score: 1, penalties: true }
    );
    // Predicted home win (2-1), actual is draw (1-1 + penalties) -> wrong outcome
    expect(result).toEqual({ points: 0, pleno: false, correctOutcome: false });
  });

  it('returns 0 pts for null prediction', () => {
    const result = computeMatchPoints(null, { home_score: 1, away_score: 0 });
    expect(result).toEqual({ points: 0, pleno: false, correctOutcome: false });
  });

  it('returns 0 pts for null result', () => {
    const result = computeMatchPoints({ home_score: 1, away_score: 0 }, null);
    expect(result).toEqual({ points: 0, pleno: false, correctOutcome: false });
  });

  it('returns pleno for exact 0-0 prediction', () => {
    const result = computeMatchPoints(
      { home_score: 0, away_score: 0 },
      { home_score: 0, away_score: 0 }
    );
    expect(result).toEqual({ points: 3, pleno: true, correctOutcome: true });
  });
});

describe('computeTotalPoints', () => {
  it('only counts finished matches', () => {
    const matches = {
      m1: { status: 'finished', result: { home_score: 2, away_score: 1 } },
      m2: { status: 'live', result: { home_score: 0, away_score: 0 } },
      m3: { status: 'finished', result: { home_score: 1, away_score: 0 } },
    };
    const predictions = {
      m1: { home_score: 2, away_score: 1 }, // pleno -> 3
      m2: { home_score: 0, away_score: 0 }, // live, should be skipped
      m3: { home_score: 2, away_score: 0 }, // correct outcome -> 1
    };
    const result = computeTotalPoints(predictions, matches);
    expect(result).toEqual({ totalPoints: 4, plenos: 1, correctOutcomes: 1 });
  });

  it('returns 0 when no predictions', () => {
    const matches = {
      m1: { status: 'finished', result: { home_score: 1, away_score: 0 } },
    };
    const result = computeTotalPoints({}, matches);
    expect(result).toEqual({ totalPoints: 0, plenos: 0, correctOutcomes: 0 });
  });

  it('returns 0 when predictions is null', () => {
    const result = computeTotalPoints(null, {});
    expect(result).toEqual({ totalPoints: 0, plenos: 0, correctOutcomes: 0 });
  });
});

describe('computePhasePoints', () => {
  it('filters by phase correctly (group vs knockout)', () => {
    const matches = {
      m1: { status: 'finished', stage: 'group', result: { home_score: 2, away_score: 1 } },
      m2: { status: 'finished', stage: 'round_of_16', result: { home_score: 1, away_score: 0 } },
      m3: { status: 'finished', stage: 'group', result: { home_score: 0, away_score: 0 } },
    };
    const predictions = {
      m1: { home_score: 2, away_score: 1 }, // pleno -> 3
      m2: { home_score: 1, away_score: 0 }, // pleno -> 3, but knockout
      m3: { home_score: 0, away_score: 0 }, // pleno -> 3
    };

    // Only group phase
    const groupResult = computePhasePoints(predictions, matches, ['group']);
    expect(groupResult).toEqual({ totalPoints: 6, plenos: 2, correctOutcomes: 0 });

    // Only knockout
    const knockoutResult = computePhasePoints(predictions, matches, ['round_of_16']);
    expect(knockoutResult).toEqual({ totalPoints: 3, plenos: 1, correctOutcomes: 0 });
  });
});
