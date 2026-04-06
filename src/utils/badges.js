import { computeMatchPoints } from './scoring';

// Badge definitions
const BADGE_DEFS = {
  pleno_master: { icon: '\u{1F3AF}', nameEn: 'Pleno Master', nameEs: 'Rey del Pleno' },
  on_fire: { icon: '\u{1F525}', nameEn: 'On Fire', nameEs: 'En Racha' },
  best_streak: { icon: '\u26A1', nameEn: 'Best Streak', nameEs: 'Mejor Racha' },
  guru_group_stage: { icon: '\u{1F3C6}', nameEn: 'Group Stage Guru', nameEs: 'Gur\u00FA de Grupos' },
  guru_knockout: { icon: '\u{1F451}', nameEn: 'Knockout Guru', nameEs: 'Gur\u00FA de Eliminatorias' },
};

// Add group gurus A-L
for (const g of 'ABCDEFGHIJKL') {
  BADGE_DEFS[`guru_group_${g}`] = { icon: '\u2B50', nameEn: `Group ${g} Guru`, nameEs: `Gur\u00FA Grupo ${g}` };
}

export { BADGE_DEFS };

/**
 * Compute all achievement badges.
 * @param {Object} allPredictions - { userId: { matchId: { home_score, away_score } } }
 * @param {Object} matches - { matchId: { status, result, stage, group, datetime, ... } }
 * @param {Object} users - { userId: { ... } }
 * @returns {Object} { badgeKey: { holders: [userId1, ...], value: number } }
 */
