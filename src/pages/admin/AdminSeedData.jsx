import { useState } from 'react';
import { set } from 'firebase/database';
import { prodeRef } from '../../config/firebase';
import { useI18n } from '../../i18n/useI18n';
import { sha256 } from '../../utils/hash';
import { TEAMS } from '../../data/teams';
import { GROUP_STAGE_MATCHES } from '../../data/groupStageMatches';
import { KNOCKOUT_MATCHES } from '../../data/knockoutStructure';

export default function AdminSeedData() {
  const { t } = useI18n();
  const [status, setStatus] = useState('');
  const [seeding, setSeeding] = useState(false);

  const seedConfig = async () => {
    setSeeding(true);
    setStatus('Seeding config...');
    try {
      const adminHash = await sha256('admin123');
      await set(prodeRef('config'), {
        admin_password_hash: adminHash,
        tournament_phase: 'pre_tournament',
        knockout_phases_open: {
          r32: false,
          r16: false,
          qf: false,
          sf: false,
          finals: false,
        },
      });
      setStatus('Config seeded!');
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const seedTeamsAndMatches = async () => {
    setSeeding(true);
    setStatus('Seeding teams...');
    try {
      // Seed teams
      const teamsData = {};
      for (const team of TEAMS) {
        teamsData[team.code] = {
          name: team.name,
          name_es: team.name_es,
          group: team.group,
          iso: team.iso,
        };
      }
      await set(prodeRef('teams'), teamsData);

      // Seed matches
      setStatus('Seeding matches...');
      const matchesData = {};
      for (const match of GROUP_STAGE_MATCHES) {
        matchesData[match.id] = {
          match_number: match.match_number,
          stage: 'group',
          group: match.group,
          home_team: match.home_team,
          away_team: match.away_team,
          datetime: match.datetime,
          venue: match.venue,
          city: match.city,
          status: 'upcoming',
        };
      }
      for (const match of KNOCKOUT_MATCHES) {
        matchesData[match.id] = {
          match_number: match.match_number,
          stage: match.stage,
          home_team: match.home_team || null,
          away_team: match.away_team || null,
          home_placeholder: match.home_placeholder,
          away_placeholder: match.away_placeholder,
          datetime: match.datetime,
          venue: match.venue,
          city: match.city,
          status: 'upcoming',
        };
      }
      await set(prodeRef('matches'), matchesData);

      setStatus(t('admin.seeded'));
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="admin-seed">
      <h3>{t('admin.seed')}</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
        Use these buttons to seed initial data into Firebase. Only do this once!
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={seedConfig} disabled={seeding}>
          {t('admin.seedConfig')}
        </button>
        <button className="btn btn-primary" onClick={seedTeamsAndMatches} disabled={seeding}>
          {t('admin.seedTeams')}
        </button>
      </div>
      {status && <p className="admin-message" style={{ marginTop: 12 }}>{status}</p>}
    </div>
  );
}
