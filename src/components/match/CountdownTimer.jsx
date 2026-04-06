import { useState, useEffect } from 'react';

export default function CountdownTimer({ datetime }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const diff = datetime - now;
  if (diff <= 0 || diff > 24 * 60 * 60 * 1000) return null;

  const hours = Math.floor(diff / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);

  return (
    <span className="countdown-inline">
      locks in {hours}h {mins}m
    </span>
  );
}
