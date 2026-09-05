# Intent Firewall architecture

```mermaid
flowchart LR
    A[AI agent or dApp] -->|Proposed transaction intent| B[Intent Firewall UI]
    P[User-defined policy] --> B
    B -->|POST /api/evaluate| C[Server-side request validation]
    C --> D[Deterministic policy engine]

    D --> R1[Amount is valid]
    D --> R2[Network is allowed]
    D --> R3[Destination is allowlisted]
    D --> R4[Spend remains under limit]
    D --> R5[Approval is not unlimited]

    R1 --> E{All rules pass?}
    R2 --> E
    R3 --> E
    R4 --> E
    R5 --> E

    E -->|No| F[Blocked receipt]
    F --> G[No RPC call and no signature]

    E -->|Yes| H[Base Sepolia eth_simulateV1]
    H -->|RPC available| I[Live preflight proof]
    H -->|RPC unavailable| J[Clearly labelled local fallback]
    I --> K[Eligible-to-sign receipt]
    J --> K
```

## Trust boundary

The prototype evaluates transaction proposals but does not hold keys, connect a wallet, create signatures, broadcast transactions, or move funds. Production protection would require every agent-initiated wallet action to pass through a policy-controlled signer; any transaction path that bypasses that signer is outside the firewall.

## Request lifecycle

1. The agent or dApp proposes an action, amount, network, destination, and approval scope.
2. The server validates the request shape and evaluates five deterministic rules.
3. A failed rule returns a block receipt before any network request.
4. An allowed Base request is simulated against pending Base Sepolia state.
5. The interface shows the policy evidence and execution proof separately, making it clear whether a request was blocked, preflighted, or evaluated using the fallback.
