import { Link } from 'react-router-dom';
import { useFirebaseValue } from '../hooks/useFirebase';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n/useI18n';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import TeamFlag from '../components/ui/TeamFlag';
import { computePhasePoints } from '../utils/scoring';
import { isTeamEliminated } from '../utils/matchHelpers';

export default function Leaderboard() {
  const { value: leaderboard, loading: lLoad } = useFirebaseValue('leaderboard');
  const { value: users, loading: uLoad } = useFirebaseValue('users');
  const { value: matches, loading: mLoad } = useFirebaseValue('matches');
  const { value: predictions, loading: pLoad } = useFirebaseValue('predictions');
  const { value: snapshots, loading: sLoad } = useFirebaseValue('leaderboard_snapshots');
  const { value: config, loading: cLoad } = useFirebaseValue('config');
  const { value: specialPredictions, loading: spLoad } = useFirebaseValue('special_predictions');
  const { user } = useAuth();
  const { t } = useI18n();

  if (lLoad || uLoad || mLoad || pLoad || sLoad || cLoad || spLoad) return <LoadingSpinner />;

  // Build trend map from the two most recent snapshots
  const trendMap = {};
  if (snapshots) {
    const snapshotKeys = Object.keys(snapshots).sort();
    if (snapshotKeys.length >= 2) {
      const prev = snapshots[snapshotKeys[snapshotKeys.length - 2]];
      const curr = snapshots[snapshotKeys[snapshotKeys.length - 1]];
      if (prev && curr) {
        for (const [userId, currData] of Object.entries(curr)) {
          const prevData = prev[userId];
          if (prevData && currData.rank != null && prevData.rank != null) {
            trendMap[userId] = prevData.rank - currData.rank; // positive = improved
          }
        }
      }
    }
  }

  // Determine whether to show champion column
  const showChampion = config && ['qf', 'sf', 'finals', 'finished'].includes(config.tournament_phase);

  const entries = [];
  if (leaderboard && users) {
    for (const [userId, data] of Object.entries(leaderboard)) {
      const u = users[userId];
      if (!u) continue;

      // Phase breakdown
      const userPreds = predictions ? predictions[userId] : null;
      const groupPts = computePhasePoints(userPreds, matches, ['group']);
      const koPts = computePhasePoints(userPreds, matches, ['r32', 'r16', 'qf', 'sf', 'third_place', 'final']);
      const specialPts = (data.champion_points || 0) + (data.goleador_points || 0);

      // Champion pick
      const userSpecial = specialPredictions ? specialPredictions[userId] : null;
      const championPick = userSpecial ? userSpecial.champion : null;

      entries.push({
        userId,
        name: u.display_name || u.username,
        ...data,
        groupPoints: groupPts.totalPoints,
        koPoints: koPts.totalPoints,
        specialPoints: specialPts,
        championPick,
        trend: trendMap[userId] ?? null,
      });
    }
  }

  entries.sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    if (b.plenos !== a.plenos) return b.plenos - a.plenos;
    return a.name.localeCompare(b.name);
  });

  function renderTrend(trend) {
    if (trend === null || trend === undefined) return <td className="leaderboard-hide-mobile"></td>;
    if (trend > 0) return <td className="leaderboard-hide-mobile trend-up">&#9650;{trend}</td>;
    if (trend < 0) return <td className="leaderboard-hide-mobile trend-down">&#9660;{Math.abs(trend)}</td>;
    return <td className="leaderboard-hide-mobile trend-same">&mdash;</td>;
  }

  function renderTrendMobile(trend) {
    if (trend === null || trend === undefined) return <td className="leaderboard-show-mobile-only"></td>;
    if (trend > 0) return <td className="leaderboard-show-mobile-only trend-up">&#9650;{trend}</td>;
    if (trend < 0) return <td className="leaderboard-show-mobile-only trend-down">&#9660;{Math.abs(trend)}</td>;
    return <td className="leaderboard-show-mobile-only trend-same">&mdash;</td>;
  }

  function renderChampion(entry) {
    if (!entry.championPick) return <td className="leaderboard-hide-mobile"></td>;
    const eliminated = isTeamEliminated(entry.championPick, matches);
    return (
      <td className="leaderboard-hide-mobile">
        <span className={`champion-pick${eliminated ? ' champion-eliminated' : ''}`}>
          <TeamFlag teamCode={entry.championPick} size={16} />
          {entry.championPick}
        </span>
      </td>
    );
  }

  return (
    <div className="page-leaderboard">
      <h2 className="page-title">{t('leaderboard.title')}</h2>
      {entries.length === 0 ? (
        <p className="empty-state">No data yet.</p>
      ) : (
        <div className="leaderboard-table-wrapper">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>{t('leaderboard.rank')}</th>
                <th className="leaderboard-hide-mobile">{t('leaderboard.trend')}</th>
                <th>{t('leaderboard.player')}</th>
                {showChampion && <th className="leaderboard-hide-mobile">{t('leaderboard.champion')}</th>}
                <th className="leaderboard-hide-mobile">{t('leaderboard.groupPts')}</th>
                <th className="leaderboard-hide-mobile">{t('leaderboard.knockoutPts')}</th>
                <th className="leaderboard-hide-mobile">{t('leaderboard.specialPts')}</th>
                <th>{t('leaderboard.points')}</th>
                <th className="leaderboard-show-mobile-only">{t('leaderboard.trend')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={entry.userId} className={entry.userId === user?.userId ? 'leaderboard-me' : ''}>
                  <td className="rank">{i + 1}</td>
                  {renderTrend(entry.trend)}
                  <td className="name"><Link to={`/players/${entry.userId}`}>{entry.name}</Link></td>
                  {showChampion && renderChampion(entry)}
                  <td className="leaderboard-hide-mobile leaderboard-breakdown">{entry.groupPoints}</td>
                  <td className="leaderboard-hide-mobile leaderboard-breakdown">{entry.koPoints}</td>
                  <td className="leaderboard-hide-mobile leaderboard-breakdown">{entry.specialPoints}</td>
                  <td className="points">{entry.total_points}</td>
                  {renderTrendMobile(entry.trend)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
