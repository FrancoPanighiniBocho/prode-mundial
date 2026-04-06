import { createContext, useState, useEffect, useCallback } from 'react';
import { get } from 'firebase/database';
import { prodeRef, tournamentRef } from '../config/firebase';
import { sha256 } from '../utils/hash';

export const AuthContext = createContext(null);

const SESSION_KEY = 'prode_auth';

function loadSession() {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { role: 'spectator', user: null, isAdmin: false };
}

function saveSession(state) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadSession);

  useEffect(() => {
    saveSession(auth);
  }, [auth]);

  /**
   * Login as participant: scan ALL tournaments for matching credentials.
   * Returns { auth, matchingTournaments: [{ tournamentId, tournamentName, userId, user }] }
   */
  const loginAsParticipant = useCallback(async (username, pin) => {
    const pinHash = await sha256(pin);

    // Fetch all tournament IDs
    const tournamentsSnap = await get(prodeRef('tournaments'));
    const tournaments = tournamentsSnap.val();
    if (!tournaments) throw new Error('No tournaments found');

    const matchingTournaments = [];

    // Scan each tournament's users
    for (const [tId, tMeta] of Object.entries(tournaments)) {
      const usersSnap = await get(tournamentRef(tId, 'users'));
      const users = usersSnap.val();
      if (!users) continue;

      const match = Object.entries(users).find(
        ([, u]) => u.username?.toLowerCase() === username.toLowerCase() && u.pin_hash === pinHash
      );

      if (match) {
        const [userId, user] = match;
        matchingTournaments.push({
          tournamentId: tId,
          tournamentName: tMeta.name || tId,
          userId,
          user: { userId, ...user },
        });
      }
    }

    if (matchingTournaments.length === 0) {
      throw new Error('Invalid username or PIN');
    }

    // Set auth with the first match (caller will handle tournament selection if multiple)
    const first = matchingTournaments[0];
    const newAuth = {
      role: 'participant',
      user: first.user,
      isAdmin: first.user.is_admin || false,
    };
    setAuth(newAuth);

    return { auth: newAuth, matchingTournaments };
  }, []);

  const loginAsAdmin = useCallback(async (password) => {
    const passwordHash = await sha256(password);
    const snap = await get(prodeRef('config/admin_password_hash'));
    const storedHash = snap.val();

    if (!storedHash || passwordHash !== storedHash) {
      throw new Error('Invalid admin password');
    }

    setAuth((prev) => ({
      ...prev,
      isAdmin: true,
      role: prev.role === 'participant' ? 'participant' : 'admin',
    }));
  }, []);

  const logout = useCallback(() => {
    setAuth({ role: 'spectator', user: null, isAdmin: false });
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, loginAsParticipant, loginAsAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
