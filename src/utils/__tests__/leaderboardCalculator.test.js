import { describe, it, expect } from 'vitest';
import { calculateLeaderboard } from '../leaderboardCalculator';

describe('calculateLeaderboard', () => {
  const users = { user1: { name: 'Alice' }, user2: { name: 'Bob' } };

  const matches = {
    m1: { status: 'finished', result: { home_score: 2, away_score: 1 } },
    m2: { status: 'finished', result: { home_score: 0, away_score: 0 } },
  };

  it('calculates basic leaderboard from match predictions', () => {
    const allPredictions = {
      user1: {
        m1: { home_score: 2, away_score: 1 }, // pleno -> 3
        m2: { home_score: 0, away_score: 0 }, // pleno -> 3
      },
      user2: {
        m1: { home_score: 1, away_score: 0 }, // correct outcome -> 1
        m2: { home_score: 1, away_score: 1 }, // correct outcome (draw) -> 1
      },
    };

    const result = calculateLeaderboard(allPredictions, matches, users, {}, {});

    expect(result.user1.total_points).toBe(6);
    expect(result.user1.match_points).toBe(6);
    expect(result.user1.plenos).toBe(2);
    expect(result.user1.champion_points).toBe(0);
    expect(result.user1.goleador_points).toBe(0);

    expect(result.user2.total_points).toBe(2);
    expect(result.user2.match_points).toBe(2);
    expect(result.user2.correct_outcomes).toBe(2);
  });

  it('awards 10 pts for correct champion pick', () => {
    const matchesWithFinal = {
      final1: {
        stage: 'final',
        status: 'finished',
        home_team: 'ARG',
        away_team: 'FRA',
        result: { home_score: 3, away_score: 2 },
      },
    };

    const specialPredictions = {
      user1: { champion: 'ARG' },
      user2: { champion: 'BRA' },
    };

    const result = calculateLeaderboard({}, matchesWithFinal, users, specialPredictions, {});

    expect(result.user1.champion_points).toBe(10);
    expect(result.user2.champion_points).toBe(0);
  });

  it('awards 0 champion pts when champion pick is wrong', () => {
    const matchesWithFinal = {
      final1: {
        stage: 'final',
        status: 'finished',
        home_team: 'ARG',
        away_team: 'FRA',
        result: { home_score: 3, away_score: 2 },
      },
    };

    const specialPredictions = {
      user1: { champion: 'FRA' },
    };

    const result = calculateLeaderboard({}, matchesWithFinal, users, specialPredictions, {});
    expect(result.user1.champion_points).toBe(0);
  });

  it('awards 5 pts for goleador fuzzy match - "Mbappe" matches "Kylian Mbappé"', () => {
    const result = calculateLeaderboard({}, matches, users, {
      user1: { goleador: 'Mbappe' },
    }, { actual_goleador: 'Kylian Mbappé' });

    expect(result.user1.goleador_points).toBe(5);
  });

  it('awards 5 pts for goleador fuzzy match - "Vinicius" matches "Vinícius Jr"', () => {
    const result = calculateLeaderboard({}, matches, users, {
      user1: { goleador: 'Vinicius' },
    }, { actual_goleador: 'Vinícius Jr' });

    expect(result.user1.goleador_points).toBe(5);
  });

  it('awards 0 pts for completely wrong goleador', () => {
    const result = calculateLeaderboard({}, matches, users, {
      user1: { goleador: 'Messi' },
    }, { actual_goleador: 'Kylian Mbappé' });

    expect(result.user1.goleador_points).toBe(0);
  });

  it('awards 0 special pts when no special predictions exist', () => {
    const result = calculateLeaderboard({}, matches, users, {}, {});

    expect(result.user1.champion_points).toBe(0);
    expect(result.user1.goleador_points).toBe(0);
  });
});
