import { computeGroupStandings } from './groupStandings';
import { resolveThirdPlaceSlots } from './thirdPlaceResolver';
import { KNOCKOUT_MATCHES } from '../data/knockoutStructure';

/**
 * Parse a placeholder like "W73", "L101", "1st Group A", "2nd Group B", "Best 3rd (A/B/C/D/F)".
 */
function parsePlaceholder(placeholder) {
  if (!placeholder) return null;

  const winnerMatch = placeholder.match(/^W(\d+)$/);
  if (winnerMatch) return { type: 'winner', matchNumber: parseInt(winnerMatch[1]) };

  const loserMatch = placeholder.match(/^L(\d+)$/);
  if (loserMatch) return { type: 'loser', matchNumber: parseInt(loserMatch[1]) };

  const groupPos = placeholder.match(/^(1st|2nd) Group ([A-L])$/);
  if (groupPos) return { type: 'group_pos', position: groupPos[1] === '1st' ? 0 : 1, group: groupPos[2] };

  const thirdPlace = placeholder.match(/^Best 3rd \(([A-L/]+)\)$/);
  if (thirdPlace) return { type: 'third_place', groups: thirdPlace[1].split('/') };

  return null;
}

/**
 * Compute projected Round of 32 matchups from user predictions + actual results.
 *
 * For each group match:
 *  - If the match is finished (has actual result), use actual result.
 *  - If user has a prediction, use the prediction as the result.
 *  - Otherwise, assume 0-0.
 *
 * Returns { matchups: [...], unpredictedCount: number }
 */
export function computeProjectedR32(predictions, matches, teams) {
  if (!matches || !teams) return { matchups: [], unpredictedCount: 0 };

  let unpredictedCount = 0;

  // Build projected matches object with group matches having projected results
  const projectedMatches = {};
  for (const [matchId, match] of Object.entries(matches)) {
    if (match.stage !== 'group') continue;

    const projected = {
      stage: 'group',
      group: match.group,
      home_team: match.home_team,
      away_team: match.away_team,
    };

    if (match.status === 'finished' && match.result) {
      // Use actual result
      projected.status = 'finished';
      projected.result = {
        home_score: match.result.home_score,
        away_score: match.result.away_score,
      };
    } else if (predictions?.[matchId] && predictions[matchId].home_score != null && predictions[matchId].away_score != null && predictions[matchId].home_score !== '' && predictions[matchId].away_score !== '') {
      // Use prediction as result
      projected.status = 'finished';
      projected.result = {
        home_score: parseInt(predictions[matchId].home_score) || 0,
        away_score: parseInt(predictions[matchId].away_score) || 0,
      };
    } else {
      // No prediction, assume 0-0
      unpredictedCount++;
      projected.status = 'finished';
      projected.result = { home_score: 0, away_score: 0 };
    }

    projectedMatches[matchId] = projected;
  }

  // Compute standings from projected results
  const standings = computeGroupStandings(projectedMatches, teams);
  const thirdPlaceAssignments = resolveThirdPlaceSlots(standings);

  // Resolve R32 matchups
  const r32Matches = KNOCKOUT_MATCHES.filter((m) => m.stage === 'r32');
  const matchups = [];

  for (const km of r32Matches) {
    const home = resolveGroupPlaceholder(km.home_placeholder, standings, thirdPlaceAssignments, km.id);
    const away = resolveGroupPlaceholder(km.away_placeholder, standings, thirdPlaceAssignments, km.id);

    matchups.push({
      matchId: km.id,
      matchNumber: km.match_number,
      home: home || null,
      away: away || null,
      datetime: km.datetime,
    });
  }

  return { matchups, unpredictedCount };
}

function resolveGroupPlaceholder(placeholder, standings, thirdPlaceAssignments, matchId) {
  const parsed = parsePlaceholder(placeholder);
  if (!parsed) return null;

  if (parsed.type === 'group_pos') {
    const group = standings[parsed.group];
    return group?.[parsed.position]?.team_code || null;
  }

  if (parsed.type === 'third_place') {
    return thirdPlaceAssignments[matchId] || null;
  }

  return null;
}

