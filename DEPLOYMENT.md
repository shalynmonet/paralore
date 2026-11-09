# Paralore deployment

Live: https://paralore.sha-i.com
Public source: https://github.com/shalynmonet/paralore
Host: Vercel project shalynmonet/paralore, Node.js 22.
Database: Neon free_v3, region iad1. Database credentials and signing secrets remain in Vercel; no production environment download is required.

Production builds run scripts/build-vercel.mjs. It applies framework and application migrations using the production environment, then builds Nitro for Vercel. The daily framework sweep is configured to fit Vercel Hobby limits. No paid plan was selected.

The Squarespace CNAME for paralore points to 1a6983e9d3a0fbe3.vercel-dns-017.com. Do not replace apex or other subdomain records.

To update: commit and push source to GitHub, then run `vercel deploy --prod --yes` from the canonical local folder. Automatic GitHub integration was not accepted by Vercel, so a Git push alone currently does not publish an update.

Production authentication remains enabled. The local development account is not a production account. Native agent chat requires each visitor to connect an appropriate model provider; the illustrative Assembly is deterministic and works without a live model. No live LLM provider key was published.
