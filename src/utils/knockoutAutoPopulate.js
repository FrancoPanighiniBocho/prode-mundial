import { update, set } from 'firebase/database';
import { prodeRef } from '../config/firebase';
import { computeGroupStandings } from './groupStandings';
import { resolveThirdPlaceSlots } from './thirdPlaceResolver';
import { KNOCKOUT_MATCHES } from '../data/knockoutStructure';

const STAGE_ORDER = ['r32', 'r16', 'qf', 'sf', 'finals'];
const NEXT_STAGE = { r32: 'r16', r16: 'qf', qf: 'sf', sf: 'finals' };
const PHASE_FOR_STAGE = { r32: 'r32', r16: 'r16', qf: 'qf', sf: 'sf', third_place: 'finals', final: 'finals' };

/**
 * Determine the winner of a finished knockout match.
 */
function getMatchWinner(match) {
  if (!match || match.status !== 'finished' || !match.result) return null;
  const { result } = match;
  if (result.penalties && result.advancing_team) return result.advancing_team;
  if (result.home_score > result.away_score) return match.home_team;
  if (result.away_score > result.home_score) return match.away_team;
  return result.advancing_team || null;
}

/**
 * Determine the loser of a finished knockout match.
 */
function getMatchLoser(match) {
  const winner = getMatchWinner(match);
  if (!winner) return null;
  return winner === match.home_team ? match.away_team : match.home_team;
}

/**
 * Parse a placeholder like "W73", "L101", "1st Group A", "2nd Group B", "Best 3rd (A/B/C/D/F)".
 * Returns { type: 'winner'|'loser'|'group_pos'|'third_place', ... }
 */
function parsePlaceholder(placeholder) {
  if (!placeholder) return null;

  // W73, W100 etc
  const winnerMatch = placeholder.match(/^W(\d+)$/);
  if (winnerMatch) return { type: 'winner', matchNumber: parseInt(winnerMatch[1]) };

  // L101, L102 etc
  const loserMatch = placeholder.match(/^L(\d+)$/);
  if (loserMatch) return { type: 'loser', matchNumber: parseInt(loserMatch[1]) };

  // 1st Group A, 2nd Group B
  const groupPos = placeholder.match(/^(1st|2nd) Group ([A-L])$/);
  if (groupPos) return { type: 'group_pos', position: groupPos[1] === '1st' ? 0 : 1, group: groupPos[2] };

  // Best 3rd (A/B/C/D/F)
  const thirdPlace = placeholder.match(/^Best 3rd \(([A-L/]+)\)$/);
  if (thirdPlace) return { type: 'third_place', groups: thirdPlace[1].split('/') };

  return null;
}

/**
 * Check if all group matches are finished.
 */
export function areAllGroupMatchesFinished(matches) {
  if (!matches) return false;
  const groupMatches = Object.values(matches).filter((m) => m.stage === 'group');
  return groupMatches.length === 72 && groupMatches.every((m) => m.status === 'finished');
}

/**
 * Check if all matches of a given stage are finished.
 */
export function areAllStageMatchesFinished(matches, stage) {
  if (!matches) return false;
  const stageMatches = Object.values(matches).filter((m) => {
    if (stage === 'finals') return m.stage === 'third_place' || m.stage === 'final';
    return m.stage === stage;
  });
  return stageMatches.length > 0 && stageMatches.every((m) => m.status === 'finished');
}

/**
 * Auto-populate R32 matches from group standings.
 * Returns updates to write to Firebase matches.
 */
export function computeR32Teams(matches, teams, groupStandings) {
  const updates = {};

  // Get 3rd-place slot assignments
  const thirdPlaceAssignments = resolveThirdPlaceSlots(groupStandings);

  // For each R32 match, resolve home and away teams
  const r32Matches = KNOCKOUT_MATCHES.filter((m) => m.stage === 'r32');

  for (const km of r32Matches) {
    const homeResolved = resolvePlaceholder(km.home_placeholder, groupStandings, thirdPlaceAssignments, km.id);
    const awayResolved = resolvePlaceholder(km.away_placeholder, groupStandings, thirdPlaceAssignments, km.id);

    if (homeResolved) updates[`matches/${km.id}/home_team`] = homeResolved;
    if (awayResolved) updates[`matches/${km.id}/away_team`] = awayResolved;
  }

  return updates;
}

