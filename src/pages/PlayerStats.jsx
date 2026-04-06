import { useParams } from 'react-router-dom';
import { useFirebaseValue } from '../hooks/useFirebase';
import { useI18n } from '../i18n/useI18n';
import { computeMatchPoints } from '../utils/scoring';
import { BADGE_DEFS } from '../utils/badges';
import { isTeamEliminated, formatDateART } from '../utils/matchHelpers';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import TeamFlag from '../components/ui/TeamFlag';

const STAGE_ORDER = ['group', 'r32', 'r16', 'qf', 'sf', 'third_place', 'final'];

const STAGE_LABELS = {
  group: 'Group Stage',
  r32: 'Round of 32',
  r16: 'Round of 16',
  qf: 'Quarter-Finals',
  sf: 'Semi-Finals',
  third_place: 'Finals',
  final: 'Finals',
};

function getStageBucket(stage) {
  if (stage === 'third_place' || stage === 'final') return 'finals';
  return stage;
}

export default function PlayerStats() {
  const { userId } = useParams();
  const { t, locale } = useI18n();

  const { value: users, loading: uLoad } = useFirebaseValue('users');
  const { value: leaderboard, loading: lLoad } = useFirebaseValue('leaderboard');
  const { value: matches, loading: mLoad } = useFirebaseValue('matches');
  const { value: teams, loading: tLoad } = useFirebaseValue('teams');
  const { value: predictions, loading: pLoad } = useFirebaseValue(`predictions/${userId}`);
  const { value: specialPredictions, loading: spLoad } = useFirebaseValue(`special_predictions/${userId}`);
  const { value: config, loading: cLoad } = useFirebaseValue('config');
  const { value: badges, loading: bLoad } = useFirebaseValue('badges');

  if (uLoad || lLoad || mLoad || tLoad || pLoad || spLoad || cLoad || bLoad) return <LoadingSpinner />;

  const userInfo = users?.[userId];
  if (!userInfo) return <p className="empty-state">{t('common.notFound')}</p>;

  const playerName = userInfo.display_name || userInfo.username;
  const lb = leaderboard?.[userId] || {};
  const isFinished = config?.tournament_phase === 'finished';

  // Champion pick
  const championTeamCode = specialPredictions?.champion;
  const championTeam = championTeamCode ? teams?.[championTeamCode] : null;
  const championEliminated = championTeamCode ? isTeamEliminated(championTeamCode, matches) : false;

  // Goleador pick (only after tournament ends)
  const goleadorName = isFinished ? specialPredictions?.goleador : null;

  // Build finished match predictions list and phase breakdown
  const finishedMatchEntries = [];
  const phasePoints = {};

  if (matches) {
    for (const [matchId, match] of Object.entries(matches)) {
      if (match.status !== 'finished' || !match.result) continue;
      const pred = predictions?.[matchId];
      if (!pred) continue;

      const scoring = computeMatchPoints(pred, match.result);
      const homeTeam = teams?.[match.home_team];
      const awayTeam = teams?.[match.away_team];

      finishedMatchEntries.push({
        matchId,
        datetime: match.datetime,
        stage: match.stage,
        homeTeam,
        awayTeam,
        homeName: homeTeam?.name || match.home_team || 'TBD',
        awayName: awayTeam?.name || match.away_team || 'TBD',
        predHome: pred.home_score,
        predAway: pred.away_score,
        realHome: match.result.home_score,
        realAway: match.result.away_score,
        extraTime: match.result.extra_time,
        penalties: match.result.penalties,
        scoring,
      });

      // Phase breakdown
      const bucket = getStageBucket(match.stage);
      if (!phasePoints[bucket]) {
        phasePoints[bucket] = { points: 0, plenos: 0, correct: 0, matches: 0 };
      }
      phasePoints[bucket].points += scoring.points;
      if (scoring.pleno) phasePoints[bucket].plenos++;
      else if (scoring.correctOutcome) phasePoints[bucket].correct++;
      phasePoints[bucket].matches++;
    }
  }

  // Sort match entries by datetime
  finishedMatchEntries.sort((a, b) => (a.datetime || 0) - (b.datetime || 0));

  // Build ordered phase breakdown rows
  const phaseBreakdownBuckets = ['group', 'r32', 'r16', 'qf', 'sf', 'finals'];
  const phaseBreakdownLabels = {
    group: 'Group Stage',
    r32: 'Round of 32',
    r16: 'Round of 16',
    qf: 'Quarter-Finals',
    sf: 'Semi-Finals',
    finals: 'Finals',
  };

  return (
    <div className="page-player-stats container">
      <h2 className="page-title">{t('playerStats.title')}</h2>

      {/* Player Header */}
      <div className="player-header card">
        <h3 className="player-name">{playerName}</h3>
        <div className="player-picks">
          {championTeam && (
            <div className={`special-pick ${championEliminated ? 'eliminated' : ''}`}>
              <span className="special-pick-label">{t('predictions.champion')}</span>
              <TeamFlag team={championTeam} size="sm" />
              <span className={`special-pick-value ${championEliminated ? 'eliminated-text' : ''}`}>
                {championTeam.name}
              </span>
              <span className={`special-pick-status ${championEliminated ? 'eliminated' : 'alive'}`}>
                {championEliminated ? '\u2718' : '\u2714'}
              </span>
            </div>
          )}
          {goleadorName && (
            <div className="special-pick">
              <span className="special-pick-label">{t('predictions.goleador')}</span>
              <span className="special-pick-value">{goleadorName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Points Summary */}
      <div className="player-points-grid">
        <div className="points-grid-item">
          <span className="points-grid-value total">{lb.total_points ?? 0}</span>
          <span className="points-grid-label">{t('leaderboard.total')}</span>
        </div>
        <div className="points-grid-item">
          <span className="points-grid-value">{lb.match_points ?? 0}</span>
          <span className="points-grid-label">{t('playerStats.matchPoints')}</span>
        </div>
        <div className="points-grid-item">
          <span className="points-grid-value">{lb.champion_points ?? 0}</span>
          <span className="points-grid-label">{t('predictions.champion')}</span>
        </div>
        <div className="points-grid-item">
          <span className="points-grid-value">{lb.goleador_points ?? 0}</span>
          <span className="points-grid-label">{t('predictions.goleador')}</span>
        </div>
        <div className="points-grid-item">
          <span className="points-grid-value pleno">{lb.plenos ?? 0}</span>
          <span className="points-grid-label">{t('leaderboard.plenos')}</span>
        </div>
        <div className="points-grid-item">
          <span className="points-grid-value">{lb.correct_outcomes ?? 0}</span>
          <span className="points-grid-label">{t('leaderboard.correct')}</span>
        </div>
      </div>

      {/* Phase Breakdown */}
      <div className="player-phase-breakdown">
        <h3 className="section-title">{t('playerStats.phaseBreakdown')}</h3>
        <div className="phase-breakdown-table-wrapper">
          <table className="phase-breakdown-table">
            <thead>
              <tr>
                <th>Phase</th>
                <th>Pts</th>
                <th>{t('leaderboard.plenos')}</th>
                <th>{t('leaderboard.correct')}</th>
                <th>Matches</th>
              </tr>
            </thead>
            <tbody>
              {phaseBreakdownBuckets.map((bucket) => {
                const data = phasePoints[bucket];
                if (!data) return null;
                return (
                  <tr key={bucket}>
                    <td className="phase-name-cell">{phaseBreakdownLabels[bucket]}</td>
                    <td className="phase-pts">{data.points}</td>
                    <td>{data.plenos}</td>
                    <td>{data.correct}</td>
                    <td>{data.matches}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prediction History */}
      <div className="player-history">
        <h3 className="section-title">{t('playerStats.history')}</h3>
        {finishedMatchEntries.length === 0 ? (
          <p className="empty-state">{t('match.noPrediction')}</p>
        ) : (
          <div className="history-list">
            {finishedMatchEntries.map((entry) => (
              <div key={entry.matchId} className="history-row card">
                <div className="history-match-info">
                  <span className="history-date">{formatDateART(entry.datetime)}</span>
                  <span className="history-stage">{STAGE_LABELS[entry.stage] || entry.stage}</span>
                </div>
                <div className="history-teams">
                  <div className="history-team">
                    <TeamFlag team={entry.homeTeam} size="sm" />
                    <span>{entry.homeName}</span>
                  </div>
                  <div className="history-result">
                    <span className="history-actual">{entry.realHome} - {entry.realAway}</span>
                    {entry.extraTime && <span className="match-tag">AET</span>}
                    {entry.penalties && <span className="match-tag">Pen</span>}
                  </div>
                  <div className="history-team right">
                    <span>{entry.awayName}</span>
                    <TeamFlag team={entry.awayTeam} size="sm" />
                  </div>
                </div>
                <div className="history-prediction">
                  <span className="history-pred-label">Pred:</span>
                  <span className="history-pred-score">{entry.predHome} - {entry.predAway}</span>
                  <span className={`history-points ${entry.scoring.pleno ? 'pleno' : entry.scoring.correctOutcome ? 'correct' : ''}`}>
                    {entry.scoring.pleno ? '3 pts' : entry.scoring.correctOutcome ? '1 pt' : '0'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="player-badges">
        <h3 className="section-title">{t('playerStats.badges')}</h3>
        <div className="badges-grid">
          {badges && Object.entries(badges).map(([key, badge]) => {
            if (!badge.holders?.includes(userId)) return null;
            const def = BADGE_DEFS[key];
            if (!def) return null;
            return (
              <div key={key} className="badge-item">
                <span className="badge-icon">{def.icon}</span>
                <span className="badge-name">{locale === 'es' ? def.nameEs : def.nameEn}</span>
                {badge.value > 0 && <span className="badge-value">{badge.value}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
