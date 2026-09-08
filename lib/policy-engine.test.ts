import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateTransaction, type WalletPolicy } from './policy-engine.ts';

const policy: WalletPolicy = {
  spendLimitUsdc: 50,
  spentUsdc: 10.4,
  allowedNetworks: ['base'],
  allowedRecipients: ['graph-data.eth', 'verified-provider.eth'],
  allowUnlimitedApprovals: false,
};

const encodeCall = (selector: string, recipient: string, amount: string) =>
  `${selector}${'0'.repeat(24)}${recipient.slice(2)}${amount.padStart(64, '0')}`;

void test('blocks an approval hidden behind a claimed data payment', () => {
  const calldata = encodeCall(
    '0x095ea7b3',
    '0x71f0000000000000000000000000000000009c21',
    'f'.repeat(64),
  );
  const result = evaluateTransaction({
    action: 'contract_call',
    amountUsdc: 7,
    network: 'base',
    recipient: 'graph-data.eth',
    unlimitedApproval: false,
    calldata,
  }, policy);

  assert.equal(result.verdict, 'block');
  assert.equal(result.calldataInspection.method, 'approve');
  assert.equal(result.calldataInspection.unlimitedApproval, true);
  assert.equal(result.calldataInspection.mismatches.length, 4);
  assert.equal(result.rules.find((rule) => rule.id === 'calldata')?.passed, false);
});

void test('allows decoded transfer calldata that matches the claimed intent', () => {
  const calldata = encodeCall(
    '0xa9059cbb',
    '0x2222222222222222222222222222222222222222',
    (8_000_000).toString(16),
  );
  const result = evaluateTransaction({
    action: 'transfer',
    amountUsdc: 8,
    network: 'base',
    recipient: 'graph-data.eth',
    unlimitedApproval: false,
    calldata,
  }, policy);

  assert.equal(result.verdict, 'allow');
  assert.equal(result.calldataInspection.method, 'transfer');
  assert.equal(result.calldataInspection.mismatches.length, 0);
  assert.equal(result.rules.find((rule) => rule.id === 'calldata')?.passed, true);
});

void test('fails closed on an unsupported function selector', () => {
  const result = evaluateTransaction({
    action: 'contract_call',
    amountUsdc: 1,
    network: 'base',
    recipient: 'graph-data.eth',
    unlimitedApproval: false,
    calldata: `0xdeadbeef${'0'.repeat(128)}`,
  }, policy);

  assert.equal(result.verdict, 'block');
  assert.equal(result.calldataInspection.status, 'unsupported');
});
