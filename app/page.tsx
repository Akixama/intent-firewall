'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, Check, ChevronDown, CircleAlert, CircleCheck, Clock3,
  Code2, Fingerprint, KeyRound, LockKeyhole, Pause, Play,
  ShieldCheck, Sparkles, WalletCards, X, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  evaluateTransaction,
  type PolicyEvaluation,
  type TransactionRequest,
  type WalletNetwork,
} from '@/lib/policy-engine';

type DemoState = 'ready' | 'checking' | 'allowed' | 'blocked';

const activity = [
  { icon: CircleCheck, title: 'Research API payment', detail: '8.00 USDC · graph-data.eth', meta: 'Approved · 2m ago', tone: 'safe' },
  { icon: CircleCheck, title: 'Inference request', detail: '2.40 USDC · verified provider', meta: 'Approved · 18m ago', tone: 'safe' },
  { icon: CircleAlert, title: 'Unknown transfer', detail: '2,500 USDC · 0x71F…9C21', meta: 'Blocked · 34m ago', tone: 'danger' },
];

const spendOptions = ['50 USDC', '100 USDC', '250 USDC'];
const periodOptions = ['per day', 'per week', 'per transaction'];
const networkOptions = ['Base only', 'Ethereum + Base', 'approved networks'];

const scenarios: { id: string; label: string; request: TransactionRequest }[] = [
  { id: 'safe', label: 'Safe API payment', request: { action: 'contract_call', amountUsdc: 8, network: 'base', recipient: 'graph-data.eth', unlimitedApproval: false } },
  { id: 'drainer', label: 'Drainer transfer', request: { action: 'transfer', amountUsdc: 2500, network: 'base', recipient: '0x71F...9C21', unlimitedApproval: false } },
  { id: 'approval', label: 'Unlimited approval', request: { action: 'token_approval', amountUsdc: 0, network: 'base', recipient: 'verified-provider.eth', unlimitedApproval: true } },
  { id: 'network', label: 'Wrong network', request: { action: 'contract_call', amountUsdc: 2.4, network: 'arbitrum', recipient: 'graph-data.eth', unlimitedApproval: false } },
];

