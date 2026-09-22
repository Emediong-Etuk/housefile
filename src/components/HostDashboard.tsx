"use client";

import { useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { getOrCreateHostId } from "@/lib/hostId";
import { HouseIcon, HouseOutline } from "@/components/icons";

export function HostDashboard() {
  const [hostId, setHostId] = useState<string | null>(null);
  useEffect(() => setHostId(getOrCreateHostId()), []);

  const listings = useQuery(api.listings.listByHost, hostId ? { hostId } : "skip");
  const importListing = useAction(api.importListing.run);

  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!hostId || !url) return;
    setImporting(true);
    setError(null);
    try {
      await importListing({ hostId, sourceUrl: url });
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-3xl px-6 py-14 sm:py-20">
        <header className="animate-fade-up relative text-center">
          <HouseOutline className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 text-clay/[0.08] sm:h-80 sm:w-80" />
          <div className="mx-auto flex h-14 w-14 animate-float items-center justify-center rounded-2xl bg-clay text-paper shadow-soft">
            <HouseIcon className="h-7 w-7" />
          </div>
          <h1 className="mt-5 font-serif text-4xl font-medium tracking-tight text-ink sm:text-5xl">
            Housefile
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-taupe">
            Answers your guests&apos; questions automatically — grounded in facts you set, never a guess.
          </p>
          <a
            href="/how-it-works.html"
            className="link-underline mt-3 inline-block text-sm font-medium text-clay-dark transition hover:text-clay"
          >
            See how it works →
          </a>
        </header>

        <form
          onSubmit={handleImport}
          className="animate-fade-up mt-10 flex flex-col gap-3 rounded-2xl border border-sand bg-paper p-3 shadow-soft transition-shadow duration-300 focus-within:shadow-lift sm:flex-row"
          style={{ animationDelay: "80ms" }}
        >
          <input
            type="url"
            required
            placeholder="Paste your Airbnb or Vrbo listing URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 rounded-xl border border-transparent bg-cream/60 px-4 py-3 text-sm text-ink placeholder:text-taupe-light focus:border-clay focus:bg-paper focus:outline-none focus:ring-4 focus:ring-clay-light transition"
          />
          <button
            type="submit"
            disabled={importing || !hostId}
            className="shrink-0 rounded-xl bg-clay px-5 py-3 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-clay-dark hover:shadow-lift active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:animate-none enabled:animate-pulse-glow"
          >
            {importing ? "Importing…" : "Import listing"}
          </button>
        </form>
        {error && (
          <p className="animate-fade-in mt-2 text-sm text-clay-dark" role="alert">
            {error}
          </p>
        )}

        <div className="mt-12">
          {listings === undefined && (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="skeleton h-24 w-full" />
              ))}
            </div>
          )}

          {listings?.length === 0 && (
            <div className="animate-fade-up rounded-2xl border border-dashed border-sand-dark py-14 text-center">
              <p className="text-sm text-taupe">
                No properties yet — paste a listing URL above to start.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {listings?.map((listing, i) => (
              <a
                key={listing._id}
                href={`/host/listing.html?id=${listing._id}`}
                className="group animate-scale-in overflow-hidden rounded-2xl border border-sand bg-paper shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="relative h-32 w-full overflow-hidden bg-sand">
                  {listing.coverPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={listing.coverPhotoUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-taupe-light">
                      <HouseIcon className="h-8 w-8" />
                    </div>
                  )}
                  <span
                    className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur-sm ${
                      listing.readinessReady ? "bg-sage-bg/90 text-sage" : "bg-honey-bg/90 text-honey"
                    }`}
                  >
                    {listing.readinessReady ? "Guest ready" : "Needs setup"}
                  </span>
                </div>
                <div className="p-4">
                  <span className="font-serif text-lg font-medium text-ink">{listing.name}</span>
                  {listing.locationText && (
                    <p className="mt-1 truncate text-sm text-taupe">{listing.locationText}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
