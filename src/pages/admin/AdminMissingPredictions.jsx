import { useMemo } from 'react';
import { useFirebaseValue } from '../../hooks/useFirebase';
import { useTournamentValue } from '../../hooks/useTournamentValue';
import { useTournament } from '../../context/TournamentContext';
import { useI18n } from '../../i18n/useI18n';
import { canEditPrediction } from '../../utils/matchHelpers';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const PHASE_KEYS = ['group', 'r32', 'r16', 'qf', 'sf', 'finals'];

function getMatchPhase(match) {
  if (match.stage === 'third_place' || match.stage === 'final') return 'finals';
  return match.stage;
}

export default function AdminMissingPredictions() {
  const { tournamentId, allTournaments, setTournamentId } = useTournament();
  const { value: users, loading: uLoad } = useTournamentValue('users');
  const { value: matches, loading: mLoad } = useFirebaseValue('matches');
  const { value: predictions, loading: pLoad } = useTournamentValue('predictions');
  const { value: config, loading: cLoad } = useFirebaseValue('config');
  const { t } = useI18n();

  const rows = useMemo(() => {
    if (!users || !matches || !config) return [];
    const knockoutPhasesOpen = config.knockout_phases_open || {};

    // Find all editable matches grouped by phase
    const editableByPhase = {};
    Object.entries(matches).forEach(([matchId, match]) => {
      if (!canEditPrediction(match, knockoutPhasesOpen)) return;
      const phase = getMatchPhase(match);
      if (!editableByPhase[phase]) editableByPhase[phase] = [];
      editableByPhase[phase].push(matchId);
    });

    const result = [];
    Object.entries(users).forEach(([userId, userData]) => {
      if (userData.role === 'admin' || userData.role === 'spectator') return;
      const userPreds = predictions?.[userId] || {};

      PHASE_KEYS.forEach((phase) => {
        const phaseMatches = editableByPhase[phase];
        if (!phaseMatches || phaseMatches.length === 0) return;
        const total = phaseMatches.length;
        const predicted = phaseMatches.filter((id) => userPreds[id]).length;
        const missing = total - predicted;
        if (missing > 0) {
          result.push({
            userId,
            name: userData.display_name || userData.username || userId,
            phase,
            total,
            predicted,
            missing,
          });
        }
      });
    });

    result.sort((a, b) => b.missing - a.missing);
    return result;
  }, [users, matches, predictions, config]);

  if (uLoad || mLoad || pLoad || cLoad) return <LoadingSpinner />;

  return (
    <div className="admin-missing">
      {allTournaments && (
        <div className="admin-tournament-selector" style={{ marginBottom: 16 }}>
          <label style={{ marginRight: 8 }}>{t('admin.tournament') || 'Tournament'}:</label>
          <select value={tournamentId || ''} onChange={(e) => setTournamentId(e.target.value)}>
            <option value="" disabled>{t('admin.selectTournament') || 'Select tournament'}</option>
            {Object.entries(allTournaments).map(([id, meta]) => (
              <option key={id} value={id}>{meta.name || id}</option>
            ))}
          </select>
        </div>
      )}
      <h3>{t('admin.missingTitle')}</h3>
      {rows.length === 0 ? (
        <p className="complete" style={{ color: 'var(--win-green)', textAlign: 'center', padding: '24px 0' }}>
          {t('admin.allComplete')}
        </p>
      ) : (
        <table className="admin-missing-table">
          <thead>
            <tr>
              <th>{t('leaderboard.player')}</th>
              <th>{t('home.phase')}</th>
              <th>{t('admin.predicted')}</th>
              <th>{t('admin.missingCount')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.userId}-${row.phase}`}>
                <td>{row.name}</td>
                <td>{t(`phases.${row.phase}`)}</td>
                <td>{row.predicted}/{row.total}</td>
                <td className="missing-count">{row.missing}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
