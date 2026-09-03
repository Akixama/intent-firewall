export type WalletAction = 'transfer' | 'contract_call' | 'token_approval';
export type WalletNetwork = 'base' | 'ethereum' | 'arbitrum';

export type TransactionRequest = {
  action: WalletAction;
  amountUsdc: number;
  network: WalletNetwork;
  recipient: string;
  unlimitedApproval: boolean;
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
};

const spendsFunds = (action: WalletAction) => action === 'transfer' || action === 'contract_call';

export function evaluateTransaction(request: TransactionRequest, policy: WalletPolicy): PolicyEvaluation {
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
  };
}
