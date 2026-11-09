# PARALORE — Rebuild Society After Work

Master build brief. Implement the complete working app in this Agent-Native project. Preserve the Agent-Native runtime and native assistant; implement real shared actions.

## Premise

Commonwealth of Aurora, a fictional nation in 2040. Population 10,000,000. AI displacement of previously existing jobs: 75%. Users explore security, ownership, time and services after work.

Persistent label: **Fictional policy simulation. Illustrative assumptions, not an economic forecast.**

## Design

Premium cinematic strategy-game / editorial policy command center, not a marketing landing page.

- Background `#101719`, panels `#192326`, ivory `#F2EFE6`, amber `#D5A45C`, teal `#64B8AD`, muted coral `#D97970`.
- Large editorial typography, precise labels, fine borders, elegant spacing, restrained motion, responsive charts.
- Desktop sidebar for four views; accessible mobile navigation, labeled inputs, keyboard focus, reduced motion.
- Launch straight into the dashboard. Keep the native agent available, but let the app dominate the canvas.

## Architecture

- ONE authoritative world state scoped to this simulation, durable across refreshes. Persist local simulation identity where needed.
- UI and native agent call the SAME `defineAction` implementations.
- No component mutates indicators. No LLM generates numbers. All numeric outcomes are pure deterministic engine output.
- State includes schemaVersion, simulationId, revision, year, indicators, active policy levels, immutable proposals, assembly records, timeline snapshots and decisions.
- Durable server storage with transactional, serialized writes. Validate stored state and report recovery problems.
- Return actionable errors. Handle loading, double clicks and failed requests.

## Shared callable actions

- `getWorldState()`: state, revision, proposals, history, decisions.
- `proposePolicy(policyId, parameters)`: validate, create an immutable proposal bound to the world revision, return evaluation. No indicator mutation.
- `evaluatePolicy(proposal)`: before/after metrics, deltas, household impacts, assumptions, trade-offs. No world changes.
- `conveneAssembly(proposal)`: three real role perspectives, risks, disagreement, actionable amendment. Never enacts.
- `enactPolicy(proposalId)`: requires explicit human approval bound to the EXACT proposal and current revision. Agents can REQUEST enactment but cannot approve themselves. Uses framework/server approval gating, not a model-supplied `confirmed: true` or `userApproved` input. The human UI shows parameters and all deltas, with cancel/confirm. Grants are one-use; stale world revisions, duplicate enactment and pre-reset approvals are rejected atomically. Edits create a NEW proposal and invalidate the old approval. Direct agent/tool calls must not bypass the gate.
- `advanceYears(years)`: integer 1–5, processes one year at a time, records every year.
- `inspectHousehold(householdId)`: derived from the same state; no independently mutable household numbers.
- `resetSimulation()`: confirmed full reset to the original baseline; invalidates all pending approvals and proposals; keeps only baseline history.

## Deterministic engine (explicit fictional MVP assumptions)

- Vector order: [Economic Security, Inequality (higher worse), Public Trust, Social Stability, Public Automation Ownership %, Fiscal Sustainability].
- Baseline `[32, 78, 38, 43, 8, 65]`, year 2040, all bounds 0–100. Clamp after each action and each annual step.
- Retain precision internally; display at most one decimal. No randomness or clock-driven outcomes.
- Discrete levels 0–4, 0 inactive. One active level per policy. Replacing a policy applies per-level vector times `(newLevel - currentLevel)`, never the full vector stacked. Reject the same active level. No repeal UI needed.

Policies:

1. **UBI**: levels 1/2/3/4 = monthly $500/$1000/$1500/$2000 per resident. Immediate delta per level `[+6, -4, +2, +3, 0, -7]`.
2. **Public AI Ownership**: levels 1/2/3/4 ADD 10/20/30/40 percentage points to the baseline public share (level 2 = 28%, not 20%). Delta per level `[+3, -5, +2, +2, +10, +3]`.
3. **Shorter Workweek**: levels 1/2/3/4 cap weekly hours at 30/25/20/15. Delta per level `[+2, -2, +2, +3, 0, -3]`.
4. **Universal Basic Services**: Essential / Expanded / Comprehensive / Universal, levels 1–4. Delta per level `[+5, -3, +3, +2, 0, -5]`.

Annual drift, given active levels u (UBI), o (Ownership), w (Workweek), s (Services):

