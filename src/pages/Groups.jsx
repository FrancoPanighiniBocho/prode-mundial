import { useFirebaseValue } from '../hooks/useFirebase';
import { useI18n } from '../i18n/useI18n';
import { computeGroupStandings } from '../utils/groupStandings';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import TeamFlag from '../components/ui/TeamFlag';

const GROUP_LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

export default function Groups() {
  const { value: matches, loading: mLoad } = useFirebaseValue('matches');
  const { value: teams, loading: tLoad } = useFirebaseValue('teams');
  const { t } = useI18n();

  if (mLoad || tLoad) return <LoadingSpinner />;

  const standings = computeGroupStandings(matches, teams);

  return (
    <div className="page-groups">
      <h2 className="page-title">{t('nav.groups')}</h2>
      <div className="groups-grid">
        {GROUP_LETTERS.map((letter) => {
          const group = standings[letter] || [];
          return (
            <div key={letter} className="group-card">
              <h3 className="group-header">{t('common.group')} {letter}</h3>
              <table className="group-table">
                <thead>
                  <tr>
                    <th className="team-col">Team</th>
                    <th>P</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>GD</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {group.map((row, idx) => {
                    const team = teams?.[row.team_code];
                    return (
                      <tr key={row.team_code} className={idx < 2 ? 'qualified' : idx === 2 ? 'third-place' : ''}>
                        <td className="team-col">
                          <TeamFlag team={team} />
                          <span className="team-name">{team?.name || row.team_code}</span>
                        </td>
                        <td>{row.played}</td>
                        <td>{row.won}</td>
                        <td>{row.drawn}</td>
                        <td>{row.lost}</td>
                        <td>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                        <td className="points">{row.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
