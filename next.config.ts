import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static hosting (convex.site) serves pre-built files with no Node
  // server, so the app is a static export. Dynamic path segments
  // ([listingId], [slug]) can't be resolved at request time under a
  // static export — those routes use query params instead.
  output: "export",
};

export default nextConfig;
