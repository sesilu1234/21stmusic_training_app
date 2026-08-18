export default function Crown({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 52" className={className} role="img" aria-label="Corona">
      <defs>
        <linearGradient id="crown-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="45%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="crown-band" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>

      <path
        d="M8 40 L4 12 L20 24 L32 6 L44 24 L60 12 L56 40 Z"
        fill="url(#crown-gold)"
        stroke="#78350f"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect x="7" y="40" width="50" height="8" rx="3" fill="url(#crown-band)" stroke="#78350f" strokeWidth="1.5" />

      <circle cx="4" cy="11" r="3.6" fill="#fde68a" stroke="#78350f" strokeWidth="1.2" />
      <circle cx="32" cy="5" r="4" fill="#fde68a" stroke="#78350f" strokeWidth="1.2" />
      <circle cx="60" cy="11" r="3.6" fill="#fde68a" stroke="#78350f" strokeWidth="1.2" />

      <circle cx="20" cy="44" r="2.4" fill="#f87171" stroke="#78350f" strokeWidth="1" />
      <circle cx="32" cy="44" r="2.4" fill="#60a5fa" stroke="#78350f" strokeWidth="1" />
      <circle cx="44" cy="44" r="2.4" fill="#34d399" stroke="#78350f" strokeWidth="1" />

      <path d="M12 20 L14 33" stroke="#fffbeb" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}
