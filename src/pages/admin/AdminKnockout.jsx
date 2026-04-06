import { useState } from 'react';
import { update, set } from 'firebase/database';
import { useFirebaseValue } from '../../hooks/useFirebase';
import { useI18n } from '../../i18n/useI18n';
import { prodeRef } from '../../config/firebase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const KNOCKOUT_PHASES = ['r32', 'r16', 'qf', 'sf', 'finals'];

export default function AdminKnockout() {
  const { value: config, loading: cLoad } = useFirebaseValue('config');
  const { value: matches, loading: mLoad } = useFirebaseValue('matches');
  const { t } = useI18n();
  const [saving, setSaving] = useState(null);
  const [goleadorName, setGoleadorName] = useState('');
  const [goleadorMsg, setGoleadorMsg] = useState('');

  const { value: teams, loading: tLoad } = useFirebaseValue('teams');
  const [editingMatch, setEditingMatch] = useState(null);
  const [editHome, setEditHome] = useState('');
  const [editAway, setEditAway] = useState('');

  if (cLoad || mLoad || tLoad) return <LoadingSpinner />;

  const phasesOpen = config?.knockout_phases_open || {};
  const currentGoleador = config?.actual_goleador || '';

  const handleSetGoleador = async () => {
    if (!goleadorName.trim()) return;
    setSaving('goleador');
    try {
      await update(prodeRef('config'), {
        actual_goleador: goleadorName.trim(),
        goleador_scored_at: Date.now(),
      });
      setGoleadorMsg(`Goleador set to: ${goleadorName.trim()}`);
      setGoleadorName('');
    } catch (err) {
      setGoleadorMsg(`Error: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  const togglePhase = async (phase) => {
    setSaving(phase);
    try {
      const now = Date.now();
      const newValue = !phasesOpen[phase];
      await update(prodeRef('config/knockout_phases_open'), {
        [phase]: newValue,
        [`${phase}_toggled_at`]: now,
      });
      // Update tournament phase
      if (newValue) {
        await update(prodeRef('config'), {
          tournament_phase: phase === 'finals' ? 'finals' : phase,
          tournament_phase_updated_at: now,
        });
      }
    } catch (err) {
      console.error('Error toggling phase:', err);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="admin-knockout">
      <h3>{t('admin.knockout')}</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
        Open/close prediction windows for each knockout phase. Participants can predict all matches
        in a phase once opened, and can edit until each individual match kicks off.
      </p>

      <div className="knockout-phases-list">
        {KNOCKOUT_PHASES.map((phase) => {
          const isOpen = phasesOpen[phase] || false;
          const label = phase === 'finals' ? 'Finals (3rd Place + Final)' : t(`phases.${phase}`);
          return (
            <div key={phase} className={`knockout-phase-row ${isOpen ? 'open' : 'closed'}`}>
              <span className="phase-name">{label}</span>
              <span className={`phase-status ${isOpen ? 'open' : 'closed'}`}>
                {isOpen ? 'OPEN' : 'CLOSED'}
              </span>
              <button
                className={`btn btn-small ${isOpen ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => togglePhase(phase)}
                disabled={saving === phase}
              >
                {saving === phase ? '...' : isOpen ? 'Close' : t('admin.openPhase')}
              </button>
            </div>
          );
        })}
      </div>
      {/* Knockout team overrides */}
      <div style={{ marginTop: 32 }}>
        <h3>Team Assignments</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: 13 }}>
          Override team assignments for knockout matches. Teams auto-populate when rounds finish.
        </p>
        <div className="knockout-overrides-list">
          {matches && Object.entries(matches)
            .filter(([, m]) => m.stage !== 'group')
            .sort(([, a], [, b]) => (a.match_number || 0) - (b.match_number || 0))
            .map(([matchId, match]) => (
              <div key={matchId} className="knockout-override-row">
                <span className="knockout-override-label">#{match.match_number} ({match.stage})</span>
                <span className="knockout-override-teams">
                  {teams?.[match.home_team]?.name || match.home_placeholder || 'TBD'}
                  {' vs '}
                  {teams?.[match.away_team]?.name || match.away_placeholder || 'TBD'}
                </span>
                {editingMatch === matchId ? (
                  <div className="knockout-override-edit">
                    <select value={editHome} onChange={(e) => setEditHome(e.target.value)} className="advancing-select">
                      <option value="">Home...</option>
                      {teams && Object.entries(teams).sort(([,a],[,b]) => a.name.localeCompare(b.name)).map(([code, team]) => (
                        <option key={code} value={code}>{team.name}</option>
                      ))}
                    </select>
                    <select value={editAway} onChange={(e) => setEditAway(e.target.value)} className="advancing-select">
                      <option value="">Away...</option>
                      {teams && Object.entries(teams).sort(([,a],[,b]) => a.name.localeCompare(b.name)).map(([code, team]) => (
                        <option key={code} value={code}>{team.name}</option>
                      ))}
                    </select>
                    <button className="btn btn-small btn-primary" onClick={async () => {
                      const updates = {};
                      if (editHome) updates.home_team = editHome;
                      if (editAway) updates.away_team = editAway;
                      if (Object.keys(updates).length > 0) {
                        await update(prodeRef(`matches/${matchId}`), updates);
                      }
                      setEditingMatch(null);
                    }}>Save</button>
                    <button className="btn btn-small btn-secondary" onClick={() => setEditingMatch(null)}>Cancel</button>
                  </div>
                ) : (
                  <button className="btn btn-small btn-secondary" onClick={() => {
                    setEditingMatch(matchId);
                    setEditHome(match.home_team || '');
                    setEditAway(match.away_team || '');
                  }}>Edit</button>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Goleador input */}
      <div className="admin-goleador-section" style={{ marginTop: 32 }}>
        <h3>Top Scorer (Goleador)</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: 13 }}>
          Set the actual tournament top scorer at the end. Users who predicted correctly get 5 points.
          {currentGoleador && <><br />Current: <strong style={{ color: 'var(--sol)' }}>{currentGoleador}</strong></>}
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={goleadorName}
            onChange={(e) => setGoleadorName(e.target.value)}
            placeholder="Player name (e.g., Kylian Mbappé)"
            style={{ flex: 1, minWidth: 200, background: 'var(--bg-tertiary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius)', padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}
          />
          <button className="btn btn-primary btn-small" onClick={handleSetGoleador} disabled={saving === 'goleador'}>
            {saving === 'goleador' ? '...' : 'Set Goleador'}
          </button>
        </div>
        {goleadorMsg && <p className="admin-message" style={{ marginTop: 8 }}>{goleadorMsg}</p>}
      </div>
    </div>
  );
}
