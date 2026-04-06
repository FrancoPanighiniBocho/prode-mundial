/**
 * Compute points for a single match prediction.
 *
 * Scoring rules:
 * - 3 points for exact score (pleno)
 * - 1 point for correct outcome (win/draw/lose)
 * - 0 points otherwise
 *
 * Extra time: the score after ET is the real result.
 * Penalties: always counted as a draw using the pre-penalty score.
 */
export function computeMatchPoints(prediction, result) {
  if (!prediction || !result || result.home_score == null || result.away_score == null) {
    return { points: 0, pleno: false, correctOutcome: false };
  }

  const predHome = prediction.home_score;
  const predAway = prediction.away_score;

  // For penalties, the result is treated as a draw (pre-penalty score)
  const realHome = result.home_score;
  const realAway = result.away_score;
  const isPenalties = result.penalties === true;

  // Exact score match (pleno)
  const pleno = predHome === realHome && predAway === realAway;
  if (pleno) {
    return { points: 3, pleno: true, correctOutcome: true };
  }

  // Outcome comparison
  const predOutcome = Math.sign(predHome - predAway); // 1=home win, 0=draw, -1=away win
  const realOutcome = isPenalties ? 0 : Math.sign(realHome - realAway); // penalties = draw

  const correctOutcome = predOutcome === realOutcome;
  return {
    points: correctOutcome ? 1 : 0,
    pleno: false,
    correctOutcome,
  };
}

/**
 * Sum up points across all finished matches for a user.
 */
export function computeTotalPoints(predictions, matches) {
  let totalPoints = 0;
  let plenos = 0;
  let correctOutcomes = 0;

  if (!predictions || !matches) return { totalPoints, plenos, correctOutcomes };

  for (const [matchId, match] of Object.entries(matches)) {
    if (match.status !== 'finished' || !match.result) continue;
    const pred = predictions[matchId];
    if (!pred) continue;

    const result = computeMatchPoints(pred, match.result);
    totalPoints += result.points;
    if (result.pleno) plenos++;
    else if (result.correctOutcome) correctOutcomes++;
  }

  return { totalPoints, plenos, correctOutcomes };
}

/**
 * Compute points for matches in specific phases only.
 */
export function computePhasePoints(predictions, matches, phases) {
  let totalPoints = 0, plenos = 0, correctOutcomes = 0;
  if (!predictions || !matches) return { totalPoints, plenos, correctOutcomes };
  for (const [matchId, match] of Object.entries(matches)) {
    if (match.status !== 'finished' || !match.result) continue;
    if (!phases.includes(match.stage)) continue;
    const pred = predictions[matchId];
    if (!pred) continue;
    const result = computeMatchPoints(pred, match.result);
    totalPoints += result.points;
    if (result.pleno) plenos++;
    else if (result.correctOutcome) correctOutcomes++;
  }
  return { totalPoints, plenos, correctOutcomes };
}
