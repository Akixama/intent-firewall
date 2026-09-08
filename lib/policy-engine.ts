export type WalletAction = 'transfer' | 'contract_call' | 'token_approval';
export type WalletNetwork = 'base' | 'ethereum' | 'arbitrum';

export type TransactionRequest = {
  action: WalletAction;
  amountUsdc: number;
  network: WalletNetwork;
  recipient: string;
  unlimitedApproval: boolean;
  calldata?: string;
};

export type WalletPolicy = {
  spendLimitUsdc: number;
  spentUsdc: number;
  allowedNetworks: WalletNetwork[];
  allowedRecipients: string[];
  allowUnlimitedApprovals: boolean;
};

export type RuleResult = {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type PolicyEvaluation = {
  verdict: 'allow' | 'block';
  summary: string;
  rules: RuleResult[];
  remainingBeforeUsdc: number;
  remainingAfterUsdc: number;
  calldataInspection: CalldataInspection;
};

export type CalldataInspection = {
  status: 'not-provided' | 'decoded' | 'unsupported' | 'malformed';
  selector?: string;
  method?: 'transfer' | 'approve';
  actualAction?: WalletAction;
  actualRecipient?: string;
  actualAmountUsdc?: number | null;
  actualAmountLabel?: string;
  unlimitedApproval?: boolean;
  mismatches: Array<{
    field: 'action' | 'amount' | 'destination' | 'approval';
    claimed: string;
    actual: string;
    severity: 'critical' | 'warning';
  }>;
  riskSummary?: string;
};

const ERC20_TRANSFER_SELECTOR = '0xa9059cbb';
const ERC20_APPROVE_SELECTOR = '0x095ea7b3';
const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
const recipientAliases: Record<string, string> = {
  'graph-data.eth': '0x2222222222222222222222222222222222222222',
  'verified-provider.eth': '0x3333333333333333333333333333333333333333',
};

function normalizeRecipient(value: string): string {
  const normalized = value.trim().toLowerCase();
  return recipientAliases[normalized] ?? normalized;
}

function inspectCalldata(request: TransactionRequest): CalldataInspection {
  const calldata = request.calldata?.trim().toLowerCase();
  if (!calldata) return { status: 'not-provided', mismatches: [] };
  if (!/^0x[0-9a-f]+$/.test(calldata) || calldata.length < 138) {
    return {
      status: 'malformed',
      mismatches: [{ field: 'action', claimed: request.action, actual: 'malformed calldata', severity: 'critical' }],
      riskSummary: 'The encoded transaction cannot be safely interpreted.',
    };
  }

  const selector = calldata.slice(0, 10);
  if (selector !== ERC20_TRANSFER_SELECTOR && selector !== ERC20_APPROVE_SELECTOR) {
    return {
      status: 'unsupported',
      selector,
      mismatches: [{ field: 'action', claimed: request.action, actual: `unknown selector ${selector}`, severity: 'critical' }],
      riskSummary: 'Unknown calldata is blocked because its effect cannot be matched to the claimed intent.',
    };
  }

  try {
    const recipientWord = calldata.slice(10, 74);
    const amountWord = calldata.slice(74, 138);
    const actualRecipient = `0x${recipientWord.slice(24)}`;
    const amountRaw = BigInt(`0x${amountWord}`);
    const method = selector === ERC20_APPROVE_SELECTOR ? 'approve' : 'transfer';
    const actualAction: WalletAction = method === 'approve' ? 'token_approval' : 'transfer';
    const unlimitedApproval = method === 'approve' && amountRaw === MAX_UINT256;
    const actualAmountUsdc = unlimitedApproval ? null : Number(amountRaw) / 1_000_000;
    const actualAmountLabel = actualAmountUsdc === null ? 'Unlimited' : `${actualAmountUsdc.toLocaleString()} USDC`;
    const mismatches: CalldataInspection['mismatches'] = [];

    if (request.action !== actualAction) {
      mismatches.push({ field: 'action', claimed: request.action, actual: actualAction, severity: 'critical' });
    }
    if (normalizeRecipient(request.recipient) !== normalizeRecipient(actualRecipient)) {
      mismatches.push({ field: 'destination', claimed: request.recipient, actual: actualRecipient, severity: 'critical' });
    }
    if (unlimitedApproval || actualAmountUsdc !== request.amountUsdc) {
      mismatches.push({
        field: 'amount',
        claimed: `${request.amountUsdc.toLocaleString()} USDC`,
        actual: actualAmountLabel,
        severity: unlimitedApproval ? 'critical' : 'warning',
      });
    }
    if (request.unlimitedApproval !== unlimitedApproval) {
      mismatches.push({
        field: 'approval',
        claimed: request.unlimitedApproval ? 'unlimited' : 'none',
        actual: unlimitedApproval ? 'unlimited' : 'exact amount',
        severity: 'critical',
      });
    }

    return {
      status: 'decoded',
      selector,
      method,
      actualAction,
      actualRecipient,
      actualAmountUsdc,
      actualAmountLabel,
      unlimitedApproval,
      mismatches,
      riskSummary: unlimitedApproval
        ? 'Unlimited approval could expose the wallet’s current and future token balance until revoked.'
        : mismatches.length > 0
          ? 'The encoded transaction does not match the authority the user intended to grant.'
          : 'Decoded calldata matches the claimed transaction intent.',
    };
  } catch {
    return {
      status: 'malformed',
      selector,
      mismatches: [{ field: 'action', claimed: request.action, actual: 'malformed calldata', severity: 'critical' }],
      riskSummary: 'The encoded transaction cannot be safely interpreted.',
    };
  }
}

const spendsFunds = (action: WalletAction) => action === 'transfer' || action === 'contract_call';

export function evaluateTransaction(request: TransactionRequest, policy: WalletPolicy): PolicyEvaluation {
  const calldataInspection = inspectCalldata(request);
  const remainingBeforeUsdc = Math.max(0, policy.spendLimitUsdc - policy.spentUsdc);
  const amountIsValid = Number.isFinite(request.amountUsdc) && request.amountUsdc >= 0;
  const networkIsAllowed = policy.allowedNetworks.includes(request.network);
  const recipientIsAllowed = policy.allowedRecipients.includes(request.recipient.trim().toLowerCase());
  const requestedSpend = spendsFunds(request.action) && amountIsValid ? request.amountUsdc : 0;
  const spendIsAllowed = requestedSpend <= remainingBeforeUsdc;
  const approvalIsAllowed = !(
    request.action === 'token_approval' &&
    request.unlimitedApproval &&
    !policy.allowUnlimitedApprovals
  );
  const calldataMatchesIntent = calldataInspection.mismatches.length === 0;

  const rules: RuleResult[] = [
    {
      id: 'amount',
      label: 'Valid transaction amount',
      passed: amountIsValid,
      detail: amountIsValid ? `${request.amountUsdc.toLocaleString()} USDC parsed` : 'Amount must be zero or greater',
    },
    {
      id: 'network',
      label: 'Approved network',
      passed: networkIsAllowed,
      detail: networkIsAllowed ? `${request.network} is allowed` : `${request.network} is outside this policy`,
    },
    {
      id: 'recipient',
      label: 'Destination allowlist',
      passed: recipientIsAllowed,
      detail: recipientIsAllowed ? `${request.recipient} matched` : `${request.recipient || 'Empty destination'} is not approved`,
    },
    {
      id: 'spend',
      label: 'Remaining spend authority',
      passed: spendIsAllowed,
      detail: spendIsAllowed
        ? `${remainingBeforeUsdc.toLocaleString()} USDC available`
        : `Request exceeds the remainder by ${(requestedSpend - remainingBeforeUsdc).toLocaleString()} USDC`,
    },
    {
      id: 'approval',
      label: 'Exact token approval',
      passed: approvalIsAllowed,
      detail: approvalIsAllowed ? 'No unlimited approval requested' : 'Unlimited approvals are disabled',
    },
    {
      id: 'calldata',
      label: 'Claim matches calldata',
      passed: calldataMatchesIntent,
      detail: calldataInspection.status === 'not-provided'
        ? 'No raw calldata supplied; structured intent evaluated'
        : calldataMatchesIntent
          ? `${calldataInspection.method} calldata matches the claimed intent`
          : `${calldataInspection.mismatches.length} encoded ${calldataInspection.mismatches.length === 1 ? 'mismatch' : 'mismatches'} detected`,
    },
  ];

  const failedRules = rules.filter((rule) => !rule.passed);
  const verdict = failedRules.length === 0 ? 'allow' : 'block';

  return {
    verdict,
    summary: verdict === 'allow'
      ? 'All policy checks passed. This request is eligible for signing.'
      : `${failedRules.length} ${failedRules.length === 1 ? 'rule' : 'rules'} blocked this request.`,
    rules,
    remainingBeforeUsdc,
    remainingAfterUsdc: verdict === 'allow' ? remainingBeforeUsdc - requestedSpend : remainingBeforeUsdc,
    calldataInspection,
  };
}
