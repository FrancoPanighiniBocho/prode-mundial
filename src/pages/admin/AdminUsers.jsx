import { useState } from 'react';
import { set, remove } from 'firebase/database';
import { useTournamentValue } from '../../hooks/useTournamentValue';
import { useI18n } from '../../i18n/useI18n';
import { tournamentRef } from '../../config/firebase';
import { useTournament } from '../../context/TournamentContext';
import { sha256 } from '../../utils/hash';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function AdminUsers() {
  const { tournamentId, allTournaments, setTournamentId } = useTournament();
  const { value: users, loading } = useTournamentValue('users');
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pin, setPin] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  if (loading) return <LoadingSpinner />;

  const userList = users ? Object.entries(users) : [];

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!username || !pin || !displayName) return;
    setSaving(true);
    setMessage('');
    try {
      const userId = `user_${username.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const pinHash = await sha256(pin);
      await set(tournamentRef(tournamentId, `users/${userId}`), {
        username: username.toLowerCase(),
        display_name: displayName,
        pin_hash: pinHash,
        is_admin: isAdmin,
        has_completed_initial_predictions: false,
        created_at: Date.now(),
      });
      setUsername('');
      setDisplayName('');
      setPin('');
      setIsAdmin(false);
      setMessage('User added!');
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm(t('admin.confirm'))) return;
    await remove(tournamentRef(tournamentId, `users/${userId}`));
  };

  return (
    <div className="admin-users">
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
      <h3>{t('admin.addUser')}</h3>
      <form onSubmit={handleAdd} className="admin-form">
        <div className="admin-form-row">
          <input placeholder={t('admin.username')} value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input placeholder={t('admin.displayName')} value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          <input placeholder={t('admin.pin')} type="password" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={4} required />
          <label className="admin-checkbox">
            <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
            Admin
          </label>
          <button type="submit" className="btn btn-primary btn-small" disabled={saving}>
            {t('admin.save')}
          </button>
        </div>
      </form>
      {message && <p className="admin-message">{message}</p>}

      <h3 style={{ marginTop: 24 }}>{t('admin.users')} ({userList.length})</h3>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('admin.username')}</th>
              <th>{t('admin.displayName')}</th>
              <th>Admin</th>
              <th>Predictions</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {userList.map(([id, u]) => (
              <tr key={id}>
                <td>{u.username}</td>
                <td>{u.display_name}</td>
                <td>{u.is_admin ? 'Yes' : 'No'}</td>
                <td>{u.has_completed_initial_predictions ? 'Done' : 'Pending'}</td>
                <td>
                  <button className="btn btn-small btn-danger" onClick={() => handleDelete(id)}>
                    {t('admin.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