export function computeBadges(allPredictions, matches, users) {
  if (!allPredictions || !matches || !users) return {};

  const badges = {};
  const userIds = Object.keys(users);

  // Get finished matches sorted by datetime
  const finishedMatches = Object.entries(matches)
    .filter(([, m]) => m.status === 'finished' && m.result)
    .sort(([, a], [, b]) => (a.datetime || 0) - (b.datetime || 0) || (a.match_number || 0) - (b.match_number || 0));

  if (finishedMatches.length === 0) return {};

  // === Pleno Master ===
  const plenoCountByUser = {};
  for (const uid of userIds) {
    let count = 0;
    const preds = allPredictions[uid];
    if (!preds) continue;
    for (const [matchId, match] of finishedMatches) {
      const pred = preds[matchId];
      if (!pred) continue;
      const result = computeMatchPoints(pred, match.result);
      if (result.pleno) count++;
    }
    if (count > 0) plenoCountByUser[uid] = count;
  }
  if (Object.keys(plenoCountByUser).length > 0) {
    const maxPlenos = Math.max(...Object.values(plenoCountByUser));
    if (maxPlenos > 0) {
      badges.pleno_master = {
        holders: Object.entries(plenoCountByUser).filter(([, c]) => c === maxPlenos).map(([uid]) => uid),
        value: maxPlenos,
      };
    }
  }

  // === On Fire & Best Streak ===
  const currentStreakByUser = {};
  const maxStreakByUser = {};
  for (const uid of userIds) {
    const preds = allPredictions[uid];
    if (!preds) continue;
    let current = 0;
    let max = 0;
    for (const [matchId, match] of finishedMatches) {
      const pred = preds[matchId];
      if (pred) {
        const result = computeMatchPoints(pred, match.result);
        if (result.points > 0) {
          current++;
          if (current > max) max = current;
        } else {
          current = 0;
        }
      } else {
        current = 0;
      }
    }
    currentStreakByUser[uid] = current;
    maxStreakByUser[uid] = max;
  }

  // On Fire: active streak >= 3
  const onFireUsers = Object.entries(currentStreakByUser).filter(([, s]) => s >= 3);
  if (onFireUsers.length > 0) {
    const maxOnFire = Math.max(...onFireUsers.map(([, s]) => s));
    badges.on_fire = {
      holders: onFireUsers.filter(([, s]) => s === maxOnFire).map(([uid]) => uid),
      value: maxOnFire,
    };
  }

  // Best Streak: highest max streak ever
  const maxStreakValues = Object.values(maxStreakByUser).filter((v) => v > 0);
  if (maxStreakValues.length > 0) {
    const bestStreak = Math.max(...maxStreakValues);
    if (bestStreak > 0) {
      badges.best_streak = {
        holders: Object.entries(maxStreakByUser).filter(([, s]) => s === bestStreak).map(([uid]) => uid),
        value: bestStreak,
      };
    }
  }

  // === Group X Guru (A-L) ===
  const GROUPS = 'ABCDEFGHIJKL'.split('');
  const MATCHES_PER_GROUP = 6;

  for (const g of GROUPS) {
    const groupMatches = finishedMatches.filter(([, m]) => m.stage === 'group' && m.group === g);
    // Only award after all 6 group matches are finished
    if (groupMatches.length < MATCHES_PER_GROUP) continue;

    const pointsByUser = {};
    for (const uid of userIds) {
      const preds = allPredictions[uid];
      if (!preds) continue;
      let pts = 0;
      for (const [matchId, match] of groupMatches) {
        const pred = preds[matchId];
        if (!pred) continue;
        pts += computeMatchPoints(pred, match.result).points;
      }
      if (pts > 0) pointsByUser[uid] = pts;
    }

    if (Object.keys(pointsByUser).length > 0) {
      const maxPts = Math.max(...Object.values(pointsByUser));
      if (maxPts > 0) {
        badges[`guru_group_${g}`] = {
          holders: Object.entries(pointsByUser).filter(([, p]) => p === maxPts).map(([uid]) => uid),
          value: maxPts,
        };
      }
    }
  }

  // === Group Stage Guru ===
  const TOTAL_GROUP_MATCHES = 72;
  const allGroupMatches = finishedMatches.filter(([, m]) => m.stage === 'group');
  if (allGroupMatches.length >= TOTAL_GROUP_MATCHES) {
    const pointsByUser = {};
    for (const uid of userIds) {
      const preds = allPredictions[uid];
      if (!preds) continue;
      let pts = 0;
      for (const [matchId, match] of allGroupMatches) {
        const pred = preds[matchId];
        if (!pred) continue;
        pts += computeMatchPoints(pred, match.result).points;
      }
      if (pts > 0) pointsByUser[uid] = pts;
    }

    if (Object.keys(pointsByUser).length > 0) {
      const maxPts = Math.max(...Object.values(pointsByUser));
      if (maxPts > 0) {
        badges.guru_group_stage = {
          holders: Object.entries(pointsByUser).filter(([, p]) => p === maxPts).map(([uid]) => uid),
          value: maxPts,
        };
      }
    }
  }

  // === Knockout Guru ===
  const knockoutMatches = finishedMatches.filter(([, m]) => m.stage !== 'group');
  // Check if all knockout matches are done: either tournament is finished or no upcoming knockout matches remain
  const allKnockoutMatches = Object.values(matches).filter((m) => m.stage !== 'group');
  const allKnockoutFinished = allKnockoutMatches.length > 0 && allKnockoutMatches.every((m) => m.status === 'finished');
  // We also check tournament_phase from config via matches metadata, but since we don't have config here,
  // we rely on allKnockoutFinished. The caller can also pass tournament_phase via config if needed.
  if (allKnockoutFinished && knockoutMatches.length > 0) {
    const pointsByUser = {};
    for (const uid of userIds) {
      const preds = allPredictions[uid];
      if (!preds) continue;
      let pts = 0;
      for (const [matchId, match] of knockoutMatches) {
        const pred = preds[matchId];
        if (!pred) continue;
        pts += computeMatchPoints(pred, match.result).points;
      }
      if (pts > 0) pointsByUser[uid] = pts;
    }

    if (Object.keys(pointsByUser).length > 0) {
      const maxPts = Math.max(...Object.values(pointsByUser));
      if (maxPts > 0) {
        badges.guru_knockout = {
          holders: Object.entries(pointsByUser).filter(([, p]) => p === maxPts).map(([uid]) => uid),
          value: maxPts,
        };
      }
    }
  }

  return badges;
}
