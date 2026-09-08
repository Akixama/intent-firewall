# ETHOnline 2026 submission copy

## Project title

Intent Firewall

## One-line description

Deterministic transaction guardrails that stop an AI wallet agent from exceeding its owner’s intended authority.

## Short description

Intent Firewall decodes what an agent’s transaction actually does, compares it with what the agent claimed, and enforces explicit spending, network, destination and approval rules before signing. Unsafe requests stop locally; allowed Base requests receive a live Base Sepolia preflight receipt without connecting a wallet or moving funds.

## Full project description

AI agents can research, negotiate and execute faster than a person, but wallet access creates a difficult security tradeoff: approve every action manually or trust the agent with broad authority. Ordinary wallet warnings still depend on a human recognizing every dangerous transaction at exactly the right moment.

Intent Firewall moves that decision into an enforceable policy boundary. The owner defines what the agent may do: how much it can spend, which networks it can use, which destinations are approved, and whether unlimited token approvals are forbidden. Every proposed intent is evaluated by a deterministic policy engine before any signing step.

The interactive demo makes the control boundary inspectable. A safe API payment passes six independent rules and receives a live Base Sepolia `eth_simulateV1` preflight proof. The signature scenario is a transaction-substitution attack: the agent claims it is paying 7 USDC to a verified data provider, while the raw calldata decodes to an unlimited ERC-20 approval for an unknown spender. Intent Firewall shows the claimed and decoded actions side by side, identifies four mismatches, explains the real-world exposure, and stops the request before the RPC. A separate drainer transfer fails the destination allowlist and spending limit. Locked scenarios preserve the walkthrough, while Custom request mode lets judges paste and test additional calldata.

Every result also receives a content-addressed audit receipt generated on the server. Separate SHA-256 fingerprints identify the active policy and requested intent, while a decision fingerprint binds those inputs to the rule results, verdict, timestamp, and execution evidence. Judges can copy the complete JSON proof directly from the interface.

The prototype deliberately does not connect a wallet, request deposits, hold keys, create signatures or broadcast transactions. Its purpose is to demonstrate the authorization and preflight layer safely. A production version would place the same deterministic engine in front of a policy-controlled signer so every agent-initiated action must pass through the firewall.

## Problem

Wallet interfaces can explain what a transaction might do, but agentic wallets need continuous enforcement rather than another warning screen. A compromised agent, malicious tool response or mistaken instruction should not be able to exceed a previously approved purpose and budget.

## Solution

- Human-readable policies backed by deterministic rules.
- Independent checks for amount, network, destination, cumulative spend and approval scope.
- Fail-closed decoding for ERC-20 `transfer` and `approve` calldata.
- Claimed-intent versus decoded-call comparison with field-level mismatch evidence.
- Rejection before network execution when any rule fails.
- Live Base Sepolia preflight for allowed requests.
- Evidence-rich receipts that explain every pass, failure and execution outcome.
- Portable content-addressed receipts that bind policy, intent, verdict and execution evidence.
- Explicit disclosure of the signer boundary and fallback behavior.

## Technical implementation

- React and TypeScript frontend using the Next.js App Router.
- A server-side `/api/evaluate` route validates requests and keeps RPC behavior out of the browser.
- A reusable deterministic policy engine returns structured rule results and remaining authority.
- The policy engine decodes ERC-20 selectors and ABI words without trusting the agent’s description.
- Unsupported or malformed calldata fails closed instead of continuing to execution.
- Allowed Base requests call Base Sepolia `eth_simulateV1` against pending state.
- The server uses the Web Crypto API to canonicalize and hash the complete decision into an `ifw-v1` audit receipt.
- Network failure produces a visibly labelled fallback rather than pretending a live call succeeded.
- Vercel hosts the frontend and API; GitHub integration deploys the `main` branch.

## Originality and wow factor

Intent Firewall is not another transaction-warning interface. It checks the encoded action rather than trusting an agent’s description. The memorable moment is seeing “Pay 7 USDC” decode into an unlimited approval, watching four mismatches light up, and seeing the request stop before any RPC or signature. The final receipt cryptographically fingerprints the claim, calldata, policy, verdict and execution evidence as one portable record.

## Current limitations

- The prototype demonstrates evaluation and preflight, not a production signer integration.
- Live network preflight currently targets Base Sepolia for allowed Base requests.
- Policy state is demonstration state and is not persisted across devices.
- The recipient allowlist uses sample identifiers rather than live ENS resolution.
- The calldata decoder currently supports ERC-20 `transfer` and `approve` with six-decimal demo amounts; production support would use token metadata and a broader ABI registry.

## Links

- Live demo: https://intent-firewall-chi.vercel.app
- Source code: https://github.com/Akixama/intent-firewall
- Architecture: https://github.com/Akixama/intent-firewall/blob/main/docs/ARCHITECTURE.md

## Suggested showcase tags

`AI agents` · `wallet security` · `transaction policy` · `Base` · `Ethereum` · `developer tooling`

## Partner-prize note

Do not claim a partner integration that is not implemented. The current prototype is suitable for the general showcase, but a partner prize should be selected only after adding that sponsor’s technology as a load-bearing part of the product and meeting its specific qualification requirements.

## Track disclosure

The repository history begins on September 3, 2026, while ETHOnline 2026 officially began on September 4. Do **not** submit this as a Start Fresh project without guidance from ETHGlobal. Use an applicable Continuity track and clearly describe the work completed during the event, or ask ETHGlobal whether the project is eligible for the intended category.
