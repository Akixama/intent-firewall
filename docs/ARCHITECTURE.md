# Intent Firewall architecture

```mermaid
flowchart LR
    A[AI agent or dApp] -->|Proposed transaction intent| B[Intent Firewall UI]
    P[User-defined policy] --> B
    B -->|POST /api/evaluate| C[Server-side request validation]
    C --> X[ERC-20 calldata decoder]
    X --> Y{Claim matches decoded call?}
    Y -->|No| F[Blocked receipt]
    Y -->|Yes or no calldata| D[Deterministic policy engine]

    D --> R1[Amount is valid]
    D --> R2[Network is allowed]
    D --> R3[Destination is allowlisted]
    D --> R4[Spend remains under limit]
    D --> R5[Approval is not unlimited]
    D --> R6[Claim matches calldata]

    R1 --> E{All rules pass?}
    R2 --> E
    R3 --> E
    R4 --> E
    R5 --> E
    R6 --> E

    E -->|No| F[Blocked receipt]
    F --> G[No RPC call and no signature]

    E -->|Yes| H[Base Sepolia eth_simulateV1]
    H -->|RPC available| I[Live preflight proof]
    H -->|RPC unavailable| J[Clearly labelled local fallback]
    I --> K[Eligible-to-sign receipt]
    J --> K
    F --> L[SHA-256 audit receipt]
    K --> L
    L --> M[Portable JSON proof]
```

## Trust boundary

The prototype evaluates transaction proposals but does not hold keys, connect a wallet, create signatures, broadcast transactions, or move funds. Production protection would require every agent-initiated wallet action to pass through a policy-controlled signer; any transaction path that bypasses that signer is outside the firewall.

## Request lifecycle

1. The agent or dApp proposes a claimed action, amount, network, destination, approval scope, and optional raw calldata.
2. The server validates the request and deterministically decodes supported ERC-20 `transfer` and `approve` calldata.
3. The decoder compares action, destination, amount and approval scope with the agent’s claim. Malformed, unsupported or mismatched calldata fails closed.
4. The policy engine evaluates six deterministic rules.
5. A failed rule returns a block receipt before any network request.
6. An allowed Base request is simulated against pending Base Sepolia state.
7. The server canonicalizes the policy, claim, calldata, evaluation and execution evidence into an `ifw-v1` audit receipt.
8. The interface shows the claimed-versus-decoded comparison, risk consequence, intervention trail, rule evidence, execution outcome and portable proof.

## Audit receipt boundary

The receipt provides reproducible SHA-256 integrity fingerprints for the decision content. It is not a wallet signature and does not prove the identity of the server. A production system can anchor or sign the same decision hash through its policy-controlled signer.
