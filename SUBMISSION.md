# ETHOnline 2026 submission copy

## Project title

Intent Firewall

## One-line description

Deterministic transaction guardrails that stop an AI wallet agent from exceeding its owner’s intended authority.

## Short description

Intent Firewall evaluates every proposed agent transaction against explicit spending, network, destination and token-approval rules before it becomes eligible for signing. Unsafe requests stop locally; allowed Base requests receive a live Base Sepolia preflight receipt without connecting a wallet or moving funds.

## Full project description

AI agents can research, negotiate and execute faster than a person, but wallet access creates a difficult security tradeoff: approve every action manually or trust the agent with broad authority. Ordinary wallet warnings still depend on a human recognizing every dangerous transaction at exactly the right moment.

Intent Firewall moves that decision into an enforceable policy boundary. The owner defines what the agent may do: how much it can spend, which networks it can use, which destinations are approved, and whether unlimited token approvals are forbidden. Every proposed intent is evaluated by a deterministic policy engine before any signing step.

The interactive demo makes the control boundary inspectable. A safe API payment passes five independent rules and receives a live Base Sepolia `eth_simulateV1` preflight proof. A drainer-style transfer fails both the destination allowlist and spending limit and is stopped before the RPC. A zero-value unlimited approval demonstrates that transaction value alone is not enough to judge risk. Locked scenarios preserve the meaning of the walkthrough, while Custom request mode lets judges test their own edge cases.

The prototype deliberately does not connect a wallet, request deposits, hold keys, create signatures or broadcast transactions. Its purpose is to demonstrate the authorization and preflight layer safely. A production version would place the same deterministic engine in front of a policy-controlled signer so every agent-initiated action must pass through the firewall.

## Problem

Wallet interfaces can explain what a transaction might do, but agentic wallets need continuous enforcement rather than another warning screen. A compromised agent, malicious tool response or mistaken instruction should not be able to exceed a previously approved purpose and budget.

## Solution

- Human-readable policies backed by deterministic rules.
- Independent checks for amount, network, destination, cumulative spend and approval scope.
- Rejection before network execution when any rule fails.
- Live Base Sepolia preflight for allowed requests.
- Evidence-rich receipts that explain every pass, failure and execution outcome.
- Explicit disclosure of the signer boundary and fallback behavior.

## Technical implementation

- React and TypeScript frontend using the Next.js App Router.
- A server-side `/api/evaluate` route validates requests and keeps RPC behavior out of the browser.
- A reusable deterministic policy engine returns structured rule results and remaining authority.
- Allowed Base requests call Base Sepolia `eth_simulateV1` against pending state.
- Network failure produces a visibly labelled fallback rather than pretending a live call succeeded.
- Vercel hosts the frontend and API; GitHub integration deploys the `main` branch.

## Originality and wow factor

Intent Firewall is not another transaction-warning interface. It separates a human’s durable intent from an agent’s individual transaction proposal and produces a rule-by-rule authorization receipt before signing. The memorable moment is seeing a plausible drainer request fail two independent rules and stop before the RPC, immediately after a safe request produced live testnet execution evidence.

## Current limitations

- The prototype demonstrates evaluation and preflight, not a production signer integration.
- Live network preflight currently targets Base Sepolia for allowed Base requests.
- Policy state is demonstration state and is not persisted across devices.
- The recipient allowlist uses sample identifiers rather than live ENS resolution.

## Links

- Live demo: https://intent-f.vercel.app
- Source code: https://github.com/Akixama/intent-firewall
- Architecture: https://github.com/Akixama/intent-firewall/blob/main/docs/ARCHITECTURE.md

## Suggested showcase tags

`AI agents` · `wallet security` · `transaction policy` · `Base` · `Ethereum` · `developer tooling`

## Partner-prize note

Do not claim a partner integration that is not implemented. The current prototype is suitable for the general showcase, but a partner prize should be selected only after adding that sponsor’s technology as a load-bearing part of the product and meeting its specific qualification requirements.

## Track disclosure

The repository history begins on September 3, 2026, while ETHOnline 2026 officially began on September 4. Do **not** submit this as a Start Fresh project without guidance from ETHGlobal. Use an applicable Continuity track and clearly describe the work completed during the event, or ask ETHGlobal whether the project is eligible for the intended category.
