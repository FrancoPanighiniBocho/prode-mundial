import { useParams, Link } from 'react-router-dom';
import { useFirebaseValue } from '../hooks/useFirebase';
import { useI18n } from '../i18n/useI18n';
import { computeGroupStandings } from '../utils/groupStandings';
import { formatDateART, formatTimeART } from '../utils/matchHelpers';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import TeamFlag from '../components/ui/TeamFlag';

const STAGE_LABELS = {
  en: { group: 'Group', r32: 'R32', r16: 'R16', qf: 'QF', sf: 'SF', third_place: '3rd', final: 'Final' },
  es: { group: 'Grupo', r32: 'D16avos', r16: 'Octavos', qf: 'Cuartos', sf: 'Semis', third_place: '3ro', final: 'Final' },
};

export default function TeamDetail() {
  const { teamCode } = useParams();
  const { value: matches, loading: mLoad } = useFirebaseValue('matches');
  const { value: teams, loading: tLoad } = useFirebaseValue('teams');
  const { t, locale } = useI18n();

  if (mLoad || tLoad) return <LoadingSpinner />;

  const team = teams?.[teamCode];
  if (!team) return <p className="empty-state">{t('common.notFound')}</p>;

  const labels = STAGE_LABELS[locale] || STAGE_LABELS.en;

  // Group standings
  const standings = computeGroupStandings(matches, teams);
  const groupRows = team.group ? standings[team.group] || [] : [];
  const teamRow = groupRows.find((r) => r.team_code === teamCode);
  const position = teamRow ? groupRows.indexOf(teamRow) + 1 : null;

  // All matches for this team
  const teamMatches = matches
    ? Object.entries(matches)
        .filter(([, m]) => m.home_team === teamCode || m.away_team === teamCode)
        .sort(([, a], [, b]) => (a.datetime || 0) - (b.datetime || 0))
    : [];

  const stageLabel = (match) => {
    if (match.stage === 'group') return `${labels.group} ${match.group || ''}`;
    return labels[match.stage] || match.stage;
  };

  return (
    <div className="page-team-detail">
      <div className="team-detail-header">
        <TeamFlag team={team} size="lg" />
        <div className="team-detail-name">{team.name}</div>
        {team.group && (
          <div className="team-detail-group">{t('common.group')} {team.group}</div>
        )}
      </div>

      {teamRow && (
        <div className="team-standings-mini">
          {position && (
            <div className="stat">
              <span className="stat-label">{t('common.position')}</span>
              <span className="stat-value highlight">{position}</span>
            </div>
          )}
          <div className="stat">
            <span className="stat-label">Pts</span>
            <span className="stat-value highlight">{teamRow.points}</span>
          </div>
          <div className="stat">
            <span className="stat-label">{t('common.won')}</span>
            <span className="stat-value">{teamRow.won}</span>
          </div>
          <div className="stat">
            <span className="stat-label">{t('common.drawn')}</span>
            <span className="stat-value">{teamRow.drawn}</span>
          </div>
          <div className="stat">
            <span className="stat-label">{t('common.lost')}</span>
            <span className="stat-value">{teamRow.lost}</span>
          </div>
          <div className="stat">
            <span className="stat-label">GD</span>
            <span className="stat-value">{teamRow.gd > 0 ? `+${teamRow.gd}` : teamRow.gd}</span>
          </div>
        </div>
      )}

      <div className="team-matches-list">
        <h3 className="section-title">{t('common.matches')}</h3>
        {teamMatches.length === 0 && (
          <p className="empty-state">{t('predictions.knockoutClosed')}</p>
        )}
        {teamMatches.map(([matchId, match]) => {
          const isHome = match.home_team === teamCode;
          const opponentCode = isHome ? match.away_team : match.home_team;
          const opponent = teams?.[opponentCode];
          const isFinished = match.status === 'finished';

          return (
            <Link
              to={`/matches/${matchId}`}
              key={matchId}
              className={`team-match-row ${isFinished ? 'finished' : ''}`}
            >
              <div className="team-match-date">
                {formatDateART(match.datetime)}<br />
                {formatTimeART(match.datetime)}
              </div>
              <div className="team-match-stage">{stageLabel(match)}</div>
              <div className="team-match-opponent">
                <TeamFlag team={opponent} />
                <span>{opponent?.name || opponentCode || 'TBD'}</span>
              </div>
              {isFinished && match.result ? (
                <div className="team-match-score">
                  {isHome
                    ? `${match.result.home_score} - ${match.result.away_score}`
                    : `${match.result.away_score} - ${match.result.home_score}`}
                </div>
              ) : (
                <div className="team-match-upcoming">{t('match.upcoming')}</div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
