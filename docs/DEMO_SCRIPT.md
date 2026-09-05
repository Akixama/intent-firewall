# Three-minute demo script

Target length: **3:00–3:30**. Record at **1080p** with your own spoken narration. Do not speed up the footage or use synthetic voiceover.

## 0:00–0:20 — The problem

**Show:** Intent Firewall hero and product preview.

**Say:** “AI agents are beginning to control wallets, but today we often choose between approving every transaction manually and giving an agent too much authority. Intent Firewall lets the owner define the boundary once, then evaluates every proposed wallet action before signing.”

## 0:20–0:45 — The policy

**Show:** Scroll to Create a policy. Cycle the spend limit or network once, open Review rules, confirm the boundary, and activate it.

**Say:** “A policy describes exactly what the agent may spend, which networks and destinations it may use, and whether broad token approvals are permitted. The readable sentence is compiled into deterministic checks. In this prototype, activation configures the demonstration—it does not connect to a real wallet.”

## 0:45–1:20 — Safe request

**Show:** Select Safe API payment and run the policy plus preflight. Pause on the five passing rules and execution proof.

**Say:** “This eight-USDC data payment is on Base, uses an allowlisted destination, stays within the remaining budget, and requests no unlimited approval. After policy evaluation, the server runs a live `eth_simulateV1` call against Base Sepolia pending state. The receipt includes the chain, block and gas used, without broadcasting funds.”

## 1:20–1:55 — Drainer attempt

**Show:** Select Drainer transfer and run it. Highlight destination and spend failures, then ‘RPC not contacted.’

**Say:** “Now the agent is compromised and proposes sending 2,500 USDC to an unknown destination. Intent Firewall independently rejects the destination and the amount. The request stops before the RPC, no signature is created, and spend authority remains unchanged.”

## 1:55–2:20 — Unlimited approval

**Show:** Select Unlimited approval and run it. Highlight the approval failure.

**Say:** “A zero-value transaction can still be dangerous. This request asks for unlimited token approval, so the firewall blocks it even though no immediate transfer value is shown.”

## 2:20–2:45 — Custom edge case

**Show:** Select Custom request. Change one or two fields and rerun.

**Say:** “The prepared demonstrations are locked so their meaning cannot be accidentally changed. Custom mode lets judges test their own combination of action, amount, network, destination and approval scope.”

## 2:45–3:15 — Architecture and close

**Show:** Architecture diagram, then return to the final receipt.

**Say:** “The frontend sends a proposed intent to a server-side validator and deterministic policy engine. Failed requests produce a block receipt immediately. Allowed Base requests continue to a live testnet preflight. The production path would place this engine in front of a policy-controlled signer. Intent Firewall turns wallet security from repeated human warnings into enforceable, inspectable boundaries for autonomous agents.”

## Recording checklist

- Keep the final export between 2 and 4 minutes; ETHGlobal rejects videos outside that range.
- Export at 1080p or at least 720p.
- Use a desktop screen recording and your natural voice.
- Remove loading pauses during editing, but do not speed up the video.
- Keep any intro under 20 seconds.
- Confirm the live demo and repository links are visible in the video description.
