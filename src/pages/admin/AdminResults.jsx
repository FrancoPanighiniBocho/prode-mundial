import { useState } from 'react';
import { update, set, get } from 'firebase/database';
import { useFirebaseValue } from '../../hooks/useFirebase';
import { useI18n } from '../../i18n/useI18n';
import { prodeRef } from '../../config/firebase';
import { calculateLeaderboard } from '../../utils/leaderboardCalculator';
import { computeGroupStandings } from '../../utils/groupStandings';
import { formatDateART, formatTimeART } from '../../utils/matchHelpers';
import { autoPopulateIfRoundComplete } from '../../utils/knockoutAutoPopulate';
import { computeBadges } from '../../utils/badges';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import TabBar from '../../components/ui/TabBar';

export default function AdminResults() {
  const { value: matches, loading: mLoad } = useFirebaseValue('matches');
  const { value: teams, loading: tLoad } = useFirebaseValue('teams');
  const { value: users, loading: uLoad } = useFirebaseValue('users');
  const { value: allPredictions, loading: pLoad } = useFirebaseValue('predictions');
  const { value: specialPredictions, loading: spLoad } = useFirebaseValue('special_predictions');
  const { value: config, loading: cfLoad } = useFirebaseValue('config');
  const { t } = useI18n();
  const [filter, setFilter] = useState('upcoming');
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState(null);
  const [scores, setScores] = useState({});

  if (mLoad || tLoad || uLoad || pLoad || spLoad || cfLoad) return <LoadingSpinner />;

  const tabs = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'finished', label: 'Finished' },
  ];

  const matchList = matches
    ? Object.entries(matches)
        .filter(([, m]) => filter === 'upcoming' ? m.status !== 'finished' : m.status === 'finished')
        .sort(([, a], [, b]) => (a.datetime || 0) - (b.datetime || 0))
    : [];

  const handleScoreChange = (matchId, field, value) => {
    const parsed = (field === 'extra_time' || field === 'penalties')
      ? value
      : field === 'advancing_team'
        ? value
        : value === '' ? '' : parseInt(value) || 0;
    setScores((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [field]: parsed },
    }));
  };

  const handleMarkFinished = async (matchId) => {
    const match = matches[matchId];
    const score = scores[matchId] || {};
    if (score.home_score == null || score.away_score == null || score.home_score === '' || score.away_score === '') return;

    setSaving(matchId);
    setError(null);
    try {
      const now = Date.now();

      // Update match result
      const resultData = {
        home_score: score.home_score,
        away_score: score.away_score,
        extra_time: score.extra_time || false,
        penalties: score.penalties || false,
      };
      // For knockout matches with penalties, store which team advances
      if (match.stage !== 'group' && score.penalties && score.advancing_team) {
        resultData.advancing_team = score.advancing_team;
      }

      await update(prodeRef(`matches/${matchId}`), {
        status: 'finished',
        finished_at: now,
        result_entered_at: now,
        result: resultData,
      });

      try {
        // Re-fetch fresh data before recalculating
        const [freshPredictionsSnap, freshSpecialSnap, freshConfigSnap] = await Promise.all([
          get(prodeRef('predictions')),
          get(prodeRef('special_predictions')),
          get(prodeRef('config')),
        ]);
        const freshPredictions = freshPredictionsSnap.val();
        const freshSpecial = freshSpecialSnap.val();
        const freshConfig = freshConfigSnap.val();

        // Recalculate group standings if group match
        const updatedMatches = { ...matches, [matchId]: { ...match, status: 'finished', result: { home_score: score.home_score, away_score: score.away_score, extra_time: score.extra_time || false, penalties: score.penalties || false } } };

        if (match.stage === 'group') {
          const standings = computeGroupStandings(updatedMatches, teams);
          await set(prodeRef('group_standings'), standings);
          await update(prodeRef('group_standings_meta'), { last_updated: now });
        }

        // Recalculate leaderboard
        const leaderboard = calculateLeaderboard(freshPredictions, updatedMatches, users, freshSpecial, freshConfig);
        await set(prodeRef('leaderboard'), leaderboard);
        await update(prodeRef('leaderboard_meta'), { last_updated: now });

        // Store leaderboard snapshot for trend arrows
        const snapshotData = {};
        const sorted = Object.entries(leaderboard)
          .sort(([, a], [, b]) => (b.total_points - a.total_points) || (b.plenos - a.plenos));
        sorted.forEach(([userId, data], idx) => {
          snapshotData[userId] = { total_points: data.total_points, rank: idx + 1 };
        });
        await set(prodeRef(`leaderboard_snapshots/${now}`), { timestamp: now, data: snapshotData });

        // Compute and store achievement badges
        const badges = computeBadges(freshPredictions, updatedMatches, users);
        await set(prodeRef('badges'), badges);

        // Auto-populate knockout brackets if a round is complete
        await autoPopulateIfRoundComplete(updatedMatches, teams);
      } catch (recalcErr) {
        // Rollback match status to upcoming
        console.error('Leaderboard/standings update failed, rolling back:', recalcErr);
        await update(prodeRef(`matches/${matchId}`), {
          status: 'upcoming',
          finished_at: null,
          result_entered_at: null,
          result: null,
        });
        throw new Error('Leaderboard update failed. Match reverted to upcoming. ' + recalcErr.message);
      }
    } catch (err) {
      console.error('Error marking finished:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="admin-results">
      <h3>{t('admin.results')}</h3>
      <TabBar tabs={tabs} active={filter} onChange={setFilter} />

      {error && <div className="admin-error" style={{ color: '#d32f2f', background: '#fdecea', padding: '8px 12px', borderRadius: '4px', marginBottom: '12px' }}>{error}</div>}
      <div className="admin-matches-list">
        {matchList.map(([matchId, match]) => {
          const homeTeam = teams?.[match.home_team];
          const awayTeam = teams?.[match.away_team];
          const score = scores[matchId] || match.result || {};

          return (
            <div key={matchId} className="admin-match-row">
              <div className="admin-match-info">
                <span>{formatDateART(match.datetime)} {formatTimeART(match.datetime)}</span>
                <span className="admin-match-stage">{match.stage} {match.group ? `(${t('common.group')} ${match.group})` : ''}</span>
              </div>
              <div className="admin-match-teams">
                <span>{homeTeam?.name || match.home_placeholder || 'TBD'}</span>
                <div className="admin-score-inputs">
                  <input
                    type="number"
                    min="0"
                    value={score.home_score ?? ''}
                    onChange={(e) => handleScoreChange(matchId, 'home_score', e.target.value)}
                    className="score-input"
                    disabled={match.status === 'finished'}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min="0"
                    value={score.away_score ?? ''}
                    onChange={(e) => handleScoreChange(matchId, 'away_score', e.target.value)}
                    className="score-input"
                    disabled={match.status === 'finished'}
                  />
                </div>
                <span>{awayTeam?.name || match.away_placeholder || 'TBD'}</span>
              </div>
              {match.status !== 'finished' && (
                <div className="admin-match-actions">
                  <label className="admin-checkbox">
                    <input type="checkbox" checked={score.extra_time || false}
                      onChange={(e) => handleScoreChange(matchId, 'extra_time', e.target.checked)} />
                    ET
                  </label>
                  <label className="admin-checkbox">
                    <input type="checkbox" checked={score.penalties || false}
                      onChange={(e) => handleScoreChange(matchId, 'penalties', e.target.checked)} />
                    PEN
                  </label>
                  {match.stage !== 'group' && score.penalties && match.home_team && match.away_team && (
                    <select
                      value={score.advancing_team || ''}
                      onChange={(e) => handleScoreChange(matchId, 'advancing_team', e.target.value)}
                      className="advancing-select"
                    >
                      <option value="">Advances?</option>
                      <option value={match.home_team}>{teams?.[match.home_team]?.name || match.home_team}</option>
                      <option value={match.away_team}>{teams?.[match.away_team]?.name || match.away_team}</option>
                    </select>
                  )}
                  <button
                    className="btn btn-small btn-primary"
                    onClick={() => handleMarkFinished(matchId)}
                    disabled={saving === matchId}
                  >
                    {saving === matchId ? '...' : t('admin.markFinished')}
                  </button>
                </div>
              )}
              {match.status === 'finished' && (
                <span className="admin-match-done">Finished</span>
              )}
            </div>
          );
        })}
        {matchList.length === 0 && <p className="empty-state">No matches.</p>}
      </div>
    </div>
  );
}
