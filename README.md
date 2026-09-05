# Intent Firewall

Intent Firewall is a policy layer for agentic wallets. It evaluates a proposed transaction against deterministic spending, network, destination, and approval rules before the request becomes eligible for signing.

**Live demo:** https://intent-f.vercel.app

## What the demo shows

- A safe API payment that passes every policy rule.
- A drainer-style transfer blocked by the spending cap and destination allowlist.
- An unlimited token approval blocked before signing.
- A transaction on a network outside the configured policy.
- A custom-request mode for testing additional policy edge cases.

Allowed Base requests receive a live Base Sepolia `eth_simulateV1` preflight receipt. The simulation uses pending testnet state but does not broadcast a transaction, require a wallet connection, or move funds. Requests that fail policy evaluation never reach the RPC.

## Security boundary

Intent Firewall can protect a wallet only when every agent-initiated action is routed through its policy-controlled signer. It cannot protect keys, approvals, or transactions that bypass that boundary. This repository is a hackathon prototype and not production wallet infrastructure.

## Stack

- TypeScript and React
- Next.js App Router
- Vercel serverless API route
- Base Sepolia JSON-RPC preflight

## Submission materials

- [ETHOnline submission copy](SUBMISSION.md)
- [Architecture diagram](docs/ARCHITECTURE.md)
- [Three-minute demo script](docs/DEMO_SCRIPT.md)
- [AI assistance disclosure](AI_USAGE.md)
- [Project timeline and continuity disclosure](CONTINUITY.md)

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validate a production build

```bash
npm run build
```
