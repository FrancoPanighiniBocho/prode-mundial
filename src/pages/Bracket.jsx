import { useFirebaseValue } from '../hooks/useFirebase';
import { useI18n } from '../i18n/useI18n';
import { formatDateART, getKnockoutMatches } from '../utils/matchHelpers';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';
import TeamFlag from '../components/ui/TeamFlag';

const STAGES = ['r32', 'r16', 'qf', 'sf', 'third_place', 'final'];
const STAGE_LABELS = {
  en: { r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarter-Finals', sf: 'Semi-Finals', third_place: '3rd Place', final: 'Final' },
  es: { r32: 'Dieciseisavos', r16: 'Octavos', qf: 'Cuartos', sf: 'Semifinales', third_place: '3er Puesto', final: 'Final' },
};

export default function Bracket() {
  const { value: matches, loading: mLoad } = useFirebaseValue('matches');
  const { value: teams, loading: tLoad } = useFirebaseValue('teams');
  const { t, locale } = useI18n();

  if (mLoad || tLoad) return <LoadingSpinner />;

  const knockoutMatches = getKnockoutMatches(matches);

  const byStage = {};
  for (const stage of STAGES) {
    byStage[stage] = knockoutMatches
      .filter(([, m]) => m.stage === stage);
  }

  const labels = STAGE_LABELS[locale] || STAGE_LABELS.en;

  return (
    <div className="page-bracket">
      <h2 className="page-title">{t('nav.bracket')}</h2>
      {STAGES.map((stage) => {
        const stageMatches = byStage[stage] || [];
        if (stageMatches.length === 0) return null;
        return (
          <div key={stage} className="bracket-stage">
            <h3 className="bracket-stage-title">{labels[stage]}</h3>
            <div className="bracket-matches">
              {stageMatches.map(([matchId, match]) => {
                const homeTeam = teams?.[match.home_team];
                const awayTeam = teams?.[match.away_team];
                return (
                  <Link to={`/matches/${matchId}`} key={matchId} className="bracket-match-link">
                    <div className={`bracket-match ${match.status}`}>
                      <div className="bracket-date">{formatDateART(match.datetime)}</div>
                      <div className="bracket-teams">
                        <div className="bracket-team">
                          {match.home_team ? (
                            <Link to={`/teams/${match.home_team}`} className="team-link" onClick={(e) => e.stopPropagation()}>
                              <TeamFlag team={homeTeam} />
                              <span>{homeTeam?.name || 'TBD'}</span>
                            </Link>
                          ) : (
                            <><TeamFlag team={homeTeam} /><span>{match.home_placeholder || 'TBD'}</span></>
                          )}
                          {match.status === 'finished' && <span className="bracket-score">{match.result?.home_score}</span>}
                        </div>
                        <div className="bracket-team">
                          {match.away_team ? (
                            <Link to={`/teams/${match.away_team}`} className="team-link" onClick={(e) => e.stopPropagation()}>
                              <TeamFlag team={awayTeam} />
                              <span>{awayTeam?.name || 'TBD'}</span>
                            </Link>
                          ) : (
                            <><TeamFlag team={awayTeam} /><span>{match.away_placeholder || 'TBD'}</span></>
                          )}
                          {match.status === 'finished' && <span className="bracket-score">{match.result?.away_score}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
      {knockoutMatches.length === 0 && (
        <p className="empty-state">{t('predictions.knockoutClosed')}</p>
      )}
    </div>
  );
}
