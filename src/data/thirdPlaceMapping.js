/**
 * FIFA 2026 Third-Place Team to R32 Slot Mapping
 *
 * TODO: Replace greedy algorithm with official FIFA Annex C lookup table
 * (495 combinations) when published in machine-readable format.
 * Current approach: greedy assignment with constraint sorting.
 * Safety net: admin can override any team assignment in AdminKnockout.
 *
 * Each R32 match that hosts a "Best 3rd" team lists which groups the 3rd-place
 * team can come from. Given the 8 qualifying groups (sorted alphabetically),
 * this table maps each combination to which R32 match slot gets which group's 3rd.
 *
 * Since there are C(12,8) = 495 possible combinations, we use a greedy algorithm:
 * For each R32 slot that needs a 3rd-place team, assign the first available
 * qualifying group from its allowed list.
 *
 * R32 slots that need a 3rd-place team (from knockoutStructure.js):
 * R32-02 (match 74): Best 3rd (A/B/C/D/F)
 * R32-05 (match 77): Best 3rd (C/D/F/G/H)
 * R32-07 (match 79): Best 3rd (C/E/F/H/I)
 * R32-08 (match 80): Best 3rd (E/H/I/J/K)
 * R32-09 (match 81): Best 3rd (B/E/F/I/J)
 * R32-10 (match 82): Best 3rd (A/E/H/I/J)
 * R32-13 (match 85): Best 3rd (E/F/G/I/J)
 * R32-15 (match 87): Best 3rd (D/E/I/J/L)
 */

export const THIRD_PLACE_SLOTS = [
  { matchId: 'R32-02', allowedGroups: ['A','B','C','D','F'] },
  { matchId: 'R32-05', allowedGroups: ['C','D','F','G','H'] },
  { matchId: 'R32-07', allowedGroups: ['C','E','F','H','I'] },
  { matchId: 'R32-08', allowedGroups: ['E','H','I','J','K'] },
  { matchId: 'R32-09', allowedGroups: ['B','E','F','I','J'] },
  { matchId: 'R32-10', allowedGroups: ['A','E','H','I','J'] },
  { matchId: 'R32-13', allowedGroups: ['E','F','G','I','J'] },
  { matchId: 'R32-15', allowedGroups: ['D','E','I','J','L'] },
];
