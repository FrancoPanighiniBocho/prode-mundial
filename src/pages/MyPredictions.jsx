import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { update } from 'firebase/database';
import { useAuth } from '../hooks/useAuth';
import { useFirebaseValue } from '../hooks/useFirebase';
import { useTournamentValue } from '../hooks/useTournamentValue';
import { useI18n } from '../i18n/useI18n';
import { tournamentRef } from '../config/firebase';
import { useTournament } from '../context/TournamentContext';
import { canEditPrediction, formatDateART, formatTimeART, isTeamEliminated } from '../utils/matchHelpers';
import { computeMatchPoints } from '../utils/scoring';
import CountdownTimer from '../components/match/CountdownTimer';
import TabBar from '../components/ui/TabBar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import TeamFlag from '../components/ui/TeamFlag';

const STAGES = [
  { key: 'group', label: 'phases.group' },
  { key: 'r32', label: 'phases.r32' },
  { key: 'r16', label: 'phases.r16' },
  { key: 'qf', label: 'phases.qf' },
  { key: 'sf', label: 'phases.sf' },
  { key: 'finals', label: 'phases.finals' },
];

export default function MyPredictions() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { tournamentId } = useTournament();
  const navigate = useNavigate();
  const { value: config, loading: cLoad } = useFirebaseValue('config');
  const { value: matches, loading: mLoad } = useFirebaseValue('matches');
  const { value: teams, loading: tLoad } = useFirebaseValue('teams');
  const { value: myPredictions, loading: pLoad } = useTournamentValue(`predictions/${user?.userId}`);
  const { value: mySpecial, loading: sLoad } = useTournamentValue(`special_predictions/${user?.userId}`);
  const [activeTab, setActiveTab] = useState('group');
  const [localPreds, setLocalPreds] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (myPredictions) setLocalPreds(myPredictions);
  }, [myPredictions]);

  // Redirect to initial predictions if not completed
  useEffect(() => {
    if (!cLoad && user && !user.has_completed_initial_predictions) {
      navigate('/predictions/initial', { replace: true });
    }
  }, [cLoad, user, navigate]);

  if (cLoad || mLoad || tLoad || pLoad || sLoad) return <LoadingSpinner />;

  const knockoutPhasesOpen = config?.knockout_phases_open || {};

  const tabs = STAGES.map((s) => ({ key: s.key, label: t(s.label) }));

  // Filter matches for active tab
  const stageMatches = matches
    ? Object.entries(matches)
        .filter(([, m]) => {
          if (activeTab === 'finals') return m.stage === 'third_place' || m.stage === 'final';
          return m.stage === activeTab;
        })
        .sort(([, a], [, b]) => (a.datetime || 0) - (b.datetime || 0))
    : [];

  const handleScoreChange = (matchId, field, value) => {
    const num = value === '' ? '' : Math.max(0, parseInt(value) || 0);
    setLocalPreds((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: num,
      },
    }));
  };

  const savePrediction = async (matchId) => {
    const pred = localPreds[matchId];
    if (pred?.home_score === '' || pred?.home_score == null || pred?.away_score === '' || pred?.away_score == null) return;
    setSaving(true);
    try {
      const now = Date.now();
      await update(tournamentRef(tournamentId, `predictions/${user.userId}/${matchId}`), {
        home_score: pred.home_score,
        away_score: pred.away_score,
        updated_at: now,
        submitted_at: myPredictions?.[matchId]?.submitted_at || now,
      });
    } catch (err) {
      console.error('Save prediction error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-predictions">
      <h2 className="page-title">{t('predictions.title')}</h2>

      {/* Champion & Goleador picks */}
      {mySpecial && (
        <div className="my-special-picks">
          {mySpecial.champion && (() => {
            const champTeam = teams?.[mySpecial.champion];
            const eliminated = isTeamEliminated(mySpecial.champion, matches);
            return (
              <div className={`special-pick ${eliminated ? 'eliminated' : 'alive'}`}>
                <span className="special-pick-label">{t('predictions.champion')}:</span>
                {champTeam && <TeamFlag team={champTeam} />}
                <span className={`special-pick-value ${eliminated ? 'eliminated-text' : ''}`}>
                  {champTeam?.name || mySpecial.champion}
                </span>
                <span className={`special-pick-status ${eliminated ? 'eliminated' : 'alive'}`}>
                  {eliminated ? '\u2718' : '\u2714'}
                </span>
              </div>
            );
          })()}
          {mySpecial.goleador && (
            <div className="special-pick">
              <span className="special-pick-label">{t('predictions.goleador')}:</span>
              <span className="special-pick-value">{mySpecial.goleador}</span>
            </div>
          )}
        </div>
      )}

      {(() => {
        const unpredictedInPhase = stageMatches.filter(
          ([matchId, match]) => canEditPrediction(match, knockoutPhasesOpen) && !myPredictions?.[matchId]
        ).length;
        return unpredictedInPhase > 0 ? (
          <div className="missing-predictions-banner">
            <span>{t('predictions.missingBanner', { count: unpredictedInPhase })}</span>
          </div>
        ) : null;
      })()}

      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="predictions-match-list">
        {stageMatches.length === 0 ? (
          <p className="empty-state">{t('predictions.knockoutClosed')}</p>
        ) : (
          (() => {
            // Group matches by group letter for group stage, otherwise just render flat
            const isGroupStage = activeTab === 'group';
            const grouped = isGroupStage
              ? stageMatches.reduce((acc, [matchId, match]) => {
                  const g = match.group || '?';
                  if (!acc[g]) acc[g] = [];
                  acc[g].push([matchId, match]);
                  return acc;
                }, {})
              : { _all: stageMatches };
            const groupKeys = Object.keys(grouped).sort();

            return groupKeys.map((groupKey) => (
              <div key={groupKey} className={isGroupStage ? 'matches-group-section' : ''}>
                {isGroupStage && (
                  <h3 className="matches-group-header">{t('common.group')} {groupKey}</h3>
                )}
                {grouped[groupKey].map(([matchId, match]) => {
            const homeTeam = teams?.[match.home_team];
            const awayTeam = teams?.[match.away_team];
            const pred = localPreds[matchId] || {};
            const savedPred = myPredictions?.[matchId];
            const editable = canEditPrediction(match, knockoutPhasesOpen);
            const isFinished = match.status === 'finished';
            const scoring = isFinished && savedPred && match.result
              ? computeMatchPoints(savedPred, match.result)
              : null;

            const hasUnsaved = pred.home_score !== savedPred?.home_score || pred.away_score !== savedPred?.away_score;

            return (
              <div key={matchId} className={`prediction-match-row ${isFinished ? 'finished' : ''}`}>
                <div className="prediction-match-info">
                  <span className="prediction-match-date">{formatDateART(match.datetime)} {formatTimeART(match.datetime)}</span>
                  {editable && <CountdownTimer datetime={match.datetime} />}
                </div>
                <div className="prediction-match-teams">
                  <div className="prediction-team home">
                    {match.home_team ? (
                      <Link to={`/teams/${match.home_team}`} className="team-link">
                        <TeamFlag team={homeTeam} />
                        <span className="team-name">{homeTeam?.name || 'TBD'}</span>
                      </Link>
                    ) : (
                      <><TeamFlag team={homeTeam} /><span className="team-name">{match.home_placeholder || 'TBD'}</span></>
                    )}
                  </div>
                  <div className="prediction-inputs">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={pred.home_score ?? ''}
                      onChange={(e) => handleScoreChange(matchId, 'home_score', e.target.value)}
                      disabled={!editable}
                      className="score-input"
                    />
                    <span className="score-dash">-</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={pred.away_score ?? ''}
                      onChange={(e) => handleScoreChange(matchId, 'away_score', e.target.value)}
                      disabled={!editable}
                      className="score-input"
                    />
                  </div>
                  <div className="prediction-team away">
                    {match.away_team ? (
                      <Link to={`/teams/${match.away_team}`} className="team-link">
                        <TeamFlag team={awayTeam} />
                        <span className="team-name">{awayTeam?.name || 'TBD'}</span>
                      </Link>
                    ) : (
                      <><TeamFlag team={awayTeam} /><span className="team-name">{match.away_placeholder || 'TBD'}</span></>
                    )}
                  </div>
                </div>
                <div className="prediction-match-actions">
                  {editable && hasUnsaved && (
                    <button className="btn btn-small btn-primary" onClick={() => savePrediction(matchId)} disabled={saving}>
                      {t('admin.save')}
                    </button>
                  )}
                  {!editable && savedPred && (
                    <span className="prediction-locked">{t('predictions.locked')}</span>
                  )}
                  {scoring && (
                    <span className={`prediction-points-badge ${scoring.pleno ? 'pleno' : scoring.correctOutcome ? 'correct' : 'wrong'}`}>
                      {scoring.points} pts
                    </span>
                  )}
                  {isFinished && (
                    <Link to={`/matches/${matchId}`} className="btn btn-small btn-secondary">
                      {t('match.predictions')}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
              </div>
            ));
          })()
        )}
      </div>
    </div>
  );
}
