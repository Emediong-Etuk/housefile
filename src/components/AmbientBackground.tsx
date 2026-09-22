// A fixed, decorative backdrop shared by every page: soft drifting warm
// blobs plus a paper-grain texture, standing in for a literal background
// video. Kept as pure CSS/SVG so a static export needs no hosted asset and
// stays cheap to render.
export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="grain-backdrop absolute inset-0" />
      <div
        className="ambient-blob ambient-blob-a -left-24 -top-24 h-[28rem] w-[28rem] bg-clay/40"
      />
      <div
        className="ambient-blob ambient-blob-b right-[-10rem] top-1/4 h-[24rem] w-[24rem] bg-amber/35"
      />
      <div
        className="ambient-blob ambient-blob-c bottom-[-8rem] left-1/3 h-[26rem] w-[26rem] bg-sage/20"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream" />
    </div>
  );
}
