# Housefile

**Give your property a memory.**

Housefile is a living property file for solo short-term-rental hosts. It
imports a listing, lets the host fill in the private facts only they know
(wifi, access, parking, quirks), and answers guest questions strictly from
that property file — citing what it knows, flagging what it doesn't, and
learning permanently from the host's corrections.

Built for the **Convex All Gas Hackathon**. See [`hackathon.md`](./hackathon.md)
for the evidence-based build log.

## Stack

- **Convex** — schema, queries/mutations/actions, an HTTP action webhook,
  realtime `useQuery` on the frontend (`convex/`)
- **Firecrawl** — scrapes a listing URL into a structured seed
  (`convex/importListing.ts`)
- **OpenAI** — extraction, grounded question-answering with citations, and
  turning a host's answer into a proposed fact (`convex/importListing.ts`,
  `convex/answerQuestion.ts`, `convex/learn.ts`)
- **AgentMail** — a dedicated inbox per listing, a signed webhook receiver,
  and threaded outbound replies (`convex/agentmail.ts`, `convex/http.ts`)

## Routes

- `/host` — import a listing, see your properties
- `/host/[listingId]` — complete required facts, set up the email inbox,
  create stays, run the inbox (ask a question, approve/discard/teach)
- `/stays/[slug]` — the public guest page

## Running locally

```bash
npm install
npx convex dev      # links/creates your Convex deployment, watches convex/
npm run dev          # in a second terminal
```

Set the required environment variables on your Convex deployment:

```bash
npx convex env set OPENAI_API_KEY sk-...
npx convex env set FIRECRAWL_API_KEY fc-...
npx convex env set AGENTMAIL_API_KEY am_...
```

## Core loop

**Import → Complete → Create stay → Ask → Learn → Prevent.**

A listing URL becomes a property file (Firecrawl + OpenAI). The host fills
in what the listing can't know. Guests get a stay-specific page. A guest
question is answered only from real property-file facts — grounded and
cited, or flagged rather than guessed. When the host answers a flagged
question, Housefile learns it permanently, and the next guest never has to
ask.
