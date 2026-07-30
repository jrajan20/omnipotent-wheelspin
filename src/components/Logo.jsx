/**
 * "Wheel on fire" brand logo. A segmented prize wheel wrapped in a ring of
 * flames. Renders as an inline SVG so it scales crisply at any size and adapts
 * to the surrounding layout via the `size` prop.
 */
export function Logo({ size = 32, title = 'Omnipotent Wheelspin', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>{title}</title>
      <defs>
        <radialGradient id="wof-fire-outer" cx="50%" cy="52%" r="52%">
          <stop offset="30%" stopColor="#ff922b" />
          <stop offset="70%" stopColor="#f03e3e" />
          <stop offset="100%" stopColor="#c92a2a" />
        </radialGradient>
        <radialGradient id="wof-fire-inner" cx="50%" cy="54%" r="50%">
          <stop offset="35%" stopColor="#ffe066" />
          <stop offset="100%" stopColor="#ff922b" />
        </radialGradient>
        <linearGradient id="wof-seg-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f3e8ff" />
          <stop offset="100%" stopColor="#e5dbff" />
        </linearGradient>
        <linearGradient id="wof-seg-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#be4bdb" />
          <stop offset="100%" stopColor="#7048e8" />
        </linearGradient>
      </defs>

      {/* Outer flame ring */}
      <path
        fill="url(#wof-fire-outer)"
        d="M51.32 26.82 Q62 32 51.32 37.18 Q57.98 47 46.14 46.14 Q47 57.98 37.18 51.32 Q32 62 26.82 51.32 Q17 57.98 17.86 46.14 Q6.02 47 12.68 37.18 Q2 32 12.68 26.82 Q6.02 17 17.86 17.86 Q17 6.02 26.82 12.68 Q32 2 37.18 12.68 Q47 6.02 46.14 17.86 Q57.98 17 51.32 26.82 Z"
      />

      {/* Inner brighter flame ring for depth */}
      <path
        fill="url(#wof-fire-inner)"
        d="M48.42 27.6 Q57 32 48.42 36.4 Q53.65 44.5 44.02 44.02 Q44.5 53.65 36.4 48.42 Q32 57 27.6 48.42 Q19.5 53.65 19.98 44.02 Q10.35 44.5 15.58 36.4 Q7 32 15.58 27.6 Q10.35 19.5 19.98 19.98 Q19.5 10.35 27.6 15.58 Q32 7 36.4 15.58 Q44.5 10.35 44.02 19.98 Q53.65 19.5 48.42 27.6 Z"
      />

      {/* Wheel segments (8 alternating slices) */}
      <g>
        <path fill="url(#wof-seg-a)" d="M32 32 L32 15 A17 17 0 0 1 44.02 19.98 Z" />
        <path fill="url(#wof-seg-b)" d="M32 32 L44.02 19.98 A17 17 0 0 1 49 32 Z" />
        <path fill="url(#wof-seg-a)" d="M32 32 L49 32 A17 17 0 0 1 44.02 44.02 Z" />
        <path fill="url(#wof-seg-b)" d="M32 32 L44.02 44.02 A17 17 0 0 1 32 49 Z" />
        <path fill="url(#wof-seg-a)" d="M32 32 L32 49 A17 17 0 0 1 19.98 44.02 Z" />
        <path fill="url(#wof-seg-b)" d="M32 32 L19.98 44.02 A17 17 0 0 1 15 32 Z" />
        <path fill="url(#wof-seg-a)" d="M32 32 L15 32 A17 17 0 0 1 19.98 19.98 Z" />
        <path fill="url(#wof-seg-b)" d="M32 32 L19.98 19.98 A17 17 0 0 1 32 15 Z" />
      </g>

      {/* Wheel rim + hub */}
      <circle cx="32" cy="32" r="17" fill="none" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="4.2" fill="#ffffff" />
      <circle cx="32" cy="32" r="1.8" fill="#7048e8" />
    </svg>
  );
}
