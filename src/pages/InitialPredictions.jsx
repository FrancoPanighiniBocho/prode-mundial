import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { update, set } from 'firebase/database';
import { useAuth } from '../hooks/useAuth';
import { useFirebaseValue } from '../hooks/useFirebase';
import { useTournamentValue } from '../hooks/useTournamentValue';
import { useI18n } from '../i18n/useI18n';
import { tournamentRef } from '../config/firebase';
import { useTournament } from '../context/TournamentContext';
import { formatDateART, formatTimeART } from '../utils/matchHelpers';
import { GOLEADOR_CANDIDATES } from '../data/goleadorCandidates';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import TeamFlag from '../components/ui/TeamFlag';
import Modal from '../components/ui/Modal';

export default function InitialPredictions() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { tournamentId } = useTournament();
  const navigate = useNavigate();
  const { value: matches, loading: mLoad } = useFirebaseValue('matches');
  const { value: teams, loading: tLoad } = useFirebaseValue('teams');
  const { value: existingPreds, loading: pLoad } = useTournamentValue(`predictions/${user?.userId}`);
  const { value: existingSpecial, loading: sLoad } = useTournamentValue(`special_predictions/${user?.userId}`);

  const [preds, setPreds] = useState({});
  const [champion, setChampion] = useState('');
  const [goleador, setGoleador] = useState('');
  const [goleadorInput, setGoleadorInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const predTimers = useRef({});
  const specialTimer = useRef(null);
  const [error, setError] = useState('');
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);

  useEffect(() => {
    if (existingPreds) setPreds(existingPreds);
  }, [existingPreds]);

  useEffect(() => {
    if (existingSpecial) {
      setChampion(existingSpecial.champion || '');
      setGoleador(existingSpecial.goleador || '');
      setGoleadorInput(existingSpecial.goleador || '');
    }
  }, [existingSpecial]);

  const groupMatches = useMemo(() => {
    if (!matches) return [];
    return Object.entries(matches)
      .filter(([, m]) => m.stage === 'group')
      .sort(([, a], [, b]) => (a.datetime || 0) - (b.datetime || 0));
  }, [matches]);

  // Group by group letter for display
  const matchesByGroup = useMemo(() => {
    const grouped = {};
    for (const [id, match] of groupMatches) {
      const g = match.group || '?';
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push([id, match]);
    }
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [groupMatches]);

  const filledCount = groupMatches.filter(([id]) => {
    const p = preds[id];
    return p && p.home_score != null && p.home_score !== '' && p.away_score != null && p.away_score !== '';
  }).length;

  const allFilled = filledCount === groupMatches.length && champion && goleador;

  // Auto-save a single prediction to Firebase (debounced per match)
  const autoSavePrediction = (matchId, updatedPred) => {
    if (updatedPred.home_score == null || updatedPred.home_score === '' ||
        updatedPred.away_score == null || updatedPred.away_score === '') return;
    if (predTimers.current[matchId]) clearTimeout(predTimers.current[matchId]);
    predTimers.current[matchId] = setTimeout(() => {
      const now = Date.now();
      update(tournamentRef(tournamentId, `predictions/${user.userId}/${matchId}`), {
        home_score: updatedPred.home_score,
        away_score: updatedPred.away_score,
        submitted_at: existingPreds?.[matchId]?.submitted_at || now,
        updated_at: now,
      }).catch((err) => console.error('Auto-save error:', err));
    }, 800);
  };

  const handleScoreChange = (matchId, field, value) => {
    const num = value === '' ? '' : Math.max(0, parseInt(value) || 0);
    setPreds((prev) => {
      const updated = { ...prev[matchId], [field]: num };
      // Auto-save when both scores are filled
      autoSavePrediction(matchId, updated);
      return { ...prev, [matchId]: updated };
    });
  };

  // Auto-save special predictions (debounced)
  const autoSaveSpecial = (newChampion, newGoleador) => {
    if (specialTimer.current) clearTimeout(specialTimer.current);
    specialTimer.current = setTimeout(() => {
      const now = Date.now();
      update(tournamentRef(tournamentId, `special_predictions/${user.userId}`), {
        champion: newChampion || null,
        goleador: newGoleador || null,
        submitted_at: existingSpecial?.submitted_at || now,
        updated_at: now,
      }).catch((err) => console.error('Auto-save special error:', err));
    }, 800);
  };

  const handleChampionChange = (value) => {
    setChampion(value);
    autoSaveSpecial(value, goleador);
  };

  const handleGoleadorSelect = (name) => {
    setGoleador(name);
    setGoleadorInput(name);
    setShowSuggestions(false);
    autoSaveSpecial(champion, name);
  };

  const filteredCandidates = goleadorInput.length >= 1
    ? GOLEADOR_CANDIDATES.filter((c) =>
        c.name.toLowerCase().includes(goleadorInput.toLowerCase()) ||
        c.country.toLowerCase().includes(goleadorInput.toLowerCase())
      )
    : GOLEADOR_CANDIDATES;

  const handleSubmitAll = async () => {
    if (!allFilled) return;
    setSaving(true);
    setError('');
    try {
      // Predictions are already auto-saved — just mark user as complete
      await update(tournamentRef(tournamentId, `users/${user.userId}`), {
        has_completed_initial_predictions: true,
        completed_initial_predictions_at: Date.now(),
      });
      navigate('/predictions');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (mLoad || tLoad || pLoad || sLoad) return <LoadingSpinner />;

  const teamList = teams ? Object.entries(teams).sort(([, a], [, b]) => a.name.localeCompare(b.name)) : [];

  return (
    <div className="page-initial-predictions">
      <h2 className="page-title">{t('predictions.initial')}</h2>

      <div className="initial-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(filledCount / groupMatches.length) * 100}%` }} />
        </div>
        <span className="progress-text">{t('predictions.progress', { count: filledCount, total: groupMatches.length })}</span>
      </div>

      {/* Special predictions */}
      <div className="special-predictions-section">
        <h3>{t('predictions.champion')}</h3>
        <select
          value={champion}
          onChange={(e) => handleChampionChange(e.target.value)}
          className="champion-select"
        >
          <option value="">{t('predictions.selectTeam')}</option>
          {teamList.map(([code, team]) => (
            <option key={code} value={code}>{team.name}</option>
          ))}
        </select>

        <h3>{t('predictions.goleador')}</h3>
        <div className="goleador-input-wrapper">
          <input
            type="text"
            value={goleadorInput}
            onChange={(e) => {
              setGoleadorInput(e.target.value);
              setGoleador(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={t('predictions.enterPlayer')}
            className="goleador-input"
          />
          {showSuggestions && filteredCandidates.length > 0 && (
            <div className="goleador-suggestions">
              {filteredCandidates.slice(0, 10).map((c) => (
                <button
                  key={c.name}
                  className="goleador-suggestion"
                  onMouseDown={() => handleGoleadorSelect(c.name)}
                >
                  {c.name} <span className="suggestion-country">({c.country})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Group stage matches */}
      <div className="initial-matches-list">
        {matchesByGroup.map(([groupLetter, groupMatches]) => (
          <div key={groupLetter} className="matches-group-section">
            <h3 className="matches-group-header">{t('common.group')} {groupLetter}</h3>
            {groupMatches.map(([matchId, match]) => {
              const homeTeam = teams?.[match.home_team];
              const awayTeam = teams?.[match.away_team];
              const pred = preds[matchId] || {};
              return (
                <div key={matchId} className="prediction-match-row">
                  <div className="prediction-match-info">
                    <span className="prediction-match-date">{formatDateART(match.datetime)} {formatTimeART(match.datetime)}</span>
                  </div>
                  <div className="prediction-match-teams">
                    <div className="prediction-team home">
                      <TeamFlag team={homeTeam} />
                      <span className="team-name">{homeTeam?.name || match.home_team}</span>
                    </div>
                    <div className="prediction-inputs">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={pred.home_score ?? ''}
                        onChange={(e) => handleScoreChange(matchId, 'home_score', e.target.value)}
                        className="score-input"
                      />
                      <span className="score-dash">-</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={pred.away_score ?? ''}
                        onChange={(e) => handleScoreChange(matchId, 'away_score', e.target.value)}
                        className="score-input"
                      />
                    </div>
                    <div className="prediction-team away">
                      <TeamFlag team={awayTeam} />
                      <span className="team-name">{awayTeam?.name || match.away_team}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {error && <p className="form-error" style={{ marginTop: 16 }}>{error}</p>}

      {showIncompleteModal && (
        <Modal onClose={() => setShowIncompleteModal(false)} title={t('predictions.incompleteTitle') || 'Incomplete Predictions'}>
          <div className="incomplete-modal-body">
            <p>{t('predictions.incompleteMsg') || 'You must fill out ALL predictions before entering the tournament.'}</p>
            <ul className="incomplete-list">
              {filledCount < groupMatches.length && (
                <li>{t('predictions.progress', { count: filledCount, total: groupMatches.length })}</li>
              )}
              {!champion && <li>{t('predictions.champion')}: {t('predictions.missing') || 'missing'}</li>}
              {!goleador && <li>{t('predictions.goleador')}: {t('predictions.missing') || 'missing'}</li>}
            </ul>
            <button className="btn btn-primary" style={{ marginTop: 16, width: '100%' }} onClick={() => setShowIncompleteModal(false)}>
              OK
            </button>
          </div>
        </Modal>
      )}

      <div className="initial-submit-bar">
        <button
          className="btn btn-primary btn-large"
          onClick={() => {
            if (!allFilled) {
              setShowIncompleteModal(true);
            } else {
              handleSubmitAll();
            }
          }}
          disabled={saving}
        >
          {saving ? t('common.loading') : t('predictions.submitAll')}
        </button>
        {!allFilled && (
          <p className="submit-hint">
            {t('predictions.progress', { count: filledCount, total: groupMatches.length })}
            {!champion && ` | ${t('predictions.champion')}: -`}
            {!goleador && ` | ${t('predictions.goleador')}: -`}
          </p>
        )}
      </div>
    </div>
  );
}
