# PARALORE — Rebuild Society After Work

Live app: https://paralore.sha-i.com

Public source: https://github.com/shalynmonet/paralore

A working fictional policy laboratory built with Builder.io Agent-Native 0.226.0, React, TypeScript and Tailwind. Four views share one persistent SQL-backed world: World Dashboard, Policy Lab, AI Assembly and Citizen View. Numerical outcomes come from explicit deterministic rules.

## Run locally on Windows

Requires Node.js 22.22 or later. In this folder:

```powershell
npx --yes pnpm@10.14.0 install --frozen-lockfile
node node_modules/@agent-native/core/bin/agent-native.js db-migrate
node node_modules/@agent-native/core/bin/agent-native.js dev
```

Open the local URL printed by the server (normally http://localhost:8080). Initial startup compiles the framework and can be slow; later navigation is faster. The framework supplies a local development account. The original Builder project is https://builder.io/app/projects/2e00d5bc1db2474a8d58/development; local changes are not automatically synchronized back into it.

## What works

- Parameterized policy previews; six indicators; timeline, decisions and shared action log.
- Assembly roles and amendments create real new proposals.
- A review dialog precedes UI enactment. The native dispatcher requires human approval for agent enactment. A model cannot approve itself by supplying a boolean.
- Transactional row locking; immutable parameters; stale, superseded and duplicate enactment rejection; reset invalidates old proposals.
- Derived household budgets; annual drift; five-year replay; SQL persistence across refreshes.
- Responsive navigation, keyboard controls, focus-trapped dialogs and reduced motion.

The exported source supplied the domain engine, actions, store and UI primitives. The local implementation completes the four screens and fixes imports, branding, routing and state scoping.

## Agent and model status

The native agent runtime and all eight domain actions are wired into the framework. A live model provider must be connected in the native agent setup to run conversational interpretation; no API key is included. Use the framework's own setup UI and enter credentials there, never into source or chat. The Assembly is deliberately labeled deterministic role-based analysis and is usable without a live model. Native tool-dispatch approval tests do not require a paid model.

Signed-in identities receive separate world rows. Identity-free local development uses one local world. This is not an anonymous multiuser production service. Before hosting, configure production authentication and persistent PostgreSQL, run migrations and test the deployed approval flow. Local PGlite data and secrets are excluded from source exports.

## Verification

```powershell
node node_modules/vitest/vitest.mjs run --config vitest.post-labor.config.ts
node node_modules/@agent-native/core/bin/agent-native.js typecheck
node node_modules/@agent-native/core/bin/agent-native.js doctor
```

11 automated tests passed, including exact trajectory, preview purity, household finances, clamping, reset, stale/duplicate/superseded proposals and real native-dispatch approval enforcement. Typecheck and doctor passed. Browser smoke verified baseline, previews, cancellation, Assembly, amended proposals, approval dialog, enactment, incremental upgrades, household budgets and five-year advancement. See ACCEPTANCE.md for reference values and DEMO.md for recording guidance.

Published on Vercel with a Neon free-plan PostgreSQL database. The custom domain is verified. Live model connection, a public Clips recording and hackathon submission remain separate steps. Vercel could not connect its GitHub integration to the repository; deploy updates explicitly with `vercel deploy --prod --yes` until repository access is configured. Deadline supplied: November 9, 2026, 11:59 PM Pacific / November 10, 1:59 AM Central.

