import { THIRD_PLACE_SLOTS } from '../data/thirdPlaceMapping';

/**
 * Rank all 3rd-place teams from group standings.
 * Returns array of { group, team_code, points, gd, gf } sorted by ranking.
 */
export function rankThirdPlaceTeams(groupStandings) {
  if (!groupStandings) return [];

  const thirdPlaceTeams = [];
  for (const [group, teams] of Object.entries(groupStandings)) {
    if (teams.length >= 3) {
      const third = teams[2]; // standings are already sorted
      thirdPlaceTeams.push({
        group,
        team_code: third.team_code,
        points: third.points,
        gd: third.gd,
        gf: third.gf,
      });
    }
  }

  // Sort: points DESC > GD DESC > GF DESC
  thirdPlaceTeams.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.group.localeCompare(b.group);
  });

  return thirdPlaceTeams;
}

/**
 * Select the top 8 third-place teams and assign them to R32 slots.
 * Uses a greedy algorithm: for each slot (in order), assign the first
 * available qualifying group from its allowed list.
 *
 * Returns: { matchId: teamCode, ... } for the 8 R32 matches needing 3rd-place teams.
 */
export function resolveThirdPlaceSlots(groupStandings) {
  const ranked = rankThirdPlaceTeams(groupStandings);
  const top8 = ranked.slice(0, 8);
  const qualifyingGroups = new Set(top8.map((t) => t.group));
  const teamByGroup = {};
  for (const t of top8) {
    teamByGroup[t.group] = t.team_code;
  }

  const assignments = {};
  const assignedGroups = new Set();

  // Sort slots by number of allowed groups (ascending) for better constraint satisfaction
  const sortedSlots = [...THIRD_PLACE_SLOTS].sort(
    (a, b) => a.allowedGroups.filter((g) => qualifyingGroups.has(g)).length -
              b.allowedGroups.filter((g) => qualifyingGroups.has(g)).length
  );

  for (const slot of sortedSlots) {
    for (const group of slot.allowedGroups) {
      if (qualifyingGroups.has(group) && !assignedGroups.has(group)) {
        assignments[slot.matchId] = teamByGroup[group];
        assignedGroups.add(group);
        break;
      }
    }
  }

  return assignments;
}
