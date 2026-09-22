"use client";

import { useState } from "react";

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied by the browser — nothing useful to
      // recover into, the link/address is still visible to copy by hand.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={
        className ??
        "rounded-md border border-sand px-2 py-1 text-xs font-medium text-taupe transition hover:border-clay hover:text-clay"
      }
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}
