import { describe, it, expect } from 'vitest';
import { computeGroupStandings } from '../groupStandings';

describe('computeGroupStandings', () => {
  const teams = {
    ARG: { group: 'A' },
    BRA: { group: 'A' },
    GER: { group: 'A' },
    FRA: { group: 'A' },
  };

  it('computes correct standings for a 4-team group with finished matches', () => {
    const matches = {
      m1: { stage: 'group', status: 'finished', group: 'A', home_team: 'ARG', away_team: 'BRA', result: { home_score: 2, away_score: 0 } },
      m2: { stage: 'group', status: 'finished', group: 'A', home_team: 'GER', away_team: 'FRA', result: { home_score: 1, away_score: 1 } },
      m3: { stage: 'group', status: 'finished', group: 'A', home_team: 'ARG', away_team: 'GER', result: { home_score: 1, away_score: 0 } },
      m4: { stage: 'group', status: 'finished', group: 'A', home_team: 'BRA', away_team: 'FRA', result: { home_score: 3, away_score: 1 } },
      m5: { stage: 'group', status: 'finished', group: 'A', home_team: 'ARG', away_team: 'FRA', result: { home_score: 0, away_score: 0 } },
      m6: { stage: 'group', status: 'finished', group: 'A', home_team: 'BRA', away_team: 'GER', result: { home_score: 0, away_score: 2 } },
    };

    const standings = computeGroupStandings(matches, teams);
    const groupA = standings['A'];

    // ARG: W2 D1 L0 -> 7pts, GF3 GA0, GD+3
    expect(groupA[0].team_code).toBe('ARG');
    expect(groupA[0].points).toBe(7);
    expect(groupA[0].gd).toBe(3);

    // GER: W1 D1 L1 -> 4pts, GF3 GA2, GD+1
    expect(groupA[1].team_code).toBe('GER');
    expect(groupA[1].points).toBe(4);
    expect(groupA[1].gd).toBe(1);

    // BRA: W1 D0 L2 -> 3pts, GF3 GA5, GD-2
    expect(groupA[2].team_code).toBe('BRA');
    expect(groupA[2].points).toBe(3);
    expect(groupA[2].gd).toBe(-2);

    // FRA: W0 D2 L1 -> 2pts, GF2 GA4, GD-2
    expect(groupA[3].team_code).toBe('FRA');
    expect(groupA[3].points).toBe(2);
    expect(groupA[3].gd).toBe(-2);
  });

  it('sorts by GD when points are tied', () => {
    // Two teams with same points but different GD
    const matches = {
      m1: { stage: 'group', status: 'finished', group: 'A', home_team: 'ARG', away_team: 'BRA', result: { home_score: 1, away_score: 0 } },
      m2: { stage: 'group', status: 'finished', group: 'A', home_team: 'GER', away_team: 'FRA', result: { home_score: 3, away_score: 0 } },
    };

    const standings = computeGroupStandings(matches, teams);
    const groupA = standings['A'];

    // ARG: 3pts, GD+1; GER: 3pts, GD+3 -> GER should be first
    expect(groupA[0].team_code).toBe('GER');
    expect(groupA[1].team_code).toBe('ARG');
  });

  it('only counts finished matches', () => {
    const matches = {
      m1: { stage: 'group', status: 'finished', group: 'A', home_team: 'ARG', away_team: 'BRA', result: { home_score: 2, away_score: 0 } },
      m2: { stage: 'group', status: 'upcoming', group: 'A', home_team: 'GER', away_team: 'FRA', result: null },
      m3: { stage: 'group', status: 'live', group: 'A', home_team: 'ARG', away_team: 'GER', result: { home_score: 1, away_score: 0 } },
    };

    const standings = computeGroupStandings(matches, teams);
    const groupA = standings['A'];

    // Only m1 should be counted
    const arg = groupA.find(t => t.team_code === 'ARG');
    expect(arg.played).toBe(1);
    expect(arg.points).toBe(3);

    const ger = groupA.find(t => t.team_code === 'GER');
    expect(ger.played).toBe(0);
    expect(ger.points).toBe(0);
  });
});
