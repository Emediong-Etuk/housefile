"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { HouseIcon } from "@/components/icons";

const KNOWN_KEYS = ["wifiName", "wifiPassword", "accessMethod", "parkingInstructions", "quirk"];

export default function StayPage() {
  return (
    <Suspense fallback={<Shell><LoadingSkeleton /></Shell>}>
      <StayPageInner />
    </Suspense>
  );
}

function StayPageInner() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  if (!slug) return <Shell>Missing stay link.</Shell>;

  const stay = useQuery(api.stays.getBySlug, { slug });
  const listing = useQuery(api.listings.get, stay ? { listingId: stay.listingId } : "skip");
  const faqs = useQuery(api.faqs.listByListing, stay ? { listingId: stay.listingId } : "skip");
  const inbox = useQuery(
    api.agentmailInboxes.getAddressByListing,
    stay ? { listingId: stay.listingId } : "skip",
  );

  if (stay === undefined || listing === undefined) {
    return <Shell><LoadingSkeleton /></Shell>;
  }
  if (stay === null || listing === null) {
    return <Shell>We couldn&apos;t find this stay page.</Shell>;
  }

  const facts = (listing.privateFacts ?? {}) as Record<string, string>;
  const wifiName = facts.wifiName;
  const wifiPassword = stay.overrides.wifi || facts.wifiPassword;
  const accessMethod = facts.accessMethod;
  const accessCode = stay.overrides.accessCode;
  const parking = stay.overrides.parking || facts.parkingInstructions;
  const quirk = facts.quirk;
  const extraFacts = Object.entries(facts).filter(([key]) => !KNOWN_KEYS.includes(key));

  return (
    <Shell>
      <button
        type="button"
        onClick={() => window.history.back()}
        className="link-underline animate-fade-up inline-flex items-center gap-1 text-sm text-taupe transition hover:text-ink"
      >
        ← Back
      </button>

      <div className="animate-fade-up mt-6 text-center" style={{ animationDelay: "40ms" }}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-clay text-paper shadow-soft">
          <HouseIcon className="h-6 w-6" />
        </div>
        <p className="mt-4 text-sm text-taupe">Welcome,</p>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-ink">{stay.guestFirstName}</h1>
        <p className="mt-2 text-sm text-taupe">
          {listing.name} · {new Date(stay.checkIn).toLocaleDateString()} –{" "}
          {new Date(stay.checkOut).toLocaleDateString()}
        </p>
      </div>

      <div className="mt-10 space-y-4">
        <Section title="Getting in" icon={<KeyIcon />} delay={60}>
          {accessMethod && <p>{accessMethod}</p>}
          {accessCode && (
            <p className="mt-1">
              Door code:{" "}
              <span className="rounded-md bg-clay-light px-2 py-0.5 font-mono font-semibold text-clay-dark">
                {accessCode}
              </span>
            </p>
          )}
          {!accessMethod && !accessCode && <Unknown />}
        </Section>

        <Section title="Wi-Fi" icon={<WifiIcon />} delay={110}>
          {wifiName || wifiPassword ? (
            <>
              {wifiName && <p>Network: {wifiName}</p>}
              {wifiPassword && (
                <p className={wifiName ? "mt-1" : undefined}>
                  Password: <span className="font-mono">{wifiPassword}</span>
                </p>
              )}
            </>
          ) : (
            <Unknown />
          )}
        </Section>

        <Section title="Parking" icon={<CarIcon />} delay={160}>
          {parking ? <p>{parking}</p> : <Unknown />}
        </Section>

        <Section title="The house" icon={<SparkleIcon />} delay={210}>
          {!quirk && extraFacts.length === 0 && (faqs?.length ?? 0) === 0 && <Unknown />}
          {quirk && <p>{quirk}</p>}
          {extraFacts.map(([key, value]) => (
            <p key={key} className="mt-1">
              {String(value)}
            </p>
          ))}
          {faqs?.map((faq) => (
            <p key={faq._id} className="mt-2">
              <span className="font-medium text-ink">{faq.q}</span> — {faq.a}
            </p>
          ))}
        </Section>

        <Section title="Need something else?" icon={<MessageIcon />} delay={260}>
          {inbox ? (
            <p className="text-taupe">
              Email{" "}
              <a href={`mailto:${inbox.address}`} className="font-mono text-clay-dark underline">
                {inbox.address}
              </a>{" "}
              — your host gets a drafted answer instantly.
            </p>
          ) : (
            <p className="text-taupe">Message your host on Airbnb.</p>
          )}
        </Section>
      </div>
    </Shell>
  );
}

function Unknown() {
  return <p className="text-taupe-light">Not set yet — message your host.</p>;
}

function Section({
  title,
  icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <section
      className="animate-fade-up rounded-2xl border border-sand bg-paper p-5 shadow-soft transition-shadow duration-300 hover:shadow-lift"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 text-clay">
        {icon}
        <h2 className="text-xs font-semibold uppercase tracking-wider text-taupe">{title}</h2>
      </div>
      <div className="mt-2.5 text-base leading-relaxed text-ink">{children}</div>
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3">
        <div className="skeleton h-12 w-12 rounded-2xl" />
        <div className="skeleton h-7 w-40" />
        <div className="skeleton h-4 w-56" />
      </div>
      <div className="mt-6 space-y-4">
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-20 w-full" />
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-md px-6 py-14 text-ink">{children}</div>
    </div>
  );
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M14.5 9.5a3 3 0 1 0-3 3l-6 6V21h2.5v-1.5H10V18h1.5v-1.5L13 15l1.5 1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M5 9a11 11 0 0 1 14 0M7.8 12a7 7 0 0 1 8.4 0M10.6 15a3 3 0 0 1 2.8 0M12 18.5h.01"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M4 16V11l2-4.5h12L20 11v5M4 16h16M4 16v2.5h2.5V16M17.5 16v2.5H20V16M6.5 13h11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M4 5.5h16v10H9l-3.5 3v-3H4v-10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
