/**
 * Renders a flag image from flagcdn.com.
 * Accepts either an iso code directly or a team object with an iso field.
 * size: 'sm' (20x15), 'md' (32x24), 'lg' (48x36)
 */
const SIZES = {
  sm: { w: 20, h: 15 },
  md: { w: 32, h: 24 },
  lg: { w: 48, h: 36 },
};

export default function TeamFlag({ iso, team, size = 'sm', className = '' }) {
  const code = iso || team?.iso;
  if (!code) return null;

  const { w, h } = SIZES[size] || SIZES.sm;

  return (
    <img
      src={`https://flagcdn.com/${w}x${h}/${code}.png`}
      srcSet={`https://flagcdn.com/${w * 2}x${h * 2}/${code}.png 2x`}
      width={w}
      height={h}
      alt={code}
      className={`team-flag-img ${className}`}
      loading="lazy"
    />
  );
}
