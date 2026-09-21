"use client";

import { useEffect } from "react";

// A server-side redirect() needs a server to complete, and Next's
// client-side soft navigation (router.replace) fetches RSC flight data
// that a plain static host doesn't resolve the same way — a hard
// browser navigation is what actually works here. The static-hosting
// component only exact-matches request paths or falls back to
// /index.html, so clean-URL routes must be linked by their real
// .html filename — "/host" always resolves to this same page.
export default function RootPage() {
  useEffect(() => {
    window.location.replace("/host.html");
  }, []);
  return null;
}