export default function Home() {
  const [demoState, setDemoState] = useState<DemoState>('ready');
  const [spendIndex, setSpendIndex] = useState(0);
  const [periodIndex, setPeriodIndex] = useState(0);
  const [networkIndex, setNetworkIndex] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [boundaryConfirmed, setBoundaryConfirmed] = useState(false);
  const [policyActive, setPolicyActive] = useState(false);
  const [scenarioId, setScenarioId] = useState('drainer');
  const [request, setRequest] = useState<TransactionRequest>(scenarios[1].request);
  const [evaluation, setEvaluation] = useState<PolicyEvaluation | null>(null);
  const demoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reviewDialog = useRef<HTMLDialogElement | null>(null);

  useEffect(() => () => {
    if (demoTimer.current) clearTimeout(demoTimer.current);
  }, []);

  useEffect(() => {
    const dialog = reviewDialog.current;
    if (!dialog) return;
    if (reviewOpen && !dialog.open) dialog.showModal();
    if (!reviewOpen && dialog.open) dialog.close();
  }, [reviewOpen]);

  useEffect(() => {
    type PolicyInput = { spendLimit: string; period: string; network: string };
    type ModelContext = { registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void> };
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();

    const registration = context.registerTool({
      name: 'configure_agent_policy',
      title: 'Configure agent wallet policy',
      description: 'Configure and visibly stage the spending limit, reset period, and allowed network for the Research Agent.',
      inputSchema: {
        type: 'object',
        properties: {
          spendLimit: { type: 'string', enum: spendOptions },
          period: { type: 'string', enum: periodOptions },
          network: { type: 'string', enum: networkOptions },
        },
        required: ['spendLimit', 'period', 'network'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const value = input as PolicyInput;
        const spend = spendOptions.indexOf(value.spendLimit);
        const period = periodOptions.indexOf(value.period);
        const network = networkOptions.indexOf(value.network);
        if (spend < 0 || period < 0 || network < 0) throw new Error('Invalid policy option.');
        setSpendIndex(spend); setPeriodIndex(period); setNetworkIndex(network);
        document.getElementById('policy')?.scrollIntoView({ behavior: 'smooth' });
        return { status: 'staged', spendLimit: value.spendLimit, period: value.period, network: value.network };
      },
    }, { signal: lifecycle.signal });

    void Promise.resolve(registration).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  function selectScenario(id: string) {
    const scenario = scenarios.find((item) => item.id === id);
    if (!scenario) return;
    if (demoTimer.current) clearTimeout(demoTimer.current);
    setScenarioId(id);
    setRequest({ ...scenario.request });
    setEvaluation(null);
    setDemoState('ready');
  }

  function updateRequest(patch: Partial<TransactionRequest>) {
    if (demoTimer.current) clearTimeout(demoTimer.current);
    setScenarioId('custom');
    setRequest((current) => ({ ...current, ...patch }));
    setEvaluation(null);
    setDemoState('ready');
  }

  function runDemo() {
    if (demoTimer.current) clearTimeout(demoTimer.current);
    setDemoState('checking');
    const spendLimitUsdc = Number.parseFloat(spendOptions[spendIndex]);
    const allowedNetworks: WalletNetwork[] = networkIndex === 0
      ? ['base']
      : networkIndex === 1
        ? ['base', 'ethereum']
        : ['base', 'ethereum', 'arbitrum'];
    demoTimer.current = setTimeout(() => {
      const result = evaluateTransaction(request, {
        spendLimitUsdc,
        spentUsdc: 10.4,
        allowedNetworks,
        allowedRecipients: ['graph-data.eth', 'verified-provider.eth'],
        allowUnlimitedApprovals: false,
      });
      setEvaluation(result);
      setDemoState(result.verdict === 'allow' ? 'allowed' : 'blocked');
    }, 650);
  }

  function activatePolicy() {
    if (!boundaryConfirmed) return;
    setPolicyActive(true);
    setReviewOpen(false);
  }

  return (
    <main>
      <div className="site-shell">
        <nav className="top-nav" aria-label="Primary navigation">
          <a href="#top" className="brand" aria-label="Intent Firewall home">
            <span className="brand-mark"><ShieldCheck size={17} strokeWidth={2.3} /></span>
            <span>Intent Firewall</span>
          </a>
          <div className="nav-links">
            <a href="#product">Product</a><a href="#demo">Live demo</a><a href="#policy">Policies</a><a href="#how">How it works</a>
          </div>
          <Button className="nav-cta" onClick={() => scrollTo('policy')}>Build a policy <ArrowRight size={15} /></Button>
        </nav>

        <section id="top" className="hero">
          <div className="eyebrow"><span className="pulse-dot" /> Guardrails for agentic wallets</div>
          <h1>Give your agent access.<br /><span>Not control.</span></h1>
          <p className="hero-copy">Define exactly what an AI agent can spend, call, and approve. Safe actions flow. Everything else stops before signing.</p>
          <div className="hero-actions">
            <Button size="lg" onClick={() => scrollTo('policy')}>Create a policy <ArrowRight size={16} /></Button>
            <Button size="lg" variant="outline" onClick={() => scrollTo('demo')}><Play size={15} fill="currentColor" /> Watch attack demo</Button>
          </div>
        </section>

        <section id="product" className="product-stage" aria-label="Intent Firewall product preview">
          <div className="proof-pill">
            <div className="avatar-stack" aria-hidden="true"><span>AI</span><span><KeyRound size={13} /></span><span><ShieldCheck size={13} /></span></div>
            <div><strong>Sample session</strong><small>3 simulated actions below</small></div>
          </div>

          <div className="app-window">
            <div className="app-topbar">
              <div className="app-title"><span className="status-orb"><ShieldCheck size={15} /></span><div><strong>Research Agent</strong><small>Wallet 0x8B2…71A4</small></div></div>
              <div className="protected-badge"><span /> Protection active</div>
              <button className="icon-button" aria-label="Pause agent"><Pause size={16} /></button>
            </div>
            <div className="app-grid">
              <div className="activity-panel">
                <div className="panel-heading"><div><small>ACTIVITY</small><h2>Every action, accounted for.</h2></div><button>View all <ArrowRight size={13} /></button></div>
                <div className="activity-list">
                  {activity.map((item) => (
                    <div className="activity-row" key={item.title}>
                      <span className={`activity-icon ${item.tone}`}><item.icon size={16} /></span>
                      <div><strong>{item.title}</strong><small>{item.detail}</small></div>
                      <span className={`activity-meta ${item.tone}`}>{item.meta}</span>
                    </div>
                  ))}
                </div>
              </div>
              <aside className="budget-panel">
                <div className="budget-top"><small>DAILY AUTHORITY</small><span><Clock3 size={13} /> resets in 8h</span></div>
                <div className="budget-value"><strong>$10.40</strong><span>of $50.00</span></div>
                <Progress value={20.8} aria-label="Daily budget used" />
                <div className="rule-list">
                  <div><span><WalletCards size={15} /> Spending cap</span><strong>50 USDC / day</strong></div>
                  <div><span><LockKeyhole size={15} /> Contracts</span><strong>Allowlist only</strong></div>
                  <div><span><Zap size={15} /> Approvals</span><strong>Exact amounts</strong></div>
                </div>
                <button className="text-button" onClick={() => scrollTo('policy')}>Review policy <ArrowRight size={13} /></button>
              </aside>
            </div>
          </div>
        </section>

        <section className="intro-section">
          <div className="section-kicker">SECURITY, WITHOUT THE BABYSITTING</div>
          <h2>Your agent can move fast.<br />Your rules move faster.</h2>
          <p>Wallet warnings ask you to make the right decision every time. Intent Firewall makes the decision once, then enforces it every time.</p>
          <div className="feature-grid">
            <article><span><Fingerprint size={20} /></span><h3>Plain-language intent</h3><p>Describe the job. We turn it into a policy you can inspect before it becomes active.</p></article>
            <article><span><ShieldCheck size={20} /></span><h3>Enforced at signing</h3><p>Unsafe calls never receive a signature. A compromised agent cannot talk its way around the rules.</p></article>
            <article><span><Code2 size={20} /></span><h3>Receipts, not mystery</h3><p>Every decision shows the requested call, evaluated rule, data source, and final outcome.</p></article>
          </div>
          <div className="boundary-note">
            <LockKeyhole size={18} />
            <p><strong>The protection boundary matters.</strong> Intent Firewall can stop drainers only when every wallet action is routed through its policy-controlled signer. It cannot protect keys or approvals that bypass that boundary.</p>
          </div>
        </section>

        <section id="demo" className="demo-section">
          <div className="demo-copy">
            <div className="dark-kicker"><span /> LIVE PROTECTION TEST</div>
            <h2>Test the boundary yourself.</h2>
            <p>Choose a request or edit its transaction fields. The same deterministic engine evaluates every attempt against the policy below.</p>
            <div className="scenario-tabs" aria-label="Transaction presets">
              {scenarios.map((scenario) => <button key={scenario.id} className={scenarioId === scenario.id ? 'selected' : ''} onClick={() => selectScenario(scenario.id)}>{scenario.label}</button>)}
            </div>
            <div className="request-fields">
              <label><span>Action</span><select value={request.action} onChange={(event) => updateRequest({ action: event.target.value as TransactionRequest['action'] })}><option value="transfer">Transfer</option><option value="contract_call">Contract call</option><option value="token_approval">Token approval</option></select></label>
              <label><span>Amount (USDC)</span><input type="number" min="0" step="0.1" value={request.amountUsdc} onChange={(event) => updateRequest({ amountUsdc: Number(event.target.value) })} /></label>
              <label><span>Network</span><select value={request.network} onChange={(event) => updateRequest({ network: event.target.value as WalletNetwork })}><option value="base">Base</option><option value="ethereum">Ethereum</option><option value="arbitrum">Arbitrum</option></select></label>
              <label><span>Destination</span><input value={request.recipient} onChange={(event) => updateRequest({ recipient: event.target.value })} /></label>
            </div>
            {request.action === 'token_approval' && <label className="unlimited-toggle"><input type="checkbox" checked={request.unlimitedApproval} onChange={(event) => updateRequest({ unlimitedApproval: event.target.checked })} /><span>Request unlimited token approval</span></label>}
            <Button className="demo-button" onClick={runDemo} disabled={demoState === 'checking'}>
              {demoState === 'checking' ? <><span className="spinner" /> Evaluating policy</> : <><Play size={15} fill="currentColor" /> Evaluate transaction</>}
            </Button>
          </div>
          <div className={`demo-console ${demoState}`} aria-live="polite">
            <div className="console-bar"><span>Deterministic intent receipt</span><code>{request.network} / {request.action}</code></div>
            <div className="console-body">
              <div className="request-payload"><small>REQUESTED INTENT</small><code>{request.action}({request.recipient || 'no destination'}, {request.amountUsdc.toLocaleString()} USDC)</code></div>
              {evaluation ? <>
                <div className="receipt-rules">
                  {evaluation.rules.map((rule, index) => <div className={rule.passed ? 'passed' : 'failed'} key={rule.id}><span>{rule.passed ? <Check size={13} /> : <X size={13} />}</span><div><strong>{index + 1}. {rule.label}</strong><small>{rule.detail}</small></div><em>{rule.passed ? 'pass' : 'fail'}</em></div>)}
                </div>
                <div className={`verdict-result ${evaluation.verdict}`}>
                  <span>{evaluation.verdict === 'allow' ? <Check size={17} /> : <X size={17} />}</span>
                  <div><small>{evaluation.verdict === 'allow' ? 'ELIGIBLE TO SIGN' : 'TRANSACTION BLOCKED'}</small><strong>{evaluation.summary}</strong><p>{evaluation.verdict === 'allow' ? `Remaining authority after signing: ${evaluation.remainingAfterUsdc.toLocaleString()} USDC.` : 'No signature created. Spend authority is unchanged.'}</p></div>
                </div>
              </> : <div className="console-placeholder"><LockKeyhole size={17} /><span>{demoState === 'checking' ? 'Evaluating five policy rules…' : 'Edit the request, then evaluate it against the active policy.'}</span></div>}
            </div>
          </div>
        </section>

        <section id="policy" className="policy-section">
          <div className="policy-heading"><div><div className="section-kicker">POLICY COMPOSER</div><h2>Say what the agent may do.<br />We’ll make it enforceable.</h2></div><p>Natural language makes the policy easy to write. Deterministic rules make it safe to trust.</p></div>
          <div className={`policy-card ${policyActive ? 'is-active' : ''}`}>
            <div className="composer-label"><Sparkles size={15} /> Research Agent policy {policyActive && <span className="active-policy-badge"><Check size={12} /> Demo active</span>}</div>
            <p className="policy-sentence">
              This agent may purchase verified data services using up to{' '}
              <button onClick={() => setSpendIndex((spendIndex + 1) % spendOptions.length)}>{spendOptions[spendIndex]} <ChevronDown size={16} /></button>{' '}
              <button onClick={() => setPeriodIndex((periodIndex + 1) % periodOptions.length)}>{periodOptions[periodIndex]} <ChevronDown size={16} /></button>, only on{' '}
              <button onClick={() => setNetworkIndex((networkIndex + 1) % networkOptions.length)}>{networkOptions[networkIndex]} <ChevronDown size={16} /></button>, and must never grant unlimited token approvals.
            </p>
            <div className="policy-footer">
              <div><span><Check size={13} /> 6 deterministic rules</span><span><Clock3 size={13} /> Expires Sep 13</span><span><KeyRound size={13} /> User confirmation required</span></div>
              <Button onClick={() => { setBoundaryConfirmed(false); setReviewOpen(true); }}>{policyActive ? 'Review active policy' : 'Review rules'} <ArrowRight size={15} /></Button>
            </div>
            {policyActive && <div className="activation-receipt" role="status"><ShieldCheck size={17} /><div><strong>Demo policy activated</strong><span>Future simulated requests will be evaluated before signing.</span></div><small>Just now</small></div>}
          </div>
        </section>

        <section id="how" className="how-section">
          <div className="section-kicker">THE CONTROL LOOP</div>
          <h2>Set the boundary once.<br />Stay in control continuously.</h2>
          <div className="steps">
            <article><span>01</span><div><h3>Define the job</h3><p>Give the agent a purpose, budget, approved tools, and an expiration date.</p></div></article>
            <article><span>02</span><div><h3>Verify the rules</h3><p>Review the exact wallet policy. Nothing activates from an AI suggestion alone.</p></div></article>
            <article><span>03</span><div><h3>Let safe work flow</h3><p>Routine actions execute. Exceptions stop and arrive with a complete intent receipt.</p></div></article>
          </div>
        </section>

        <section className="closing-section">
          <div className="closing-badge"><ShieldCheck size={24} /></div>
          <h2>Your agent has a goal.<br />Now give it boundaries.</h2>
          <p>Move from manual approvals to controlled autonomy.</p>
          <Button size="lg" onClick={() => scrollTo('policy')}>Build your first policy <ArrowRight size={16} /></Button>
        </section>

        <footer>
          <a href="#top" className="brand"><span className="brand-mark"><ShieldCheck size={17} /></span><span>Intent Firewall</span></a>
          <p>Enforceable boundaries for agentic wallets.</p>
          <div><a href="#product">Product</a><a href="#demo">Demo</a><a href="#policy">Policies</a></div>
        </footer>
      </div>

      <dialog ref={reviewDialog} className="policy-dialog" onClose={() => setReviewOpen(false)} onCancel={() => setReviewOpen(false)}>
          <button className="native-dialog-close" aria-label="Close policy review" onClick={() => setReviewOpen(false)}><X size={17} /></button>
          <div className="policy-dialog-header">
            <div className="dialog-icon"><ShieldCheck size={20} /></div>
            <h2>Review the signing boundary</h2>
            <p>These deterministic rules would be checked before the Research Agent receives a signature.</p>
          </div>
          <div className="review-summary">
            <div><span>Spend authority</span><strong>{spendOptions[spendIndex]} {periodOptions[periodIndex]}</strong></div>
            <div><span>Allowed network</span><strong>{networkOptions[networkIndex]}</strong></div>
            <div><span>Token approvals</span><strong>Exact amounts only</strong></div>
          </div>
          <div className="review-rules" aria-label="Rules to activate">
            <div><Check size={14} /><span>Reject transfers above the remaining limit</span></div>
            <div><Check size={14} /><span>Reject unapproved networks and contracts</span></div>
            <div><Check size={14} /><span>Reject unlimited token approvals</span></div>
          </div>
          <label className="boundary-confirmation">
            <input type="checkbox" checked={boundaryConfirmed} onChange={(event) => setBoundaryConfirmed(event.target.checked)} />
            <span>I understand this protects only requests routed through the policy-controlled signer.</span>
          </label>
          <div className="dialog-disclosure"><CircleAlert size={15} /><p>This prototype stages a demo policy. It does not connect to or control a real wallet.</p></div>
          <div className="policy-dialog-footer">
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
            <Button onClick={activatePolicy} disabled={!boundaryConfirmed}>{policyActive ? 'Confirm policy again' : 'Activate demo policy'} <ArrowRight size={14} /></Button>
          </div>
      </dialog>
    </main>
  );
}
