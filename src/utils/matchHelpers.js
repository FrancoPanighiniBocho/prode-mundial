/**
 * Whether a user can still edit their prediction for a match.
 * - Match must be upcoming (not live/finished)
 * - Current time must be before match datetime
 * - For knockout: the phase must be open
 */
export function canEditPrediction(match, knockoutPhasesOpen) {
  if (!match) return false;
  if (match.status === 'finished' || match.status === 'live') return false;
  if (Date.now() >= match.datetime) return false;
  if (match.stage !== 'group') {
    const phase = match.stage === 'third_place' || match.stage === 'final' ? 'finals' : match.stage;
    if (!knockoutPhasesOpen?.[phase]) return false;
  }
  return true;
}

/**
 * Whether other users' predictions are visible for a match.
 * Only visible once the match is marked as finished by admin.
 */
export function canSeeOtherPredictions(match) {
  return match?.status === 'finished';
}

/**
 * Get a human-readable outcome string.
 */
export function getOutcome(homeScore, awayScore) {
  if (homeScore > awayScore) return 'home';
  if (homeScore < awayScore) return 'away';
  return 'draw';
}

/**
 * Format a UTC timestamp to Argentina time (UTC-3).
 */
export function formatDateART(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
  });
}

export function formatTimeART(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDateTimeART(timestamp) {
  return `${formatDateART(timestamp)} ${formatTimeART(timestamp)}`;
}

/**
 * Check if a team has been eliminated from the tournament.
 * Eliminated if: lost a knockout match, OR not in any R32 match after all groups finished.
 */
export function isTeamEliminated(teamCode, matches) {
  if (!teamCode || !matches) return false;

  const matchList = Object.values(matches);

  // Check knockout elimination (lost a knockout match)
  for (const match of matchList) {
    if (match.stage === 'group' || match.status !== 'finished' || !match.result) continue;
    if (match.home_team !== teamCode && match.away_team !== teamCode) continue;
    const { result } = match;
    let winner;
    if (result.penalties && result.advancing_team) {
      winner = result.advancing_team;
    } else if (result.home_score > result.away_score) {
      winner = match.home_team;
    } else if (result.away_score > result.home_score) {
      winner = match.away_team;
    } else {
      winner = result.advancing_team || null;
    }
    if (winner && winner !== teamCode) return true;
  }

  // Check group-stage elimination: all groups finished but team not in any R32 match
  const groupMatches = matchList.filter((m) => m.stage === 'group');
  const allGroupsDone = groupMatches.length === 72 && groupMatches.every((m) => m.status === 'finished');
  if (allGroupsDone) {
    const r32Matches = matchList.filter((m) => m.stage === 'r32');
    const inR32 = r32Matches.some((m) => m.home_team === teamCode || m.away_team === teamCode);
    if (!inR32) return true;
  }

  return false;
}

/**
 * Get matches filtered by stage, sorted by datetime.
 */
export function getMatchesByStage(matches, stage) {
  if (!matches) return [];
  return Object.entries(matches)
    .filter(([, m]) => m.stage === stage)
    .sort(([, a], [, b]) => (a.datetime || 0) - (b.datetime || 0));
}

/**
 * Get all knockout matches (non-group), sorted by match_number.
 */
export function getKnockoutMatches(matches) {
  if (!matches) return [];
  return Object.entries(matches)
    .filter(([, m]) => m.stage !== 'group')
    .sort(([, a], [, b]) => (a.match_number || 0) - (b.match_number || 0));
}

/**
 * Get matches filtered by status, sorted by datetime.
 */
export function getMatchesByStatus(matches, status) {
  if (!matches) return [];
  return Object.entries(matches)
    .filter(([, m]) => m.status === status)
    .sort(([, a], [, b]) => (a.datetime || 0) - (b.datetime || 0));
}