/**
 * Compute projected next round matchups from user predictions + actual results
 * for knockout stages.
 *
 * currentStage: the stage whose winners feed into the next round ('r32', 'r16', 'qf', 'sf')
 *
 * For each match in currentStage:
 *  - If finished, use actual result (advancing_team).
 *  - If user has a prediction, the higher score wins; on draw, home team advances.
 *  - Otherwise, null (TBD).
 *
 * Returns { matchups: [...] }
 */
export function computeProjectedNextRound(predictions, matches, currentStage) {
  if (!matches) return { matchups: [] };

  const NEXT_STAGE_MAP = { r32: 'r16', r16: 'qf', qf: 'sf', sf: 'finals' };
  const nextStage = NEXT_STAGE_MAP[currentStage];
  if (!nextStage) return { matchups: [] };

  // Build matchNumber -> winner/loser lookup from current stage
  const winnerByMatchNumber = {};
  const loserByMatchNumber = {};

  for (const [matchId, match] of Object.entries(matches)) {
    if (match.stage !== currentStage) continue;
    if (!match.match_number) continue;

    let winner = null;
    let loser = null;

    if (match.status === 'finished' && match.result) {
      // Use actual result
      if (match.result.advancing_team) {
        winner = match.result.advancing_team;
        loser = match.result.advancing_team === match.home_team ? match.away_team : match.home_team;
      } else if (match.result.home_score > match.result.away_score) {
        winner = match.home_team;
        loser = match.away_team;
      } else if (match.result.away_score > match.result.home_score) {
        winner = match.away_team;
        loser = match.home_team;
      } else {
        winner = match.result.advancing_team || null;
        loser = winner ? (winner === match.home_team ? match.away_team : match.home_team) : null;
      }
    } else {
      // Check user prediction
      const pred = predictions?.[matchId];
      if (pred && pred.home_score != null && pred.away_score != null && pred.home_score !== '' && pred.away_score !== '') {
        const hs = parseInt(pred.home_score) || 0;
        const as = parseInt(pred.away_score) || 0;
        if (hs > as) {
          winner = match.home_team || null;
          loser = match.away_team || null;
        } else if (as > hs) {
          winner = match.away_team || null;
          loser = match.home_team || null;
        } else {
          // Draw: home team advances
          winner = match.home_team || null;
          loser = match.away_team || null;
        }
      }
      // If no prediction and not finished, winner/loser remain null
    }

    winnerByMatchNumber[match.match_number] = winner;
    loserByMatchNumber[match.match_number] = loser;
  }

  // Find next stage matches from KNOCKOUT_MATCHES
  const nextMatches = KNOCKOUT_MATCHES.filter((m) => {
    if (nextStage === 'finals') return m.stage === 'third_place' || m.stage === 'final';
    return m.stage === nextStage;
  });

  const matchups = [];
  for (const km of nextMatches) {
    const home = resolveWinnerLoserPlaceholder(km.home_placeholder, winnerByMatchNumber, loserByMatchNumber);
    const away = resolveWinnerLoserPlaceholder(km.away_placeholder, winnerByMatchNumber, loserByMatchNumber);

    matchups.push({
      matchId: km.id,
      matchNumber: km.match_number,
      stage: km.stage,
      home: home || null,
      away: away || null,
      datetime: km.datetime,
    });
  }

  return { matchups };
}

function resolveWinnerLoserPlaceholder(placeholder, winnerByMatchNumber, loserByMatchNumber) {
  const parsed = parsePlaceholder(placeholder);
  if (!parsed) return null;

  if (parsed.type === 'winner') {
    return winnerByMatchNumber[parsed.matchNumber] || null;
  }
  if (parsed.type === 'loser') {
    return loserByMatchNumber[parsed.matchNumber] || null;
  }
  return null;
}

/**
 * Returns what the projected tab should show based on current tournament phase.
 */
export function getProjectedPhaseLabel(tournamentPhase) {
  switch (tournamentPhase) {
    case 'pre_tournament':
    case 'group':
      return 'r32';
    case 'r32':
      return 'r16';
    case 'r16':
      return 'qf';
    case 'qf':
      return 'sf';
    case 'sf':
      return 'finals';
    case 'finals':
    case 'finished':
      return null;
    default:
      return 'r32';
  }
}
