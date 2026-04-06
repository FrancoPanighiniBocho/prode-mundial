import { describe, it, expect, vi } from 'vitest';

// Mock the scoring module so we control points/pleno results
vi.mock('../scoring', () => ({
  computeMatchPoints: (pred, result) => {
    if (pred.home_score === result.home_score && pred.away_score === result.away_score) {
      return { points: 3, pleno: true, correctOutcome: true };
    }
    const predOutcome = Math.sign(pred.home_score - pred.away_score);
    const realOutcome = Math.sign(result.home_score - result.away_score);
    if (predOutcome === realOutcome) {
      return { points: 1, pleno: false, correctOutcome: true };
    }
    return { points: 0, pleno: false, correctOutcome: false };
  },
}));

import { computeBadges } from '../badges';

// Helper: create a finished match in a group
function makeGroupMatch(id, group, homeScore, awayScore, datetime = 1000) {
  return [
    id,
    {
      status: 'finished',
      stage: 'group',
      group,
      datetime,
      result: { home_score: homeScore, away_score: awayScore },
    },
  ];
}

// Helper: create a finished match (generic)
function makeMatch(id, homeScore, awayScore, datetime, stage = 'group', group = 'A') {
  return {
    [id]: {
      status: 'finished',
      stage,
      group,
      datetime,
      result: { home_score: homeScore, away_score: awayScore },
    },
  };
}

