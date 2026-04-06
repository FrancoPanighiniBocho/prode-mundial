import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { onValue } from 'firebase/database';
import { prodeRef } from '../config/firebase';

export const TournamentContext = createContext(null);

const TOURNAMENT_SESSION_KEY = 'prode_tournament';

function loadTournamentSession() {
  try {
    const stored = sessionStorage.getItem(TOURNAMENT_SESSION_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { tournamentId: null, tournamentName: null };
}

function saveTournamentSession(state) {
  sessionStorage.setItem(TOURNAMENT_SESSION_KEY, JSON.stringify(state));
}

export function TournamentProvider({ children }) {
  const [tournamentId, setTournamentIdState] = useState(() => loadTournamentSession().tournamentId);
  const [tournamentName, setTournamentName] = useState(() => loadTournamentSession().tournamentName);
  const [allTournaments, setAllTournaments] = useState(null);

  // Listen to all tournaments metadata
  useEffect(() => {
    const unsubscribe = onValue(prodeRef('tournaments'), (snap) => {
      setAllTournaments(snap.val());
    });
    return () => unsubscribe();
  }, []);

  const setTournamentId = useCallback((id) => {
    const name = allTournaments?.[id]?.name || null;
    setTournamentIdState(id);
    setTournamentName(name);
    saveTournamentSession({ tournamentId: id, tournamentName: name });
  }, [allTournaments]);

  const clearTournament = useCallback(() => {
    setTournamentIdState(null);
    setTournamentName(null);
    sessionStorage.removeItem(TOURNAMENT_SESSION_KEY);
  }, []);

  return (
    <TournamentContext.Provider value={{
      tournamentId,
      tournamentName,
      setTournamentId,
      clearTournament,
      allTournaments,
    }}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  return useContext(TournamentContext);
}
