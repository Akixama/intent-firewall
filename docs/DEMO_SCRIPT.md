# Three-minute demo script

Target length: **3:00–3:30**. Record at **1080p** with your own spoken narration. Do not speed up the footage or use synthetic voiceover.

## 0:00–0:20 — The problem

**Show:** Intent Firewall hero and product preview.

**Say:** “AI agents are beginning to control wallets, but today we often choose between approving every transaction manually and giving an agent too much authority. Intent Firewall lets the owner define the boundary once, then evaluates every proposed wallet action before signing.”

## 0:20–0:45 — The policy

**Show:** Scroll to Create a policy. Cycle the spend limit or network once, open Review rules, confirm the boundary, and activate it.

**Say:** “A policy describes exactly what the agent may spend, which networks and destinations it may use, and whether broad token approvals are permitted. The readable sentence is compiled into deterministic checks. In this prototype, activation configures the demonstration—it does not connect to a real wallet.”

## 0:45–1:15 — Safe request

**Show:** Select Safe API payment and run the policy plus preflight. Pause on the six passing rules and execution proof.

**Say:** “This eight-USDC data payment is on Base, uses an allowlisted destination, stays within the remaining budget, and requests no unlimited approval. After policy evaluation, the server runs a live `eth_simulateV1` call against Base Sepolia pending state. The receipt includes the chain, block and gas used, without broadcasting funds.”

## 1:15–2:10 — Transaction substitution attack

**Show:** Select Transaction substitution and run it. Pause on the claimed-versus-decoded comparison, the four mismatches, real-world consequence, and intervention trail.

**Say:** “Here is the attack ordinary wallet prompts can miss. The agent claims it is paying seven USDC to a verified data provider. Intent Firewall decodes the raw transaction instead of trusting that description. The calldata is actually an unlimited token approval for an unknown spender. The action, destination, amount and approval scope all disagree, so the firewall stops the request before the RPC. The spender never receives authority over the wallet’s current or future token balance.”

## 2:10–2:30 — Drainer attempt

**Show:** Select Drainer transfer and run it. Highlight destination and spend failures, then ‘RPC not contacted.’

**Say:** “A direct drainer attempt is blocked independently too. This 2,500-USDC transfer exceeds the remaining budget and targets an unapproved destination. No signature is created and spend authority remains unchanged.”

## 2:30–2:50 — Audit proof

**Show:** Pause on the content-addressed audit receipt and select Copy proof.

**Say:** “Every result receives a portable audit receipt. Separate SHA-256 fingerprints identify the exact policy and intent, while the decision fingerprint binds them to the rule results, verdict, timestamp, and network evidence. It is an integrity record, not a wallet signature, and the complete JSON proof can be copied for an audit trail.”

## 2:50–3:20 — Architecture and close

**Show:** Architecture diagram, then return to the final receipt.

**Say:** “The server validates the request, decodes supported ERC-20 calldata, compares the encoded action with the agent’s claim, then applies deterministic policy rules. Failed requests stop before the RPC. Allowed Base requests continue to live testnet preflight, and every result receives a content-addressed receipt. The production path would place this engine in front of a controlled signer. Intent Firewall turns wallet security from repeated human warnings into enforceable boundaries for autonomous agents.”

## Recording checklist

- Keep the final export between 2 and 4 minutes; ETHGlobal rejects videos outside that range.
- Export at 1080p or at least 720p.
- Use a desktop screen recording and your natural voice.
- Remove loading pauses during editing, but do not speed up the video.
- Keep any intro under 20 seconds.
- Confirm the live demo and repository links are visible in the video description.