function resolvePlaceholder(placeholder, groupStandings, thirdPlaceAssignments, matchId) {
  const parsed = parsePlaceholder(placeholder);
  if (!parsed) return null;

  if (parsed.type === 'group_pos') {
    const group = groupStandings[parsed.group];
    return group?.[parsed.position]?.team_code || null;
  }

  if (parsed.type === 'third_place') {
    return thirdPlaceAssignments[matchId] || null;
  }

  return null;
}

/**
 * Auto-populate next round matches from finished current round.
 * Resolves W/L placeholders.
 */
export function computeNextRoundTeams(matches, stage) {
  const updates = {};
  const nextStage = NEXT_STAGE[stage];
  if (!nextStage) return updates;

  // Build match number → match lookup
  const matchByNumber = {};
  for (const [id, m] of Object.entries(matches)) {
    if (m.match_number) matchByNumber[m.match_number] = { id, ...m };
  }

  // Find next round matches from KNOCKOUT_MATCHES
  const nextMatches = KNOCKOUT_MATCHES.filter((m) => {
    if (nextStage === 'finals') return m.stage === 'third_place' || m.stage === 'final';
    return m.stage === nextStage;
  });

  for (const km of nextMatches) {
    const homeParsed = parsePlaceholder(km.home_placeholder);
    const awayParsed = parsePlaceholder(km.away_placeholder);

    if (homeParsed) {
      const team = resolveWinnerLoser(homeParsed, matchByNumber);
      if (team) updates[`matches/${km.id}/home_team`] = team;
    }
    if (awayParsed) {
      const team = resolveWinnerLoser(awayParsed, matchByNumber);
      if (team) updates[`matches/${km.id}/away_team`] = team;
    }
  }

  return updates;
}

function resolveWinnerLoser(parsed, matchByNumber) {
  if (parsed.type === 'winner') {
    const match = matchByNumber[parsed.matchNumber];
    return match ? getMatchWinner(match) : null;
  }
  if (parsed.type === 'loser') {
    const match = matchByNumber[parsed.matchNumber];
    return match ? getMatchLoser(match) : null;
  }
  return null;
}

/**
 * Main auto-populate function. Called after a match is marked finished.
 * Checks if a round is complete and populates the next round + opens predictions.
 */
export async function autoPopulateIfRoundComplete(matches, teams) {
  // Check group stage completion → populate R32
  if (areAllGroupMatchesFinished(matches)) {
    const r32AlreadyPopulated = Object.values(matches).some(
      (m) => m.stage === 'r32' && m.home_team
    );
    if (!r32AlreadyPopulated) {
      const groupStandings = computeGroupStandings(matches, teams);
      const r32Updates = computeR32Teams(matches, teams, groupStandings);

      if (Object.keys(r32Updates).length > 0) {
        await update(prodeRef(''), r32Updates);
        await update(prodeRef('config/knockout_phases_open'), { r32: true, r32_toggled_at: Date.now() });
        await update(prodeRef('config'), { tournament_phase: 'r32', tournament_phase_updated_at: Date.now() });
        await set(prodeRef('group_standings'), groupStandings);
        return 'r32';
      }
    }
  }

  // Check each knockout stage completion → populate next
  for (const stage of ['r32', 'r16', 'qf', 'sf']) {
    if (areAllStageMatchesFinished(matches, stage)) {
      const nextStage = NEXT_STAGE[stage];
      const nextPhase = nextStage === 'finals' ? 'finals' : nextStage;

      // Check if already populated
      const nextMatches = Object.values(matches).filter((m) => {
        if (nextPhase === 'finals') return m.stage === 'third_place' || m.stage === 'final';
        return m.stage === nextStage;
      });
      const alreadyPopulated = nextMatches.some((m) => m.home_team);
      if (alreadyPopulated) continue;

      const nextUpdates = computeNextRoundTeams(matches, stage);
      if (Object.keys(nextUpdates).length > 0) {
        await update(prodeRef(''), nextUpdates);
        await update(prodeRef('config/knockout_phases_open'), { [nextPhase]: true, [`${nextPhase}_toggled_at`]: Date.now() });
        await update(prodeRef('config'), { tournament_phase: nextPhase, tournament_phase_updated_at: Date.now() });
        return nextPhase;
      }
    }
  }

  return null;
}
