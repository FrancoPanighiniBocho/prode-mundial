import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFirebaseValue } from '../hooks/useFirebase';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n/useI18n';
import { canSeeOtherPredictions, formatDateTimeART } from '../utils/matchHelpers';
import { computeMatchPoints } from '../utils/scoring';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import TeamFlag from '../components/ui/TeamFlag';

export default function MatchDetail() {
  const { matchId } = useParams();
  const { value: matches, loading: mLoad } = useFirebaseValue('matches');
  const { value: teams, loading: tLoad } = useFirebaseValue('teams');
  const { value: allPredictions, loading: pLoad } = useFirebaseValue('predictions');
  const { value: users, loading: uLoad } = useFirebaseValue('users');
  const { user } = useAuth();
  const { t } = useI18n();
  const [showFunFacts, setShowFunFacts] = useState(false);

  if (mLoad || tLoad || pLoad || uLoad) return <LoadingSpinner />;

  const match = matches?.[matchId];
  if (!match) return <p className="empty-state">{t('common.notFound')}</p>;

  const homeTeam = teams?.[match.home_team];
  const awayTeam = teams?.[match.away_team];
  const showOthers = canSeeOtherPredictions(match);

  // Collect all predictions for this match
  const predictions = [];
  if (showOthers && allPredictions && users) {
    for (const [userId, userPreds] of Object.entries(allPredictions)) {
      const pred = userPreds[matchId];
      if (!pred) continue;
      const u = users[userId];
      if (!u) continue;
      const scoring = match.result ? computeMatchPoints(pred, match.result) : null;
      predictions.push({
        userId,
        name: u.display_name || u.username,
        isMe: userId === user?.userId,
        ...pred,
        scoring,
      });
    }
    predictions.sort((a, b) => (b.scoring?.points || 0) - (a.scoring?.points || 0));
  }

  return (
    <div className="page-match-detail">
      <div className="match-detail-header">
        <div className="match-detail-date">{formatDateTimeART(match.datetime)}</div>
        <div className="match-detail-teams">
          <div className="match-detail-team">
            <TeamFlag team={homeTeam} size="lg" />
            <span className="team-name-lg">{homeTeam?.name || match.home_placeholder || 'TBD'}</span>
          </div>
          {match.status === 'finished' && match.result ? (
            <div className="match-detail-score">
              <span>{match.result.home_score}</span>
              <span className="score-separator">-</span>
              <span>{match.result.away_score}</span>
              {match.result.extra_time && <span className="match-tag">{t('match.extraTime')}</span>}
              {match.result.penalties && <span className="match-tag">{t('match.penalties')}</span>}
            </div>
          ) : (
            <div className="match-detail-vs">{t('match.vs')}</div>
          )}
          <div className="match-detail-team">
            <TeamFlag team={awayTeam} size="lg" />
            <span className="team-name-lg">{awayTeam?.name || match.away_placeholder || 'TBD'}</span>
          </div>
        </div>
        <div className={`match-status-badge ${match.status}`}>
          {t(`match.${match.status}`)}
        </div>
      </div>

      {showOthers && (
        <div className="match-predictions-section">
          <h3>{t('match.predictions')}</h3>
          {predictions.length === 0 ? (
            <p className="empty-state">{t('match.noPrediction')}</p>
          ) : (
            <div className="predictions-list">
              {predictions.map((pred) => (
                <div key={pred.userId} className={`prediction-row ${pred.isMe ? 'prediction-me' : ''}`}>
                  <span className="prediction-name">{pred.name}</span>
                  <span className="prediction-score">{pred.home_score} - {pred.away_score}</span>
                  {pred.scoring && (
                    <span className={`prediction-points ${pred.scoring.pleno ? 'pleno' : pred.scoring.correctOutcome ? 'correct' : ''}`}>
                      {pred.scoring.pleno ? '3 pts' : pred.scoring.correctOutcome ? '1 pt' : '0'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showOthers && predictions.length > 0 && (() => {
        const total = predictions.length;
        let homeWins = 0, draws = 0, awayWins = 0;
        const scoreCounts = {};
        let plenoCount = 0;

        for (const pred of predictions) {
          const h = Number(pred.home_score);
          const a = Number(pred.away_score);
          if (h > a) homeWins++;
          else if (h === a) draws++;
          else awayWins++;

          const key = `${h}-${a}`;
          scoreCounts[key] = (scoreCounts[key] || 0) + 1;

          if (pred.scoring?.pleno) plenoCount++;
        }

        const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0;
        const mostCommonEntry = Object.entries(scoreCounts).sort((a, b) => b[1] - a[1])[0];

        return (
          <div className="fun-facts-section">
            <button
              className="fun-facts-toggle"
              onClick={() => setShowFunFacts((v) => !v)}
            >
              {t('match.funFacts')} {showFunFacts ? '▲' : '▼'}
            </button>
            {showFunFacts && (
              <div className="fun-facts-content">
                <div className="fun-fact-row">
                  {homeWins} {t('match.predictedHomeWin')} ({pct(homeWins)}%), {draws} {t('match.predictedDraw')} ({pct(draws)}%), {awayWins} {t('match.predictedAwayWin')} ({pct(awayWins)}%)
                </div>
                {mostCommonEntry && (
                  <div className="fun-fact-row">
                    {t('match.mostCommon')}: <strong>{mostCommonEntry[0]}</strong> ({mostCommonEntry[1]} {mostCommonEntry[1] === 1 ? 'person' : 'people'})
                  </div>
                )}
                {match.result && (
                  <div className="fun-fact-row">
                    {t('match.plenoCount').replace('{count}', plenoCount)}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {!showOthers && match.status !== 'finished' && (
        <p className="empty-state" style={{ marginTop: 24 }}>
          {t('predictions.knockoutClosed')}
        </p>
      )}
    </div>
  );
}