- Security += -1 + 0.7u + 0.4o + 0.2w + 0.6s
- Inequality += 0.7 - 0.3u - 0.4o - 0.1w - 0.2s
- Trust += -0.5 + 0.2u + 0.2o + 0.2w + 0.3s
- Stability += -0.8 + 0.3u + 0.2o + 0.3w + 0.3s
- Ownership stays at its enacted value.
- Fiscal += 0.3 + 0.8o - 1.0u - 0.3w - 0.7s
- After applying and clamping: if fiscal < 25, subtract 2 from security, 2 from trust, 1 from stability, then clamp again.

Put the full rules in an Assumptions drawer. Forecasts run on a copy through this SAME engine without appending real history. Advancing five years must equal five one-year steps.

## Four views

1. **World Dashboard**: "PARALORE / Rebuild Society After Work". Aurora, year, population 10M, displacement 75%. Scenario status: Fiscal strain if fiscal < 25; Fragile transition if security or stability < 40; Building resilience otherwise. Six large cards with units, baseline change, short explanations and direction-aware colors (inequality down is good). Real timeline from baseline, every enactment and each annual snapshot; same-year decisions labeled. Active Policies panel and Recent Decisions feed. Buttons: Open Policy Lab, advance 1 / 5 years, reset with confirmation. Charts use real data and show a readable empty-state baseline.
2. **Policy Lab**: four parameterized cards with descriptions, active level, benefits and trade-offs. Preview produces a proposal with six actual before/after deltas, fiscal consequences, household impacts and transparent assumptions. Buttons: Preview consequences, Convene Assembly, Review for enactment. Preview and propose never enact. Explicit review dialog with exact parameters and confirm/cancel, plus success and error states. After enactment, all views update from shared state.
3. **AI Assembly**: three fictional delegates.
   - Maya Chen, displaced logistics worker (dignity, family security, skeptical of delays).
   - Adrian Voss, AI infrastructure owner (investment, transition costs, fiscal resilience, willing to negotiate ownership).
   - Leila Okafor, community organizer (universal access, legitimacy, care, local institutions).
   Use live native agent/model interpretation if connected. Reference actual evaluation and state; never invent numerical outcomes. Each delegate has a distinct position, risk, and at least one concrete amendment. Reviewing an amendment creates a NEW validated proposal via `proposePolicy`, re-evaluates it, and requires human confirmation before enactment. No hidden changes. If no live provider is configured, use honest deterministic role-based analysis labeled "Illustrative Assembly — deterministic role-based analysis; live model not connected." Never fake AI API availability or transcripts. The native assistant must actually invoke the shared get/propose/evaluate/convene/inspect/advance actions and request human approval for enactment. Keep an inspectable action log.
4. **Citizen View**: two illustrative households with derived line-item before/after finances, daily life and time; comparison and inspect action.
   - Chen: 2 adults + 1 child; baseline monthly earned income $1200, basic costs $2400, paid hours 20/week.
   - Rivera: 1 adult; earned income $3800, costs $2600, paid hours 40/week.
   - Monthly UBI = residents × 500 × u. Ownership dividend = residents × $40 × o.
   - Services reduce baseline costs by 8% × s, capped at 32%.
   - Workweek cap = [40, 30, 25, 20, 15][w].
   - Paid hours = min(baseline hours, cap).
   - Earned income = baseline income × paid hours / baseline hours. Disclose that the model assumes no wage compensation.
   - Disposable balance = earned + UBI + dividend − adjusted costs.
   - Show all components and baseline changes, weekly hours freed, and policy-specific explanatory narrative.
   - Households are not representative samples. Dashboard scores do not convert directly to dollars.

## Verification

- Meaningful tests for: baseline, validation, preview purity, deterministic deltas, replacement vs stacking, clamping, yearly equivalence, household finances, persistence/reset, stale/duplicate enactment, and approval bypass via direct agent action.
- Run typecheck/build and fix failures.
- Test all four views, cancel, mobile navigation and refresh persistence.
- Do not claim checks that could not be run, and do not call a native integration operational if it is absent.

## 90-second demo

Baseline dashboard → Public AI Ownership level 2 → preview → Assembly → review amendment → human confirms the exact policy → world/timeline update → inspect Chen → advance 5 years → explain fiscal trade-offs and assumptions. Keep a clean reset/replay.

Deliver: source, launch instructions, integration/provider status, tests actually run, demo script and any remaining deploy steps.

Deadline: Nov 9 2026, 11:59 PM Pacific.
