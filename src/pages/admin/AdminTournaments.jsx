import { useState } from 'react';
import { set, remove } from 'firebase/database';
import { useFirebaseValue } from '../../hooks/useFirebase';
import { useI18n } from '../../i18n/useI18n';
import { prodeRef } from '../../config/firebase';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function AdminTournaments() {
  const { value: tournaments, loading } = useFirebaseValue('tournaments');
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  if (loading) return <LoadingSpinner />;

  const tournamentList = tournaments ? Object.entries(tournaments) : [];

  const slugify = (str) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name) return;
    setSaving(true);
    setMessage('');
    try {
      const id = slugify(name);
      if (!id) return;
      await set(prodeRef(`tournaments/${id}`), {
        name,
        created_at: Date.now(),
      });
      setName('');
      setMessage('Tournament created!');
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tournamentId) => {
    if (!confirm(t('admin.confirm'))) return;
    await remove(prodeRef(`tournaments/${tournamentId}`));
  };

  return (
    <div className="admin-tournaments">
      <h3>{t('admin.createTournament')}</h3>
      <form onSubmit={handleCreate} className="admin-form">
        <div className="admin-form-row">
          <input
            placeholder={t('admin.tournamentName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary btn-small" disabled={saving}>
            {t('admin.createTournament')}
          </button>
        </div>
      </form>
      {message && <p className="admin-message">{message}</p>}

      <h3 style={{ marginTop: 24 }}>{t('admin.tournaments')} ({tournamentList.length})</h3>
      {tournamentList.length === 0 ? (
        <p>{t('admin.noTournaments')}</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t('admin.tournamentName')}</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tournamentList.map(([id, tournament]) => (
                <tr key={id}>
                  <td>{id}</td>
                  <td>{tournament.name}</td>
                  <td>{tournament.created_at ? new Date(tournament.created_at).toLocaleDateString() : '—'}</td>
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
      )}
    </div>
  );
}
