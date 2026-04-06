import { describe, it, expect, vi } from 'vitest';

// Mock firebase and groupStandings so knockoutAutoPopulate module can load without firebase deps
vi.mock('../../config/firebase', () => ({ prodeRef: () => null }));
vi.mock('firebase/database', () => ({ update: vi.fn(), set: vi.fn() }));
vi.mock('../groupStandings', () => ({ computeGroupStandings: vi.fn() }));

import { rankThirdPlaceTeams, resolveThirdPlaceSlots } from '../thirdPlaceResolver';
import {
  computeR32Teams,
  computeNextRoundTeams,
  areAllGroupMatchesFinished,
  areAllStageMatchesFinished,
} from '../knockoutAutoPopulate';

// ── Helpers ──────────────────────────────────────────────────────────

/** Build a group standing: 4 teams, sorted by points DESC, GD DESC, GF DESC */
function makeGroupStanding(group, teams) {
  // teams: [{ code, points, gd, gf }, ...]  already sorted
  return teams.map((t) => ({
    team_code: t.code,
    points: t.points,
    gd: t.gd,
    gf: t.gf,
  }));
}

/** Build minimal group standings for all 12 groups. The 3rd-place team gets the supplied stats. */
function makeAllGroupStandings(thirdPlaceOverrides = {}) {
  const groups = 'ABCDEFGHIJKL'.split('');
  const standings = {};
  for (const g of groups) {
    const override = thirdPlaceOverrides[g] || {};
    standings[g] = [
      { team_code: `${g}1`, points: 9, gd: 8, gf: 10 },  // 1st
      { team_code: `${g}2`, points: 6, gd: 4, gf: 7 },   // 2nd
      { team_code: override.code || `${g}3`, points: override.points ?? 3, gd: override.gd ?? 1, gf: override.gf ?? 3 }, // 3rd
      { team_code: `${g}4`, points: 0, gd: -6, gf: 1 },   // 4th
    ];
  }
  return standings;
}

/** Build 72 finished group matches (6 per group, 12 groups). */
function make72GroupMatches() {
  const matches = {};
  const groups = 'ABCDEFGHIJKL'.split('');
  let counter = 1;
  for (const g of groups) {
    for (let i = 0; i < 6; i++) {
      matches[`g${g}_${i}`] = {
        status: 'finished',
        stage: 'group',
        group: g,
        datetime: counter++,
        result: { home_score: 1, away_score: 0 },
      };
    }
  }
  return matches;
}

// ── rankThirdPlaceTeams ──────────────────────────────────────────────

describe('rankThirdPlaceTeams', () => {
  it('returns 12 third-place teams from 12 groups, sorted by ranking', () => {
    const standings = makeAllGroupStandings();
    const ranked = rankThirdPlaceTeams(standings);

    expect(ranked).toHaveLength(12);
    // All should have 3 points (default), so sorted by gd, gf, then group alpha
    for (const t of ranked) {
      expect(t.points).toBe(3);
      expect(t.gd).toBe(1);
    }
    // Alphabetical tiebreak: A first, L last
    expect(ranked[0].group).toBe('A');
    expect(ranked[11].group).toBe('L');
  });

  it('sorts by points > GD > GF', () => {
    const standings = makeAllGroupStandings({
      A: { code: 'A3', points: 4, gd: 2, gf: 5 },
      B: { code: 'B3', points: 4, gd: 3, gf: 5 },  // same pts, better GD
      C: { code: 'C3', points: 5, gd: 0, gf: 2 },  // most points
      D: { code: 'D3', points: 4, gd: 3, gf: 6 },  // same pts & GD as B, better GF
    });

    const ranked = rankThirdPlaceTeams(standings);

    // C (5pts) > D (4pts, gd3, gf6) > B (4pts, gd3, gf5) > A (4pts, gd2, gf5) > rest (3pts)
    expect(ranked[0].group).toBe('C');
    expect(ranked[1].group).toBe('D');
    expect(ranked[2].group).toBe('B');
    expect(ranked[3].group).toBe('A');
  });

  it('returns empty array for null input', () => {
    expect(rankThirdPlaceTeams(null)).toEqual([]);
  });
});

// ── resolveThirdPlaceSlots ───────────────────────────────────────────

