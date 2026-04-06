const crypto = require('crypto');

const FIREBASE_URL = 'https://dog-calendar-96cd5-default-rtdb.firebaseio.com';

async function sha256(message) {
  return crypto.createHash('sha256').update(message).digest('hex');
}

async function seed() {
  console.log('Seeding config...');
  const adminHash = await sha256('admin123');

  const config = {
    admin_password_hash: adminHash,
    tournament_phase: 'pre_tournament',
    knockout_phases_open: {
      r32: false,
      r16: false,
      qf: false,
      sf: false,
      finals: false,
    },
  };

  const res = await fetch(`${FIREBASE_URL}/prode/config.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!res.ok) throw new Error(`Config seed failed: ${res.status}`);
  console.log('Config seeded!');
  console.log('Admin password hash:', adminHash);
}

seed().catch(console.error);
