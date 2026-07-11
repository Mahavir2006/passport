# AgentPassport — Build Status

Status snapshot of the hackathon prototype: what's implemented, what's stubbed, and what's left to build.

## Not yet verified

Node.js is not installed on the dev machine used so far, so `npm install` and `npm run dev`
have never actually been run. Everything below is written against Express/better-sqlite3/React
Router APIs with confidence, but **install Node, run it, and shake out any real bugs** before a demo.

```
npm install && npm run install:all
npm run dev   # server on :4000, client on :5173 (Vite proxies /api)
```

---

## Done

### Backend (`/server`)
- Express app (`server/src/index.js`) with CORS + JSON body parsing, mounted at `/api/agents`.
- SQLite via better-sqlite3 (`server/src/db.js`), file-based, auto-creates schema on boot:
  - `agents`, `visas`, `stamps`, `blacklist` tables.
  - 4 seeded demo websites (`ShopSite.com`, `SocialHub.com`, `DataVault.com`, `NewsWire.com`), each with a category, allowed-purpose keywords, and a minimum trust score.
  - 3 seeded blacklist entries (by agent name and/or creator).
- Endpoints, all under `/api/agents`:
  - `GET /websites` — list demo websites/rules.
  - `GET /blacklist/all`, `POST /blacklist/all` — view/add watchlist entries; adding one retroactively blacklists any matching existing agents.
  - `POST /` — register agent → runs `analyzeAgentPurpose()` (stub, see below) → generates passport, applies blacklist check.
  - `GET /:id` — fetch passport.
  - `POST /:id/visa` — rule-based visa approval (trust score threshold + purpose/category keyword match), denies blacklisted agents outright, logs a `Stamp` on approval.
  - `GET /:id/stamps` — activity log (stamps + visa history).
  - `POST /:id/simulate-behavior` — dev-only trust score bump/drop for demoing the trust dashboard; auto-blacklists at score ≤10, won't silently un-blacklist an explicitly watchlisted agent.
- `analyzeAgentPurpose()` (`server/src/ai.js`) — **STUBBED**. Uses keyword heuristics (risky/trusted keyword lists) to fake risk level, trust score, granted permissions, and spending limit. Clearly commented with the exact real-LLM call shape to drop in later (OpenAI/Gemini), and the return shape callers depend on.

### Frontend (`/client`)
Vite + React + Tailwind + Framer Motion, `HashRouter`-based SPA, Windows XP / early-IE visual theme (`client/src/index.css`, `XpWindow.jsx`): gradient title bars, bevel panels, glossy buttons, retro CSS spinner (not a skeleton loader).

Screens (`client/src/pages/`):
1. **RegisterPage** — name/creator/purpose form + permission checkboxes.
2. **PassportPage** — ID-card styled passport display (status badge, trust score, permissions, spending limit).
3. **VisaPage** — pick one of the seeded demo websites, see its rules, apply.
4. **ImmigrationPage** — retro spinner (min ~1.4s so it reads as "checking"), then an Access Granted / Access Denied modal with the rule-engine's reason.
5. **StampsPage** — two-column activity log: stamps earned + full visa history (approved/denied) with reasons and timestamps.
6. **TrustPage** — current trust score + animated bar, dev buttons to simulate good/bad/malicious behavior, running change log.
7. **BlacklistPage** — view the watchlist, add new entries (agent name and/or creator + reason); not gated behind having an active agent.

Agent identity persists across screens via `localStorage` (`App.jsx`), so a page refresh doesn't lose the current passport. `client/src/lib/api.js` centralizes all fetch calls.

### Repo/tooling
- Root `package.json` runs client + server concurrently via `concurrently`.
- `.gitignore` covers `node_modules`, build output, the SQLite `.db` file, `.env`.

---

## Deliberately deferred (per hackathon-speed instructions)
- **Database**: SQLite instead of the spec's MongoDB/Supabase — swap later if needed, but the query patterns in `db.js`/`agents.js` are simple enough to port.
- **Auth**: no JWT/auth layer at all. Anyone can hit any endpoint for any agent ID. Fine for a demo, not fine beyond it.
- **AI**: `analyzeAgentPurpose()` is a heuristic stub, not a real OpenAI/Gemini call.

---

## What's left to build

### Must-do before relying on this for a demo
- [ ] **Install Node and actually run it once.** Nothing here has executed. Expect at least minor bugs (import paths, better-sqlite3 native build on Windows, Tailwind content globs, etc.).
- [ ] Smoke-test the full flow end to end: register → passport → visa → immigration → stamps → trust → blacklist.

### Real AI integration (currently stubbed)
- [ ] Swap `analyzeAgentPurpose()` in `server/src/ai.js` for a real OpenAI/Gemini call — the comment block at the top of that file spells out the exact request/response shape expected by callers in `routes/agents.js`.
- [ ] Decide on and store an API key via `.env` (already gitignored) + `dotenv` or similar — not wired up yet.
- [ ] Handle LLM latency/failure gracefully (timeout, fallback to the heuristic stub) — the current call site assumes a synchronous, always-succeeds function.

### Feature gaps vs. the original spec
- [ ] JWT auth layer, if the "who can act on which agent" question ends up mattering for the demo narrative.
- [ ] Spending-limit enforcement isn't tied to anything — there's no "agent tries to spend $X" simulated action that actually checks/deducts against `spendingLimit`.
- [ ] No way to edit/re-analyze an existing agent's purpose or permissions after registration.
- [ ] No pagination/limits on stamps, visas, or blacklist lists — fine at demo scale, will misbehave with real volume.
- [ ] Blacklist matching is exact-string (case-insensitive) on name/creator — no fuzzy matching, no way to blacklist by agent ID directly.

### Polish (nice-to-have if time allows)
- [ ] Pixel-art icons instead of emoji for a more authentic 2006 feel.
- [ ] Sound effects (classic XP error "ding", IE page-load chime) for the immigration approve/deny moment.
- [ ] A "world map" or list view showing all registered agents (currently only one agent is tracked client-side at a time, via `localStorage`).
- [ ] Mobile responsiveness — not considered at all; this was built XP-desktop-first.

### Production-hardening (post-hackathon, not needed for demo)
- [ ] Move off SQLite to a real hosted DB if this needs to survive beyond a laptop demo.
- [ ] Add real authentication/authorization.
- [ ] Input validation/sanitization is minimal — fields are trusted as-is beyond basic presence checks.
- [ ] Rate limiting on registration/visa endpoints.
