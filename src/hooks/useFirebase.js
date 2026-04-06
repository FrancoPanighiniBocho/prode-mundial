import { useState, useEffect, useMemo } from 'react';
import { onValue } from 'firebase/database';
import { prodeRef } from '../config/firebase';

export function useFirebaseValue(path) {
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dbRef = prodeRef(path);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      setValue(snapshot.val());
      setLoading(false);
    });
    return () => unsubscribe();
  }, [path]);

  return useMemo(() => ({ value, loading }), [value, loading]);
}
