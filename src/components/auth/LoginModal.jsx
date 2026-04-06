import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n/useI18n';
import { useTournament } from '../../context/TournamentContext';
import Modal from '../ui/Modal';

export default function LoginModal({ onClose }) {
  const { loginAsParticipant } = useAuth();
  const { setTournamentId } = useTournament();
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tournamentPicker, setTournamentPicker] = useState(null); // null or array of matching tournaments

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { matchingTournaments } = await loginAsParticipant(username, pin);

      if (matchingTournaments.length === 1) {
        // Auto-select the only tournament
        setTournamentId(matchingTournaments[0].tournamentId);
        onClose();
      } else {
        // Show tournament picker
        setTournamentPicker(matchingTournaments);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTournament = (tournamentId) => {
    setTournamentId(tournamentId);
    onClose();
  };

  // Tournament picker view
  if (tournamentPicker) {
    return (
      <Modal onClose={onClose} title={t('auth.selectTournament') || 'Select Tournament'}>
        <div className="tournament-picker">
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            {t('auth.multipleTournaments') || 'You belong to multiple tournaments. Select one:'}
          </p>
          {tournamentPicker.map((tm) => (
            <button
              key={tm.tournamentId}
              className="tournament-picker-item"
              onClick={() => handleSelectTournament(tm.tournamentId)}
            >
              {tm.tournamentName}
            </button>
          ))}
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} title={t('auth.loginTitle')}>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="username">{t('auth.username')}</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="pin">{t('auth.pin')}</label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? t('auth.loggingIn') : t('auth.loginButton')}
        </button>
      </form>
    </Modal>
  );
}
