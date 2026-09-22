"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { HouseIcon } from "@/components/icons";
import { CopyButton } from "@/components/CopyButton";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const REQUIRED_FACT_FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: "wifiName", label: "Wi-Fi name", placeholder: "OakHouse" },
  { key: "wifiPassword", label: "Wi-Fi password", placeholder: "oak2026" },
  { key: "accessMethod", label: "How guests get in", placeholder: "Lockbox by the front door" },
  { key: "parkingInstructions", label: "Parking", placeholder: "Spot B3 behind the building" },
  { key: "quirk", label: "One quirk guests should know", placeholder: "Water takes a minute to heat up" },
];

export default function ListingPage() {
  return (
    <Suspense fallback={<PageShell><LoadingSkeleton /></PageShell>}>
      <ListingPageInner />
    </Suspense>
  );
}

function ListingPageInner() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");

  if (!idParam) return <PageShell>Missing listing id.</PageShell>;
  const listingId = idParam as Id<"listings">;

  const listing = useQuery(api.listings.get, { listingId });
  const faqs = useQuery(api.faqs.listByListing, { listingId });
  const stays = useQuery(api.stays.listByListing, { listingId });
  const drafts = useQuery(api.drafts.listByListing, { listingId });

  if (listing === undefined) return <PageShell><LoadingSkeleton /></PageShell>;
  if (listing === null) return <PageShell>Listing not found.</PageShell>;

  return (
    <PageShell>
      <ListingHeader listing={listing} />
      <CompleteFactsForm listingId={listingId} listing={listing} />
      <EmailInboxSection listingId={listingId} />
      <StaysSection listingId={listingId} stays={stays} />
      <InboxSection listingId={listingId} stays={stays} drafts={drafts} faqCount={faqs?.length ?? 0} />
      <KnowledgeSection faqs={faqs} />
    </PageShell>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-9 w-2/3" />
      <div className="skeleton h-40 w-full" />
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-40 w-full" />
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-2xl space-y-12 px-6 py-12 text-ink">{children}</div>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  delay = 0,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <section
      className="animate-fade-up rounded-2xl border border-sand bg-paper p-6 shadow-soft"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h2 className="font-serif text-xl font-medium text-ink">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-taupe">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ListingHeader({ listing }: { listing: Doc<"listings"> }) {
  const removeListing = useMutation(api.listings.remove);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await removeListing({ listingId: listing._id });
      window.location.href = "/host.html";
    } catch {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between">
        <a
          href="/host.html"
          className="link-underline inline-flex items-center gap-1 text-sm text-taupe transition hover:text-ink"
        >
          ← All properties
        </a>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="rounded-lg bg-clay px-3 py-1.5 text-xs font-medium text-paper shadow-sm transition-all duration-200 hover:bg-clay-dark hover:shadow-lift active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-clay-light"
        >
          Delete property
        </button>
        <ConfirmDialog
          open={confirmOpen}
          title={`Delete "${listing.name}"?`}
          description="This removes its facts, stays, and inbox — guest links will stop working. This can't be undone."
          confirmLabel="Delete property"
          busy={deleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirmOpen(false)}
        />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-clay text-paper shadow-soft">
            <HouseIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-medium tracking-tight text-ink">{listing.name}</h1>
            {listing.locationText && <p className="mt-0.5 text-sm text-taupe">{listing.locationText}</p>}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
            listing.readinessReady ? "bg-sage-bg text-sage" : "bg-honey-bg text-honey"
          }`}
        >
          {listing.readinessReady ? "Guest ready" : `${listing.readinessMissing.length} facts missing`}
        </span>
      </div>
      <p className="mt-2 truncate text-xs text-taupe-light">Imported from {listing.sourceUrl}</p>
    </div>
  );
}

function CompleteFactsForm({
  listingId,
  listing,
}: {
  listingId: Id<"listings">;
  listing: Doc<"listings">;
}) {
  const updatePrivateFacts = useMutation(api.listings.updatePrivateFacts);
  const removePrivateFact = useMutation(api.listings.removePrivateFact);
  const facts = listing.privateFacts ?? {};
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(REQUIRED_FACT_FIELDS.map((f) => [f.key, String(facts[f.key] ?? "")])),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [extraLabel, setExtraLabel] = useState("");
  const [extraValue, setExtraValue] = useState("");

  async function save(patch: Record<string, string>) {
    setSaving(true);
    try {
      await updatePrivateFacts({ listingId, patch });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } finally {
      setSaving(false);
    }
  }

  const extraFacts = Object.entries(facts).filter(
    (entry) => !REQUIRED_FACT_FIELDS.some((f) => f.key === entry[0]),
  );

  return (
    <SectionCard
      title="Complete your property"
      subtitle="The listing can't know these — only you can."
      delay={60}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save(values);
        }}
        className="space-y-3"
      >
        {REQUIRED_FACT_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="text-xs font-medium text-taupe">{f.label}</label>
            <input
              value={values[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-sand bg-cream/50 px-3 py-2.5 text-sm text-ink placeholder:text-taupe-light focus:border-clay focus:bg-paper focus:outline-none focus:ring-4 focus:ring-clay-light transition"
            />
          </div>
        ))}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-clay px-4 py-2.5 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-clay-dark hover:shadow-lift active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {saved && (
            <span className="animate-fade-in text-sm font-medium text-sage">Saved ✓</span>
          )}
        </div>
      </form>

      {extraFacts.length > 0 && (
        <ul className="mt-5 space-y-1.5 border-t border-sand pt-4 text-sm">
          {extraFacts.map(([key, value]) => (
            <li key={key} className="flex items-start justify-between gap-3 text-taupe">
              <span>
                <span className="font-medium text-ink">{key}:</span> {String(value)}
              </span>
              <button
                type="button"
                onClick={() => void removePrivateFact({ listingId, field: key })}
                className="shrink-0 rounded-xl border border-sand px-3 py-1.5 text-xs font-medium text-ink transition hover:border-clay hover:text-clay"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!extraLabel || !extraValue) return;
          const key = extraLabel
            .trim()
            .split(/[^a-zA-Z0-9]+/)
            .filter(Boolean)
            .map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
            .join("");
          void save({ [key]: extraValue }).then(() => {
            setExtraLabel("");
            setExtraValue("");
          });
        }}
        className="mt-4 flex gap-2"
      >
        <input
          placeholder="Another fact (e.g. hair dryer location)"
          value={extraLabel}
          onChange={(e) => setExtraLabel(e.target.value)}
          className="flex-1 rounded-xl border border-sand bg-cream/50 px-3 py-2.5 text-sm placeholder:text-taupe-light focus:border-clay focus:bg-paper focus:outline-none focus:ring-4 focus:ring-clay-light transition"
        />
        <input
          placeholder="Answer"
          value={extraValue}
          onChange={(e) => setExtraValue(e.target.value)}
          className="flex-1 rounded-xl border border-sand bg-cream/50 px-3 py-2.5 text-sm placeholder:text-taupe-light focus:border-clay focus:bg-paper focus:outline-none focus:ring-4 focus:ring-clay-light transition"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl border border-sand px-4 py-2.5 text-sm font-medium text-ink transition hover:border-clay hover:text-clay"
        >
          Add
        </button>
      </form>
    </SectionCard>
  );
}

function EmailInboxSection({ listingId }: { listingId: Id<"listings"> }) {
  const inbox = useQuery(api.agentmailInboxes.getAddressByListing, { listingId });
  const provisionInbox = useAction(api.agentmail.provisionInbox);
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <SectionCard title="Email inbox" delay={120}>
      {inbox === undefined && <div className="skeleton h-9 w-40" />}
      {inbox === null && (
        <div>
          <p className="text-sm text-taupe">
            Give guests a dedicated address that drafts answers automatically.
          </p>
          <button
            disabled={provisioning}
            onClick={async () => {
              setProvisioning(true);
              setError(null);
              try {
                await provisionInbox({ listingId });
              } catch (err) {
                setError(err instanceof Error ? err.message : "Couldn't set up the inbox.");
              } finally {
                setProvisioning(false);
              }
            }}
            className="mt-3 rounded-xl bg-clay px-4 py-2.5 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-clay-dark hover:shadow-lift active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {provisioning ? "Setting up…" : "Set up email inbox"}
          </button>
          {error && <p className="mt-2 text-sm text-clay-dark">{error}</p>}
        </div>
      )}
      {inbox && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-taupe">
            Guests can email{" "}
            <span className="rounded-md bg-clay-light px-1.5 py-0.5 font-mono text-xs text-clay-dark">
              {inbox.address}
            </span>{" "}
            — replies you approve below are sent from there automatically.
          </p>
          <CopyButton value={inbox.address} />
        </div>
      )}
    </SectionCard>
  );
}

function StaysSection({
  listingId,
  stays,
}: {
  listingId: Id<"listings">;
  stays: Doc<"stays">[] | undefined;
}) {
  const createStay = useMutation(api.stays.create);
  const [guestFirstName, setGuestFirstName] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [parking, setParking] = useState("");
  const [creating, setCreating] = useState(false);
  const [lastLink, setLastLink] = useState<string | null>(null);

  const inputClass =
    "rounded-xl border border-sand bg-cream/50 px-3 py-2.5 text-sm placeholder:text-taupe-light focus:border-clay focus:bg-paper focus:outline-none focus:ring-4 focus:ring-clay-light transition";

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!guestFirstName || !checkIn || !checkOut) return;
    setCreating(true);
    try {
      const { slug } = await createStay({
        listingId,
        guestFirstName,
        checkIn: new Date(checkIn).getTime(),
        checkOut: new Date(checkOut).getTime(),
        overrides: {
          accessCode: accessCode || undefined,
          parking: parking || undefined,
        },
      });
      setLastLink(`${window.location.origin}/stays/guest.html?slug=${slug}`);
      setGuestFirstName("");
      setCheckIn("");
      setCheckOut("");
      setAccessCode("");
      setParking("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <SectionCard title="Stays" delay={180}>
      <form onSubmit={handleCreate} className="grid grid-cols-2 gap-2">
        <input
          placeholder="Guest first name"
          value={guestFirstName}
          onChange={(e) => setGuestFirstName(e.target.value)}
          className={`col-span-2 ${inputClass}`}
        />
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className={inputClass}
        />
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Door code for this stay (optional)"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          className={inputClass}
        />
        <input
          placeholder="Parking spot for this stay (optional)"
          value={parking}
          onChange={(e) => setParking(e.target.value)}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={creating}
          className="col-span-2 rounded-xl bg-clay px-4 py-2.5 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-clay-dark hover:shadow-lift active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create stay page"}
        </button>
      </form>
      {lastLink && (
        <div className="animate-scale-in mt-3 flex items-center gap-2 rounded-xl bg-sage-bg px-4 py-3">
          <p className="text-sm font-medium text-sage">Stay page ready</p>
          <div className="ml-auto flex items-center gap-2">
            <CopyButton
              value={lastLink}
              className="rounded-lg border border-sage/30 px-2.5 py-1.5 text-xs font-medium text-sage transition hover:bg-sage/10"
            />
            <a
              href={lastLink}
              className="rounded-lg bg-sage px-3 py-1.5 text-sm font-medium text-paper shadow-sm transition hover:brightness-110"
            >
              Open stay page
            </a>
          </div>
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {stays?.map((stay, i) => (
          <li
            key={stay._id}
            className="animate-fade-up flex items-center justify-between rounded-xl border border-sand px-4 py-3 text-sm transition hover:border-sand-dark"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span className="text-ink">
              {stay.guestFirstName} · {new Date(stay.checkIn).toLocaleDateString()}–
              {new Date(stay.checkOut).toLocaleDateString()}
            </span>
            <a
              href={`/stays/guest.html?slug=${stay.slug}`}
              className="rounded-lg border border-sand px-3 py-1.5 text-xs font-medium text-ink transition hover:border-clay hover:text-clay"
            >
              View page
            </a>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function InboxSection({
  listingId,
  stays,
  drafts,
  faqCount,
}: {
  listingId: Id<"listings">;
  stays: Doc<"stays">[] | undefined;
  drafts: Doc<"drafts">[] | undefined;
  faqCount: number;
}) {
  const askQuestion = useAction(api.answerQuestion.run);
  const [question, setQuestion] = useState("");
  const [stayId, setStayId] = useState<string>("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question) return;
    setAsking(true);
    setError(null);
    try {
      await askQuestion({
        listingId,
        stayId: stayId ? (stayId as Id<"stays">) : undefined,
        inboundText: question,
        channel: "paste",
      });
      setQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't draft an answer.");
    } finally {
      setAsking(false);
    }
  }

  const openDrafts = drafts?.filter((d) => d.status === "pending" || d.status === "flagged") ?? [];
  const resolvedDrafts = drafts?.filter((d) => d.status === "approved" || d.status === "edited") ?? [];

  return (
    <SectionCard
      title="Inbox"
      subtitle={`${resolvedDrafts.length} answered · ${faqCount} things Housefile knows`}
      delay={240}
    >
      <form onSubmit={handleAsk} className="space-y-2">
        <textarea
          placeholder="What did the guest ask?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-sand bg-cream/50 px-3 py-2.5 text-sm placeholder:text-taupe-light focus:border-clay focus:bg-paper focus:outline-none focus:ring-4 focus:ring-clay-light transition"
        />
        <div className="flex gap-2">
          <select
            value={stayId}
            onChange={(e) => setStayId(e.target.value)}
            className="rounded-xl border border-sand bg-cream/50 px-3 py-2.5 text-sm focus:border-clay focus:bg-paper focus:outline-none focus:ring-4 focus:ring-clay-light transition"
          >
            <option value="">No specific stay</option>
            {stays?.map((s) => (
              <option key={s._id} value={s._id}>
                {s.guestFirstName}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={asking}
            className="rounded-xl bg-clay px-4 py-2.5 text-sm font-medium text-paper shadow-sm transition-all duration-200 hover:bg-clay-dark hover:shadow-lift active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {asking ? "Drafting…" : "Draft answer"}
          </button>
        </div>
      </form>
      {error && <p className="mt-2 text-sm text-clay-dark">{error}</p>}

      <div className="mt-6 space-y-3">
        {openDrafts.map((draft, i) => (
          <DraftCard key={draft._id} draft={draft} delay={i * 60} />
        ))}
      </div>
    </SectionCard>
  );
}

function DraftCard({ draft, delay = 0 }: { draft: Doc<"drafts">; delay?: number }) {
  const approve = useMutation(api.drafts.approve);
  const sendApprovedReply = useAction(api.agentmail.sendApprovedReply);
  const discard = useMutation(api.drafts.discard);
  const proposePatch = useAction(api.learn.proposePatch);
  const approveLearnedPatch = useMutation(api.drafts.approveLearnedPatch);

  const [editedReply, setEditedReply] = useState(draft.reply);
  const [hostAnswer, setHostAnswer] = useState("");
  const [teaching, setTeaching] = useState(false);
  const [teachError, setTeachError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const isFlagged = draft.status === "flagged";
  const isEmail = draft.channel === "email";

  async function handleApprove() {
    if (!isEmail) {
      await approve({ draftId: draft._id, editedReply });
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      await sendApprovedReply({ draftId: draft._id, editedReply });
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Couldn't send the reply.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="animate-fade-up rounded-xl border border-sand bg-cream/40 p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="font-serif text-base font-medium text-ink">&ldquo;{draft.inboundText}&rdquo;</p>

      {!isFlagged && (
        <>
          <textarea
            value={editedReply}
            onChange={(e) => setEditedReply(e.target.value)}
            rows={2}
            className="mt-2 w-full rounded-xl border border-sand bg-paper px-3 py-2.5 text-sm focus:border-clay focus:outline-none focus:ring-4 focus:ring-clay-light transition"
          />
          {draft.citations.length > 0 && (
            <p className="mt-1 text-xs text-taupe-light">
              Grounded by: {draft.citations.map((c) => c.field).join(", ")}
            </p>
          )}
          <div className="mt-2 flex gap-2">
            <button
              disabled={sending}
              onClick={() => void handleApprove()}
              className="rounded-lg bg-clay px-3 py-1.5 text-xs font-medium text-paper shadow-sm transition hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEmail ? (sending ? "Sending…" : "Approve & send") : "Approve"}
            </button>
            <button
              onClick={() => void discard({ draftId: draft._id })}
              className="rounded-lg border border-sand px-3 py-1.5 text-xs text-taupe transition hover:border-sand-dark hover:text-ink"
            >
              Discard
            </button>
          </div>
          {sendError && <p className="mt-1 text-xs text-clay-dark">{sendError}</p>}
        </>
      )}

      {isFlagged && !draft.proposedPatch && (
        <div className="mt-2">
          <p className="flex items-start gap-1.5 text-xs text-honey">
            <span aria-hidden="true">⚠</span> Housefile doesn&apos;t know this yet — {draft.flagReason}
          </p>
          <textarea
            placeholder="Answer it here — Housefile will remember it next time."
            value={hostAnswer}
            onChange={(e) => setHostAnswer(e.target.value)}
            rows={2}
            className="mt-2 w-full rounded-xl border border-sand bg-paper px-3 py-2.5 text-sm focus:border-clay focus:outline-none focus:ring-4 focus:ring-clay-light transition"
          />
          <button
            disabled={!hostAnswer || teaching}
            onClick={async () => {
              setTeaching(true);
              setTeachError(null);
              try {
                await proposePatch({ draftId: draft._id, hostAnswer });
              } catch (err) {
                setTeachError(
                  err instanceof Error
                    ? err.message
                    : "Couldn't teach Housefile — the model may be overloaded, try again.",
                );
              } finally {
                setTeaching(false);
              }
            }}
            className="mt-2 rounded-lg bg-clay px-3 py-1.5 text-xs font-medium text-paper shadow-sm transition hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {teaching ? "Teaching…" : "Teach Housefile"}
          </button>
          {teachError && <p className="mt-1 text-xs text-clay-dark">{teachError}</p>}
        </div>
      )}

      {isFlagged && draft.proposedPatch && (
        <div className="animate-scale-in mt-2 rounded-xl bg-sage-bg p-3 text-sm">
          <p className="font-medium text-sage">New property knowledge</p>
          <p className="mt-1 text-ink/80">
            {draft.proposedPatch.field} → {draft.proposedPatch.value}
          </p>
          <button
            onClick={() => void approveLearnedPatch({ draftId: draft._id })}
            className="mt-2 rounded-lg bg-sage px-3 py-1.5 text-xs font-medium text-paper shadow-sm transition hover:brightness-110"
          >
            Save to Housefile
          </button>
        </div>
      )}
    </div>
  );
}

const SOURCE_LABEL: Record<Doc<"faqs">["source"], string> = {
  seed: "From listing",
  host: "From host",
  learned: "Learned",
};

// The review side of the teach loop — everything Housefile has learned
// (from the import seed, or taught by the host) was previously only
// visible as a count on the Inbox card, with no way to see or correct it.
function KnowledgeSection({ faqs }: { faqs: Doc<"faqs">[] | undefined }) {
  const removeFaq = useMutation(api.faqs.remove);

  return (
    <SectionCard
      title="Things Housefile knows"
      subtitle="Every fact guests can be answered from — remove anything wrong or outdated."
      delay={300}
    >
      {faqs === undefined && (
        <div className="space-y-2">
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-14 w-full" />
        </div>
      )}
      {faqs?.length === 0 && (
        <p className="text-sm text-taupe">
          Nothing learned yet — teach Housefile by answering a flagged question above.
        </p>
      )}
      <ul className="space-y-2">
        {faqs?.map((faq, i) => (
          <li
            key={faq._id}
            className="animate-fade-up flex items-start justify-between gap-3 rounded-xl border border-sand px-4 py-3 text-sm"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div>
              <p className="font-medium text-ink">{faq.q}</p>
              <p className="mt-0.5 text-taupe">{faq.a}</p>
              <span className="mt-1 inline-block rounded-full bg-cream px-2 py-0.5 text-xs text-taupe-light">
                {SOURCE_LABEL[faq.source]}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void removeFaq({ faqId: faq._id })}
              className="shrink-0 text-xs text-taupe-light transition hover:text-clay-dark"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
