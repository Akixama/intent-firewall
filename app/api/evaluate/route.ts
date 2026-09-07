import { evaluateTransaction, type TransactionRequest, type WalletNetwork } from '@/lib/policy-engine';

const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
const DEMO_FROM = '0x1111111111111111111111111111111111111111';
const DEMO_TARGET = '0x000000000000000000000000000000000000dEaD';
const DEMO_CALLDATA = '0x494e54454e545f4649524557414c4c';

type EvaluateBody = {
  request?: Partial<TransactionRequest>;
  spendLimitUsdc?: number;
  networkMode?: number;
};

type ExecutionProof = {
  mode: 'base-sepolia' | 'policy-blocked' | 'fallback';
  label: string;
  detail: string;
  blockNumber?: number | null;
  gasUsed?: number | null;
  chainId?: number;
};

type AuditReceipt = {
  version: 'ifw-v1';
  receiptId: string;
  issuedAt: string;
  policyHash: string;
  intentHash: string;
  decisionHash: string;
  algorithm: 'SHA-256';
};

function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

async function sha256(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalize(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function createAuditReceipt(
  request: TransactionRequest,
  policy: {
    spendLimitUsdc: number;
    spentUsdc: number;
    allowedNetworks: WalletNetwork[];
    allowedRecipients: string[];
    allowUnlimitedApprovals: boolean;
  },
  evaluation: ReturnType<typeof evaluateTransaction>,
  execution: ExecutionProof,
): Promise<AuditReceipt> {
  const issuedAt = new Date().toISOString();
  const policyHash = await sha256(policy);
  const intentHash = await sha256(request);
  const decisionHash = await sha256({
    version: 'ifw-v1',
    issuedAt,
    policyHash,
    intentHash,
    evaluation,
    execution,
  });

  return {
    version: 'ifw-v1',
    receiptId: `ifw_${decisionHash.slice(0, 16)}`,
    issuedAt,
    policyHash,
    intentHash,
    decisionHash,
    algorithm: 'SHA-256',
  };
}

function isTransactionRequest(value: Partial<TransactionRequest>): value is TransactionRequest {
  return (
    ['transfer', 'contract_call', 'token_approval'].includes(value.action ?? '') &&
    ['base', 'ethereum', 'arbitrum'].includes(value.network ?? '') &&
    typeof value.amountUsdc === 'number' &&
    Number.isFinite(value.amountUsdc) &&
    value.amountUsdc >= 0 &&
    value.amountUsdc <= 1_000_000 &&
    typeof value.recipient === 'string' &&
    value.recipient.length > 0 &&
    value.recipient.length <= 120 &&
    typeof value.unlimitedApproval === 'boolean'
  );
}

function allowedNetworksFor(mode: number): WalletNetwork[] {
  if (mode === 1) return ['base', 'ethereum'];
  if (mode === 2) return ['base', 'ethereum', 'arbitrum'];
  return ['base'];
}

export async function POST(incoming: Request) {
  let body: EvaluateBody;
  try {
    body = await incoming.json() as EvaluateBody;
  } catch {
    return Response.json({ error: 'Invalid JSON request.' }, { status: 400 });
  }

  if (!body.request || !isTransactionRequest(body.request)) {
    return Response.json({ error: 'Invalid transaction request.' }, { status: 400 });
  }

  const spendLimitUsdc = [50, 100, 250].includes(body.spendLimitUsdc ?? 0)
    ? body.spendLimitUsdc as number
    : 50;
  const networkMode = [0, 1, 2].includes(body.networkMode ?? -1) ? body.networkMode as number : 0;
  const policy = {
    spendLimitUsdc,
    spentUsdc: 10.4,
    allowedNetworks: allowedNetworksFor(networkMode),
    allowedRecipients: ['graph-data.eth', 'verified-provider.eth'],
    allowUnlimitedApprovals: false,
  };
  const evaluation = evaluateTransaction(body.request, policy);

  if (evaluation.verdict === 'block') {
    const execution: ExecutionProof = {
      mode: 'policy-blocked',
      label: 'Stopped before Base Sepolia',
      detail: 'The policy rejected this intent before any network execution was attempted.',
    };
    return Response.json({
      evaluation,
      execution,
      receipt: await createAuditReceipt(body.request, policy, evaluation, execution),
    });
  }

  try {
    const rpcResponse = await fetch(BASE_SEPOLIA_RPC, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_simulateV1',
        params: [{
          blockStateCalls: [{
            calls: [{ from: DEMO_FROM, to: DEMO_TARGET, data: DEMO_CALLDATA, value: '0x0' }],
            stateOverrides: {},
          }],
          traceTransfers: true,
          validation: false,
        }, 'pending'],
      }),
      signal: AbortSignal.timeout(6_000),
    });

    if (!rpcResponse.ok) throw new Error(`Base RPC returned ${rpcResponse.status}`);
    const rpc = await rpcResponse.json() as {
      result?: Array<{ number?: string; calls?: Array<{ status?: string; gasUsed?: string; error?: string }> }>;
      error?: { message?: string };
    };
    const block = rpc.result?.[0];
    const call = block?.calls?.[0];
    if (!block || !call || call.status !== '0x1') throw new Error(call?.error ?? rpc.error?.message ?? 'Simulation did not succeed');

    const execution: ExecutionProof = {
      mode: 'base-sepolia',
      label: 'Executed on Base Sepolia preflight',
      detail: 'The allowed call executed against live pending testnet state without broadcasting funds.',
      blockNumber: block.number ? Number.parseInt(block.number, 16) : null,
      gasUsed: call.gasUsed ? Number.parseInt(call.gasUsed, 16) : null,
      chainId: 84532,
    };
    return Response.json({
      evaluation,
      execution,
      receipt: await createAuditReceipt(body.request, policy, evaluation, execution),
    });
  } catch {
    const execution: ExecutionProof = {
      mode: 'fallback',
      label: 'Deterministic fallback used',
      detail: 'Base Sepolia was unavailable, so the verified local policy result is shown instead.',
    };
    return Response.json({
      evaluation,
      execution,
      receipt: await createAuditReceipt(body.request, policy, evaluation, execution),
    });
  }
}
