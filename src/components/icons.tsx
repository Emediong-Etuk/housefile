// Large decorative line-art house, meant to sit behind hero content at low
// opacity with its stroke "drawing in" on mount (see .house-outline in
// globals.css) — part of the house-themed ambient motion.
export function HouseOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" fill="none" className={className} aria-hidden="true">
      <path
        className="house-outline"
        d="M40 160 200 40 360 160 M70 140v130a6 6 0 0 0 6 6h90v-90a34 34 0 0 1 68 0v90h90a6 6 0 0 0 6-6V140 M175 276v-70h50v70"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HouseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3.5 10.5 12 3.5l8.5 7M5.5 9v10a1 1 0 0 0 1 1H10v-5a2 2 0 0 1 2-2v0a2 2 0 0 1 2 2v5h3.5a1 1 0 0 0 1-1V9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
