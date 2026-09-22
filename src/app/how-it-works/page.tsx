import type { Metadata } from "next";
import { HouseIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "How Housefile works",
  description:
    "How Housefile turns a listing URL into a grounded, self-improving assistant that answers guest questions for you.",
};

const STEPS = [
  {
    title: "Import your listing",
    body:
      "Paste your Airbnb or Vrbo URL. Firecrawl scrapes the public page and an LLM turns it into a structured starting point — name, location, amenities, house rules — automatically.",
  },
  {
    title: "Fill in what only you know",
    body:
      "The listing page can't know your Wi-Fi password, door code, parking spot, or the one quirk every guest asks about. You fill in those private facts once, and Housefile is guest-ready.",
  },
  {
    title: "Guests ask, Housefile answers",
    body:
      "Give guests a dedicated email inbox, or paste in questions yourself. Either way, every question is checked against the facts you've actually provided — nothing else.",
  },
  {
    title: "Grounded or flagged — never guessed",
    body:
      "If the answer exists in your facts, the guest gets it with the exact fact it was built from cited. If it doesn't exist, Housefile refuses to guess and flags the question for you instead.",
  },
  {
    title: "Teach it once, it remembers forever",
    body:
      "Answer a flagged question in your own words and Housefile turns it into a new permanent fact. The next guest who asks the same thing gets an instant, correct answer — no one flags it twice.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-2xl px-6 py-14 sm:py-20">
        <a
          href="/host.html"
          className="link-underline animate-fade-up inline-flex items-center gap-1 text-sm text-taupe transition hover:text-ink"
        >
          ← Back to your properties
        </a>

        <header className="animate-fade-up mt-6" style={{ animationDelay: "40ms" }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clay text-paper shadow-soft">
            <HouseIcon className="h-6 w-6" />
          </div>
          <h1 className="mt-5 font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl">
            How Housefile works
          </h1>
          <p className="mt-3 max-w-lg text-base text-taupe">
            Housefile is a property-knowledge layer for short-term-rental hosts. It turns a listing
            into an always-on assistant that answers guest questions from facts you control — and
            says so honestly whenever it doesn&apos;t know something, instead of making it up.
          </p>
        </header>

        <ol className="mt-12 space-y-0">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="animate-fade-up relative flex gap-5 pb-10 last:pb-0"
              style={{ animationDelay: `${100 + i * 90}ms` }}
            >
              {i < STEPS.length - 1 && (
                <span className="absolute left-[19px] top-10 h-[calc(100%-2rem)] w-px bg-sand-dark" />
              )}
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper font-serif text-base font-medium text-clay shadow-soft ring-1 ring-sand">
                {i + 1}
              </span>
              <div className="pt-1.5">
                <h2 className="font-serif text-xl font-medium text-ink">{step.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-taupe">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <section
          className="animate-fade-up mt-4 rounded-2xl border border-sand bg-paper p-6 shadow-soft"
          style={{ animationDelay: `${100 + STEPS.length * 90 + 60}ms` }}
        >
          <h2 className="font-serif text-xl font-medium text-ink">Why grounding matters</h2>
          <p className="mt-2 text-sm leading-relaxed text-taupe">
            Most AI assistants answer confidently even when they&apos;re wrong — for a rental host,
            a wrong door code or a made-up refund policy is a real problem, not a typo. Housefile's
            rule is simple: <span className="font-medium text-ink">no source, no sendable answer.</span>{" "}
            Every reply must trace back to a fact you provided, by name. If it can&apos;t, the
            question waits for you instead of guessing — and your answer becomes the source for
            every future guest who asks the same thing.
          </p>
        </section>

        <div className="animate-fade-up mt-10 text-center" style={{ animationDelay: `${100 + STEPS.length * 90 + 120}ms` }}>
          <a
            href="/host.html"
            className="inline-block rounded-xl bg-clay px-5 py-3 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-clay-dark hover:shadow-lift active:scale-[0.98]"
          >
            Import your first listing
          </a>
        </div>
      </div>
    </div>
  );
}
