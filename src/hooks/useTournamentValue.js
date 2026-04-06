import { useState, useEffect, useMemo } from 'react';
import { onValue } from 'firebase/database';
import { tournamentRef } from '../config/firebase';
import { useTournament } from '../context/TournamentContext';

/**
 * Like useFirebaseValue, but automatically scoped to the current tournament.
 * Path is prefixed with /prode/t/{tournamentId}/.
 */
export function useTournamentValue(path) {
  const { tournamentId } = useTournament();
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournamentId) {
      setValue(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const dbRef = tournamentRef(tournamentId, path);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      setValue(snapshot.val());
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tournamentId, path]);

  return useMemo(() => ({ value, loading }), [value, loading]);
}
