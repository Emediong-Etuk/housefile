"use client";

import { useEffect } from "react";

// A server-side redirect() needs a server to complete, and Next's
// client-side soft navigation (router.replace) fetches RSC flight data
// that a plain static host doesn't resolve the same way — a hard
// browser navigation is what actually works here.
export default function RootPage() {
  useEffect(() => {
    window.location.replace("/host");
  }, []);
  return null;
}
