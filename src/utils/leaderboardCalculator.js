import { computeTotalPoints } from './scoring';

/**
 * Normalize a string for fuzzy comparison: lowercase, strip accents.
 */
function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/**
 * Fuzzy match goleador: checks if one name contains the other (after normalization).
 */
function goleadorMatch(predicted, actual) {
  if (!predicted || !actual) return false;
  const p = normalize(predicted);
  const a = normalize(actual);
  if (p.length < 3 || a.length < 3) return p === a;
  return p === a || a.includes(p) || p.includes(a);
}

/**
 * Determine the champion team code from finished final match.
 */
function getChampionTeam(matches) {
  if (!matches) return null;
  const finalMatch = Object.values(matches).find(
    (m) => m.stage === 'final' && m.status === 'finished' && m.result
  );
  if (!finalMatch) return null;
  const { result } = finalMatch;
  if (result.penalties && result.advancing_team) return result.advancing_team;
  if (result.home_score > result.away_score) return finalMatch.home_team;
  if (result.away_score > result.home_score) return finalMatch.away_team;
  // Draw without penalties shouldn't happen in a final, but handle it
  return result.advancing_team || null;
}

/**
 * Recalculate leaderboard for all users and return the data
 * to be written to Firebase at /prode/leaderboard/.
 */
export function calculateLeaderboard(allPredictions, matches, users, specialPredictions, config) {
  if (!users || !matches) return {};

  const championTeam = getChampionTeam(matches);
  const actualGoleador = config?.actual_goleador || null;

  const leaderboard = {};

  for (const userId of Object.keys(users)) {
    const userPredictions = allPredictions?.[userId] || {};
    const { totalPoints, plenos, correctOutcomes } = computeTotalPoints(userPredictions, matches);

    const special = specialPredictions?.[userId] || {};
    const championPoints = championTeam && special.champion === championTeam ? 10 : 0;
    const goleadorPoints = actualGoleador && goleadorMatch(special.goleador, actualGoleador) ? 5 : 0;

    leaderboard[userId] = {
      total_points: totalPoints + championPoints + goleadorPoints,
      match_points: totalPoints,
      plenos,
      correct_outcomes: correctOutcomes,
      champion_points: championPoints,
      goleador_points: goleadorPoints,
    };
  }

  return leaderboard;
}
