# Acceptance checks

Use a fresh baseline. Simulation vector order: Security, Inequality, Trust, Stability, Public Ownership, Fiscal.

- Baseline: 2040, [32, 78, 38, 43, 8, 65]. No active policies.
- Preview public ownership level 2: projected [38, 68, 42, 47, 28, 71]. World remains baseline until human confirms.
- Cancel enactment: world, year and timeline unchanged.
- Confirm enactment: exactly the preview above, one event. Repeated confirmation must not apply it again.
- Chen after ownership level 2: earned $1,200, UBI $0, dividend $240, costs $2,400, balance -$960. Rivera: dividend $80, balance $1,280.
- Advance five years with only ownership level 2: year 2045, [37, 67.5, 41.5, 45, 28, 80.5]. Five separate annual advances must match.
- Upgrade ownership level 2 to level 3 at 2040: [41, 63, 44, 49, 38, 74]. Apply only one incremental level.
- Propose, advance time, attempt old proposal: stale revision error; no enactment.
- Direct agent enactment: pending human approval, no immediate indicator change.
- Reset: exact baseline, previous proposals and approval grants cannot enact.
- Refresh: preserve current state and history, no duplicated decision or reset.
- Try invalid year counts, unknown policy/household IDs and unsupported levels: validation errors, no partial changes.
- Mobile: usable navigation, readable cards/charts, no obscured confirmation controls.
- Assembly amendment: new proposal, accurate preview, independent human confirmation.
- Show truthful live model vs illustrative role-analysis status.

These are expected values calculated from the master specification, not claims that tests have passed.

Browser smoke additionally verified refresh persistence and mobile layout/reset. Simulation returned to the exact baseline after reset. A live-model chat is pending provider connection; do not describe the deterministic Assembly as a live LLM debate.