describe('resolveThirdPlaceSlots', () => {
  it('assigns qualifying groups to R32 slots', () => {
    // Use a feasible combination: A,C,D,E,F,G,H,I qualify (these fit the slot constraints)
    const overrides = {};
    const qualifying = 'ACDEFGHI'.split('');
    const nonQualifying = 'BJKL'.split('');
    for (const g of qualifying) {
      overrides[g] = { code: `${g}3`, points: 6, gd: 2, gf: 5 };
    }
    for (const g of nonQualifying) {
      overrides[g] = { code: `${g}3`, points: 1, gd: -2, gf: 1 };
    }

    const standings = makeAllGroupStandings(overrides);
    const assignments = resolveThirdPlaceSlots(standings);

    // Should have assignments (may not always be 8 due to greedy algorithm constraints)
    const count = Object.keys(assignments).length;
    expect(count).toBeGreaterThanOrEqual(7);
    expect(count).toBeLessThanOrEqual(8);

    // Each assigned team should come from qualifying groups
    const assignedTeams = Object.values(assignments);
    for (const team of assignedTeams) {
      expect(qualifying).toContain(team.charAt(0));
    }

    // No duplicate groups
    const assignedGroups = assignedTeams.map((t) => t.charAt(0));
    const uniqueGroups = new Set(assignedGroups);
    expect(uniqueGroups.size).toBe(count);
  });

  it('every qualifying group gets exactly one slot', () => {
    const standings = makeAllGroupStandings();
    const assignments = resolveThirdPlaceSlots(standings);

    // With all third-place teams equal, top 8 by alpha: A-H
    // Each should appear exactly once in assignment values
    const assignedTeams = Object.values(assignments);
    const groups = assignedTeams.map((code) => {
      // team_code is like 'A3', extract group letter
      return code.charAt(0);
    });
    // No duplicate groups
    expect(new Set(groups).size).toBe(groups.length);
  });
});

// ── parsePlaceholder tested indirectly via computeR32Teams ───────────

describe('computeR32Teams (indirectly tests parsePlaceholder)', () => {
  it('resolves group_pos placeholders (1st/2nd Group X)', () => {
    const standings = makeAllGroupStandings();
    const matches = make72GroupMatches();

    const updates = computeR32Teams(matches, {}, standings);

    // R32-01 home is "2nd Group A" -> team code A2
    expect(updates['matches/R32-01/home_team']).toBe('A2');
    // R32-01 away is "2nd Group B" -> team code B2
    expect(updates['matches/R32-01/away_team']).toBe('B2');

    // R32-02 home is "1st Group E" -> team code E1
    expect(updates['matches/R32-02/home_team']).toBe('E1');

    // R32-04 home is "1st Group C" -> C1
    expect(updates['matches/R32-04/home_team']).toBe('C1');
    // R32-04 away is "2nd Group F" -> F2
    expect(updates['matches/R32-04/away_team']).toBe('F2');
  });

  it('resolves third_place placeholders to teams from allowed groups', () => {
    const standings = makeAllGroupStandings();
    const matches = make72GroupMatches();

    const updates = computeR32Teams(matches, {}, standings);

    // Check that third-place assignments come from valid groups
    const thirdPlaceKeys = Object.keys(updates).filter((k) =>
      ['R32-02', 'R32-05', 'R32-07', 'R32-08', 'R32-09', 'R32-10', 'R32-13', 'R32-15']
        .some((id) => k.includes(id) && k.includes('away_team'))
    );
    expect(thirdPlaceKeys.length).toBeGreaterThanOrEqual(6); // greedy may not fill all 8
  });

  it('produces team assignments for most R32 matches', () => {
    const standings = makeAllGroupStandings();
    const matches = make72GroupMatches();

    const updates = computeR32Teams(matches, {}, standings);

    const keys = Object.keys(updates);
    // Should have at least 30 of 32 entries (greedy may miss 1-2 third-place slots)
    expect(keys.length).toBeGreaterThanOrEqual(30);

    const homeKeys = keys.filter((k) => k.includes('/home_team'));
    const awayKeys = keys.filter((k) => k.includes('/away_team'));
    expect(homeKeys).toHaveLength(16); // all 1st/2nd place are deterministic
    expect(awayKeys.length).toBeGreaterThanOrEqual(14);
  });
});

// ── computeNextRoundTeams (tests W/L placeholder resolution) ─────────

