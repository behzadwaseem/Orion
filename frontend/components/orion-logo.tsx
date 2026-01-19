export function OrionLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Constellation lines */}
      <path
        d="M10 8 L20 14 L30 8 M20 14 L20 26 M12 32 L20 26 L28 32"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.4"
        strokeLinecap="round"
      />

      {/* Stars - Orion belt and body shape */}
      {/* Head */}
      <circle cx="20" cy="6" r="2" fill="currentColor" fillOpacity="0.9" />

      {/* Shoulders */}
      <circle cx="10" cy="8" r="1.5" fill="currentColor" fillOpacity="0.7" />
      <circle cx="30" cy="8" r="1.5" fill="currentColor" fillOpacity="0.7" />

      {/* Belt - 3 stars */}
      <circle cx="16" cy="20" r="2.5" fill="currentColor" />
      <circle cx="20" cy="20" r="2.5" fill="currentColor" />
      <circle cx="24" cy="20" r="2.5" fill="currentColor" />

      {/* Legs */}
      <circle cx="12" cy="32" r="1.5" fill="currentColor" fillOpacity="0.7" />
      <circle cx="28" cy="32" r="1.5" fill="currentColor" fillOpacity="0.7" />

      {/* Glow on belt */}
      <circle cx="20" cy="20" r="6" fill="currentColor" fillOpacity="0.1" />
    </svg>
  )
}
