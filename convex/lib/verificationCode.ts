// A deterministic, unguessable-enough code per (host, listing URL) pair —
// no storage needed, since the same inputs always regenerate the same
// code. The host pastes it into their own Airbnb/Vrbo listing description;
// import only proceeds once Firecrawl's scrape of that exact page actually
// contains it, which only someone with edit access to the real listing can
// arrange. Exposed to the frontend via listings.getVerificationCode so it
// can show the code before the host ever calls import — both read this
// same function, so there's nothing to keep in sync.
function hashCode(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36).toUpperCase();
}

export function verificationCodeFor(hostId: string, sourceUrl: string): string {
  return `HOUSEFILE-${hashCode(`${hostId}|${sourceUrl.trim().toLowerCase()}`)}`;
}