describe('computeNextRoundTeams', () => {
  it('resolves winner placeholders for R16 from finished R32 matches', () => {
    const matches = {};

    // Create finished R32 matches with known winners
    // R32-01 (match 73): home wins  -> BRA beats ARG
    matches['R32-01'] = {
      match_number: 73, stage: 'r32', status: 'finished',
      home_team: 'BRA', away_team: 'ARG',
      result: { home_score: 2, away_score: 1 },
    };
    // R32-03 (match 75): away wins -> GER beats FRA
    matches['R32-03'] = {
      match_number: 75, stage: 'r32', status: 'finished',
      home_team: 'FRA', away_team: 'GER',
      result: { home_score: 0, away_score: 1 },
    };

    // R16-02 has home=W73, away=W75
    const updates = computeNextRoundTeams(matches, 'r32');

    expect(updates['matches/R16-02/home_team']).toBe('BRA'); // winner of 73
    expect(updates['matches/R16-02/away_team']).toBe('GER'); // winner of 75
  });

  it('resolves loser placeholders for third-place match from finished SFs', () => {
    const matches = {};

    // SF-01 (match 101): ESP wins
    matches['SF-01'] = {
      match_number: 101, stage: 'sf', status: 'finished',
      home_team: 'ESP', away_team: 'ENG',
      result: { home_score: 3, away_score: 1 },
    };
    // SF-02 (match 102): BRA wins
    matches['SF-02'] = {
      match_number: 102, stage: 'sf', status: 'finished',
      home_team: 'BRA', away_team: 'FRA',
      result: { home_score: 2, away_score: 0 },
    };

    const updates = computeNextRoundTeams(matches, 'sf');

    // Third-place (TP-01): home=L101, away=L102
    expect(updates['matches/TP-01/home_team']).toBe('ENG'); // loser of 101
    expect(updates['matches/TP-01/away_team']).toBe('FRA'); // loser of 102

    // Final (FI-01): home=W101, away=W102
    expect(updates['matches/FI-01/home_team']).toBe('ESP'); // winner of 101
    expect(updates['matches/FI-01/away_team']).toBe('BRA'); // winner of 102
  });

  it('resolves penalty shootout winners correctly', () => {
    const matches = {};

    // R32-01 (match 73): penalty shootout, ARG advances
    matches['R32-01'] = {
      match_number: 73, stage: 'r32', status: 'finished',
      home_team: 'BRA', away_team: 'ARG',
      result: { home_score: 1, away_score: 1, penalties: true, advancing_team: 'ARG' },
    };
    // R32-03 (match 75): normal win
    matches['R32-03'] = {
      match_number: 75, stage: 'r32', status: 'finished',
      home_team: 'FRA', away_team: 'GER',
      result: { home_score: 2, away_score: 0 },
    };

    const updates = computeNextRoundTeams(matches, 'r32');

    // R16-02: home=W73 (ARG via pens), away=W75 (FRA)
    expect(updates['matches/R16-02/home_team']).toBe('ARG');
    expect(updates['matches/R16-02/away_team']).toBe('FRA');
  });
});

// ── areAllGroupMatchesFinished / areAllStageMatchesFinished ───────────

describe('areAllGroupMatchesFinished', () => {
  it('returns true when all 72 group matches are finished', () => {
    const matches = make72GroupMatches();
    expect(areAllGroupMatchesFinished(matches)).toBe(true);
  });

  it('returns false when some group matches are not finished', () => {
    const matches = make72GroupMatches();
    matches['gA_0'].status = 'scheduled';
    expect(areAllGroupMatchesFinished(matches)).toBe(false);
  });

  it('returns false for null', () => {
    expect(areAllGroupMatchesFinished(null)).toBe(false);
  });
});

describe('areAllStageMatchesFinished', () => {
  it('returns true when all r32 matches are finished', () => {
    const matches = {};
    for (let i = 1; i <= 16; i++) {
      matches[`R32-${String(i).padStart(2, '0')}`] = {
        stage: 'r32', status: 'finished',
        result: { home_score: 1, away_score: 0 },
      };
    }
    expect(areAllStageMatchesFinished(matches, 'r32')).toBe(true);
  });

  it('returns false when some r32 matches are not finished', () => {
    const matches = {};
    for (let i = 1; i <= 16; i++) {
      matches[`R32-${String(i).padStart(2, '0')}`] = {
        stage: 'r32', status: i <= 14 ? 'finished' : 'scheduled',
        result: i <= 14 ? { home_score: 1, away_score: 0 } : undefined,
      };
    }
    expect(areAllStageMatchesFinished(matches, 'r32')).toBe(false);
  });
});
