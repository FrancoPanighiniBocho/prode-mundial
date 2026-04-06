import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFirebaseValue } from '../hooks/useFirebase';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n/useI18n';
import { formatDateTimeART, getMatchesByStatus, canEditPrediction } from '../utils/matchHelpers';
import TeamFlag from '../components/ui/TeamFlag';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const TOURNAMENT_START = Date.UTC(2026, 5, 11, 19, 0); // June 11 2026 19:00 UTC

function useCountdown(target) {
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return { days, hours, mins };
}

export default function Home() {
  const { value: config, loading: cLoad } = useFirebaseValue('config');
  const { value: matches, loading: mLoad } = useFirebaseValue('matches');
  const { value: teams, loading: tLoad } = useFirebaseValue('teams');
  const { value: leaderboard, loading: lLoad } = useFirebaseValue('leaderboard');
  const { value: users, loading: uLoad } = useFirebaseValue('users');
  const { user, role } = useAuth();
  const { value: myPredictions } = useFirebaseValue(`predictions/${user?.userId}`);
  const { t } = useI18n();
  const countdown = useCountdown(TOURNAMENT_START);

  // Find next upcoming match
  const nextMatch = useMemo(() => {
    if (!matches) return null;
    const now = Date.now();
    return getMatchesByStatus(matches, 'upcoming')
      .filter(([, m]) => m.datetime > now)[0] || null;
  }, [matches]);

  // Recent finished matches (last 3)
  const recentResults = useMemo(() => {
    return getMatchesByStatus(matches, 'finished').reverse().slice(0, 3);
  }, [matches]);

  // Top 5 leaderboard
  const topPlayers = useMemo(() => {
    if (!leaderboard || !users) return [];
    return Object.entries(leaderboard)
      .map(([id, data]) => ({ id, name: users[id]?.display_name || users[id]?.username || id, ...data }))
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, 5);
  }, [leaderboard, users]);

  const unpredictedCount = useMemo(() => {
    if (!matches || !config || role === 'spectator') return 0;
    const knockoutPhasesOpen = config?.knockout_phases_open || {};
    return Object.entries(matches).filter(([id, m]) =>
      canEditPrediction(m, knockoutPhasesOpen) && !myPredictions?.[id]
    ).length;
  }, [matches, config, myPredictions, role]);

  if (cLoad || mLoad) return <LoadingSpinner />;

  const phase = config?.tournament_phase || 'pre_tournament';
  const [nextId, nextM] = nextMatch || [null, null];
  const nextHome = nextM ? teams?.[nextM.home_team] : null;
  const nextAway = nextM ? teams?.[nextM.away_team] : null;

  return (
    <div className="page-home">
      <div className="hero">
        <h2 className="hero-title">{t('home.title')}</h2>
        <p className="hero-subtitle">{t('home.subtitle')}</p>

        {countdown && (
          <div className="countdown-section">
            <span className="countdown-label">{t('home.countdown')}</span>
            <div className="countdown-values">
              <div className="countdown-unit">
                <span className="countdown-number">{countdown.days}</span>
                <span className="countdown-text">{t('home.days') || 'days'}</span>
              </div>
              <span className="countdown-sep">:</span>
              <div className="countdown-unit">
                <span className="countdown-number">{countdown.hours}</span>
                <span className="countdown-text">{t('home.hours') || 'hrs'}</span>
              </div>
              <span className="countdown-sep">:</span>
              <div className="countdown-unit">
                <span className="countdown-number">{countdown.mins}</span>
                <span className="countdown-text">min</span>
              </div>
            </div>
          </div>
        )}

        {!countdown && (
          <div className="hero-phase">
            <span className="phase-label">{t('home.phase')}</span>
            <span className="phase-value">{t(`phases.${phase}`)}</span>
          </div>
        )}
      </div>

      {/* Unpredicted matches banner */}
      {role !== 'spectator' && user && unpredictedCount > 0 && (
        <div className="prediction-banner">
          <span className="prediction-banner-text">
            {t('home.unpredicted').replace('{count}', unpredictedCount)}
          </span>
          <Link to="/predictions" className="prediction-banner-link btn btn-small">
            {t('home.goPredict')}
          </Link>
        </div>
      )}

      {/* Next match */}
      {nextM && (
        <Card className="home-next-match">
          <h3 className="section-label">{t('home.nextMatch')}</h3>
          <div className="next-match-content">
            <div className="next-match-team">
              <TeamFlag team={nextHome} size="md" />
              <span>{nextHome?.name || nextM.home_placeholder || 'TBD'}</span>
            </div>
            <div className="next-match-info">
              <span className="next-match-vs">{t('match.vs')}</span>
              <span className="next-match-date">{formatDateTimeART(nextM.datetime)}</span>
            </div>
            <div className="next-match-team">
              <TeamFlag team={nextAway} size="md" />
              <span>{nextAway?.name || nextM.away_placeholder || 'TBD'}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Quick actions */}
      {role !== 'spectator' && user && (
        <div className="home-actions">
          <Link to="/predictions" className="btn btn-primary">
            {t('nav.predictions')}
          </Link>
        </div>
      )}

      {/* Top 5 leaderboard */}
      {topPlayers.length > 0 && (
        <Card className="home-leaderboard-card">
          <h3 className="section-label">{t('nav.leaderboard')}</h3>
          <div className="home-top-list">
            {topPlayers.map((p, i) => (
              <div key={p.id} className={`home-top-row ${p.id === user?.userId ? 'is-me' : ''}`}>
                <span className="home-top-rank">{i + 1}</span>
                <span className="home-top-name">{p.name}</span>
                <span className="home-top-pts">{p.total_points} pts</span>
              </div>
            ))}
          </div>
          <Link to="/leaderboard" className="home-see-all">{t('common.seeAll') || 'See all'} &rarr;</Link>
        </Card>
      )}

      {/* Recent results */}
      {recentResults.length > 0 && (
        <Card className="home-recent-card">
          <h3 className="section-label">{t('home.recentResults') || 'Recent Results'}</h3>
          {recentResults.map(([id, m]) => {
            const h = teams?.[m.home_team];
            const a = teams?.[m.away_team];
            return (
              <Link to={`/matches/${id}`} key={id} className="home-result-row">
                <span className="home-result-team"><TeamFlag team={h} /> {h?.name || 'TBD'}</span>
                <span className="home-result-score">{m.result?.home_score} - {m.result?.away_score}</span>
                <span className="home-result-team"><TeamFlag team={a} /> {a?.name || 'TBD'}</span>
              </Link>
            );
          })}
        </Card>
      )}

      {/* Navigation grid */}
      <div className="home-grid">
        <Link to="/groups" className="home-card-link">
          <Card className="home-card"><h3>{t('nav.groups')}</h3></Card>
        </Link>
        <Link to="/bracket" className="home-card-link">
          <Card className="home-card"><h3>{t('nav.bracket')}</h3></Card>
        </Link>
      </div>
    </div>
  );
}