describe('computeBadges', () => {
  describe('Pleno Master', () => {
    it('awards badge to user with most plenos', () => {
      // 3 finished matches
      const matches = {
        m1: { status: 'finished', stage: 'group', group: 'A', datetime: 1, result: { home_score: 2, away_score: 1 } },
        m2: { status: 'finished', stage: 'group', group: 'A', datetime: 2, result: { home_score: 0, away_score: 0 } },
        m3: { status: 'finished', stage: 'group', group: 'A', datetime: 3, result: { home_score: 3, away_score: 0 } },
      };

      // User A gets 3 plenos, User B gets 1
      const allPredictions = {
        userA: {
          m1: { home_score: 2, away_score: 1 }, // pleno
          m2: { home_score: 0, away_score: 0 }, // pleno
          m3: { home_score: 3, away_score: 0 }, // pleno
        },
        userB: {
          m1: { home_score: 2, away_score: 1 }, // pleno
          m2: { home_score: 1, away_score: 0 }, // correct outcome only
          m3: { home_score: 1, away_score: 0 }, // correct outcome only
        },
      };

      const users = { userA: {}, userB: {} };
      const badges = computeBadges(allPredictions, matches, users);

      expect(badges.pleno_master).toBeDefined();
      expect(badges.pleno_master.holders).toEqual(['userA']);
      expect(badges.pleno_master.value).toBe(3);
    });

    it('awards badge to both users when tied in plenos', () => {
      const matches = {
        m1: { status: 'finished', stage: 'group', group: 'A', datetime: 1, result: { home_score: 1, away_score: 0 } },
        m2: { status: 'finished', stage: 'group', group: 'A', datetime: 2, result: { home_score: 2, away_score: 2 } },
      };

      const allPredictions = {
        userA: {
          m1: { home_score: 1, away_score: 0 }, // pleno
          m2: { home_score: 2, away_score: 2 }, // pleno
        },
        userB: {
          m1: { home_score: 1, away_score: 0 }, // pleno
          m2: { home_score: 2, away_score: 2 }, // pleno
        },
      };

      const users = { userA: {}, userB: {} };
      const badges = computeBadges(allPredictions, matches, users);

      expect(badges.pleno_master).toBeDefined();
      expect(badges.pleno_master.holders).toContain('userA');
      expect(badges.pleno_master.holders).toContain('userB');
      expect(badges.pleno_master.value).toBe(2);
    });

    it('does not award badge when no user has plenos', () => {
      const matches = {
        m1: { status: 'finished', stage: 'group', group: 'A', datetime: 1, result: { home_score: 2, away_score: 1 } },
      };

      const allPredictions = {
        userA: { m1: { home_score: 1, away_score: 0 } }, // correct outcome only
      };

      const users = { userA: {} };
      const badges = computeBadges(allPredictions, matches, users);

      expect(badges.pleno_master).toBeUndefined();
    });
  });

  describe('On Fire (active streak >= 3)', () => {
    it('awards on_fire when user scores on 5 consecutive (most recent) matches', () => {
      // 5 matches in sequence
      const matches = {};
      for (let i = 1; i <= 5; i++) {
        matches[`m${i}`] = {
          status: 'finished', stage: 'group', group: 'A', datetime: i,
          result: { home_score: 1, away_score: 0 },
        };
      }

      // User scores on all 5 (correct outcome)
      const allPredictions = {
        userA: {},
      };
      for (let i = 1; i <= 5; i++) {
        allPredictions.userA[`m${i}`] = { home_score: 2, away_score: 0 }; // correct outcome (home win)
      }

      const users = { userA: {} };
      const badges = computeBadges(allPredictions, matches, users);

      expect(badges.on_fire).toBeDefined();
      expect(badges.on_fire.holders).toEqual(['userA']);
      expect(badges.on_fire.value).toBe(5);
    });

    it('does not award on_fire when active streak is broken', () => {
      // 7 matches: scores 4, misses 1, scores 2
      const matches = {};
      for (let i = 1; i <= 7; i++) {
        matches[`m${i}`] = {
          status: 'finished', stage: 'group', group: 'A', datetime: i,
          result: { home_score: 1, away_score: 0 },
        };
      }

      const allPredictions = {
        userA: {
          m1: { home_score: 2, away_score: 0 }, // score (home win)
          m2: { home_score: 2, away_score: 0 }, // score
          m3: { home_score: 2, away_score: 0 }, // score
          m4: { home_score: 2, away_score: 0 }, // score
          m5: { home_score: 0, away_score: 2 }, // miss (predicted away win, real is home win)
          m6: { home_score: 2, away_score: 0 }, // score
          m7: { home_score: 2, away_score: 0 }, // score
        },
      };

      const users = { userA: {} };
      const badges = computeBadges(allPredictions, matches, users);

      // Active streak is 2 (< 3), so no on_fire
      expect(badges.on_fire).toBeUndefined();
    });

    it('awards on_fire to both users when tied at active streak of 3', () => {
      const matches = {};
      for (let i = 1; i <= 3; i++) {
        matches[`m${i}`] = {
          status: 'finished', stage: 'group', group: 'A', datetime: i,
          result: { home_score: 1, away_score: 0 },
        };
      }

      const allPredictions = {
        userA: {
          m1: { home_score: 2, away_score: 0 },
          m2: { home_score: 2, away_score: 0 },
          m3: { home_score: 2, away_score: 0 },
        },
        userB: {
          m1: { home_score: 3, away_score: 1 },
          m2: { home_score: 3, away_score: 1 },
          m3: { home_score: 3, away_score: 1 },
        },
      };

      const users = { userA: {}, userB: {} };
      const badges = computeBadges(allPredictions, matches, users);

      expect(badges.on_fire).toBeDefined();
      expect(badges.on_fire.holders).toContain('userA');
      expect(badges.on_fire.holders).toContain('userB');
      expect(badges.on_fire.value).toBe(3);
    });
  });

  describe('Best Streak', () => {
    it('records best_streak even when current streak is broken', () => {
      // 8 matches: user scores 6 in a row, then misses, then scores 1
      const matches = {};
      for (let i = 1; i <= 8; i++) {
        matches[`m${i}`] = {
          status: 'finished', stage: 'group', group: 'A', datetime: i,
          result: { home_score: 1, away_score: 0 },
        };
      }

      const allPredictions = {
        userA: {
          m1: { home_score: 2, away_score: 0 }, // score
          m2: { home_score: 2, away_score: 0 }, // score
          m3: { home_score: 2, away_score: 0 }, // score
          m4: { home_score: 2, away_score: 0 }, // score
          m5: { home_score: 2, away_score: 0 }, // score
          m6: { home_score: 2, away_score: 0 }, // score (streak of 6)
          m7: { home_score: 0, away_score: 2 }, // miss (break)
          m8: { home_score: 2, away_score: 0 }, // score (current streak = 1... wait need 2)
        },
      };

      const users = { userA: {} };
      const badges = computeBadges(allPredictions, matches, users);

      expect(badges.best_streak).toBeDefined();
      expect(badges.best_streak.holders).toEqual(['userA']);
      expect(badges.best_streak.value).toBe(6);
    });

    it('awards best_streak to both users when tied', () => {
      const matches = {};
      for (let i = 1; i <= 4; i++) {
        matches[`m${i}`] = {
          status: 'finished', stage: 'group', group: 'A', datetime: i,
          result: { home_score: 1, away_score: 0 },
        };
      }

      const allPredictions = {
        userA: {
          m1: { home_score: 2, away_score: 0 },
          m2: { home_score: 2, away_score: 0 },
          m3: { home_score: 2, away_score: 0 },
          m4: { home_score: 2, away_score: 0 },
        },
        userB: {
          m1: { home_score: 3, away_score: 1 },
          m2: { home_score: 3, away_score: 1 },
          m3: { home_score: 3, away_score: 1 },
          m4: { home_score: 3, away_score: 1 },
        },
      };

      const users = { userA: {}, userB: {} };
      const badges = computeBadges(allPredictions, matches, users);

      expect(badges.best_streak).toBeDefined();
      expect(badges.best_streak.holders).toContain('userA');
      expect(badges.best_streak.holders).toContain('userB');
      expect(badges.best_streak.value).toBe(4);
    });
  });

  describe('Group Guru', () => {
    it('awards guru_group_X when all 6 group matches finished', () => {
      const matches = {};
      for (let i = 1; i <= 6; i++) {
        matches[`gA_m${i}`] = {
          status: 'finished', stage: 'group', group: 'A', datetime: i,
          result: { home_score: 1, away_score: 0 },
        };
      }

      // User A gets 8 pts (plenos + outcomes), User B gets 6 pts
      const allPredictions = {
        userA: {
          gA_m1: { home_score: 1, away_score: 0 }, // pleno (3)
          gA_m2: { home_score: 1, away_score: 0 }, // pleno (3)
          gA_m3: { home_score: 2, away_score: 0 }, // correct outcome (1)
          gA_m4: { home_score: 2, away_score: 0 }, // correct outcome (1)
          gA_m5: { home_score: 0, away_score: 2 }, // wrong (0)
          gA_m6: { home_score: 0, away_score: 2 }, // wrong (0)
        },
        userB: {
          gA_m1: { home_score: 1, away_score: 0 }, // pleno (3)
          gA_m2: { home_score: 2, away_score: 0 }, // correct outcome (1)
          gA_m3: { home_score: 2, away_score: 0 }, // correct outcome (1)
          gA_m4: { home_score: 2, away_score: 0 }, // correct outcome (1)
          gA_m5: { home_score: 0, away_score: 2 }, // wrong (0)
          gA_m6: { home_score: 0, away_score: 2 }, // wrong (0)
        },
      };

      const users = { userA: {}, userB: {} };
      const badges = computeBadges(allPredictions, matches, users);

      expect(badges.guru_group_A).toBeDefined();
      expect(badges.guru_group_A.holders).toEqual(['userA']);
      expect(badges.guru_group_A.value).toBe(8); // 3+3+1+1 = 8
    });

    it('does not award guru if fewer than 6 matches finished', () => {
      const matches = {};
      for (let i = 1; i <= 4; i++) {
        matches[`gB_m${i}`] = {
          status: 'finished', stage: 'group', group: 'B', datetime: i,
          result: { home_score: 1, away_score: 0 },
        };
      }

      const allPredictions = {
        userA: {
          gB_m1: { home_score: 1, away_score: 0 },
          gB_m2: { home_score: 1, away_score: 0 },
          gB_m3: { home_score: 1, away_score: 0 },
          gB_m4: { home_score: 1, away_score: 0 },
        },
      };

      const users = { userA: {} };
      const badges = computeBadges(allPredictions, matches, users);

      expect(badges.guru_group_B).toBeUndefined();
    });

    it('awards guru to tied users', () => {
      const matches = {};
      for (let i = 1; i <= 6; i++) {
        matches[`gC_m${i}`] = {
          status: 'finished', stage: 'group', group: 'C', datetime: i,
          result: { home_score: 1, away_score: 0 },
        };
      }

      // Both users get same points
      const allPredictions = {
        userA: {
          gC_m1: { home_score: 1, away_score: 0 }, // pleno (3)
          gC_m2: { home_score: 2, away_score: 0 }, // outcome (1)
          gC_m3: { home_score: 0, away_score: 2 }, // wrong
          gC_m4: { home_score: 0, away_score: 2 }, // wrong
          gC_m5: { home_score: 0, away_score: 2 }, // wrong
          gC_m6: { home_score: 0, away_score: 2 }, // wrong
        },
        userB: {
          gC_m1: { home_score: 2, away_score: 0 }, // outcome (1)
          gC_m2: { home_score: 2, away_score: 0 }, // outcome (1)
          gC_m3: { home_score: 2, away_score: 0 }, // outcome (1)
          gC_m4: { home_score: 1, away_score: 0 }, // pleno (3) -> nope, that's 6 total. need 4 total
          gC_m5: { home_score: 0, away_score: 2 }, // wrong
          gC_m6: { home_score: 0, away_score: 2 }, // wrong
        },
      };

      // userA: 3+1 = 4, userB: 1+1+1+3 = 6 ... not tied. Let me fix.
      // Actually let me just make them both have identical predictions
      allPredictions.userB = { ...allPredictions.userA };

      const users = { userA: {}, userB: {} };
      const badges = computeBadges(allPredictions, matches, users);

      expect(badges.guru_group_C).toBeDefined();
      expect(badges.guru_group_C.holders).toContain('userA');
      expect(badges.guru_group_C.holders).toContain('userB');
    });
  });

  describe('edge cases', () => {
    it('returns empty object for null inputs', () => {
      expect(computeBadges(null, {}, {})).toEqual({});
      expect(computeBadges({}, null, {})).toEqual({});
      expect(computeBadges({}, {}, null)).toEqual({});
    });

    it('returns empty object when no matches are finished', () => {
      const matches = {
        m1: { status: 'scheduled', stage: 'group', group: 'A' },
      };
      const badges = computeBadges({ userA: {} }, matches, { userA: {} });
      expect(badges).toEqual({});
    });
  });
});
