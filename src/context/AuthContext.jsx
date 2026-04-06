import { createContext, useState, useEffect, useCallback } from 'react';
import { get, onValue } from 'firebase/database';
import { prodeRef } from '../config/firebase';
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
  const [users, setUsers] = useState(null);

  useEffect(() => {
    const unsubscribe = onValue(prodeRef('users'), (snap) => {
      setUsers(snap.val());
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    saveSession(auth);
  }, [auth]);

  const loginAsParticipant = useCallback(async (username, pin) => {
    if (!users) throw new Error('Users data not loaded yet');

    const pinHash = await sha256(pin);
    const entries = Object.entries(users);
    const match = entries.find(
      ([, u]) => u.username?.toLowerCase() === username.toLowerCase() && u.pin_hash === pinHash
    );

    if (!match) throw new Error('Invalid username or PIN');

    const [userId, user] = match;
    const newAuth = {
      role: 'participant',
      user: { userId, ...user },
      isAdmin: user.is_admin || false,
    };
    setAuth(newAuth);
    return newAuth;
  }, [users]);

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
    <AuthContext.Provider value={{ ...auth, users, loginAsParticipant, loginAsAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
