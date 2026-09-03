'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, Check, ChevronDown, CircleAlert, CircleCheck, Clock3,
  Code2, Fingerprint, KeyRound, LockKeyhole, Pause, Play,
  ShieldCheck, Sparkles, WalletCards, X, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

type DemoState = 'ready' | 'checking' | 'blocked';

const activity = [
  { icon: CircleCheck, title: 'Research API payment', detail: '8.00 USDC · graph-data.eth', meta: 'Approved · 2m ago', tone: 'safe' },
  { icon: CircleCheck, title: 'Inference request', detail: '2.40 USDC · verified provider', meta: 'Approved · 18m ago', tone: 'safe' },
  { icon: CircleAlert, title: 'Unknown transfer', detail: '2,500 USDC · 0x71F…9C21', meta: 'Blocked · 34m ago', tone: 'danger' },
];

const spendOptions = ['50 USDC', '100 USDC', '250 USDC'];
const periodOptions = ['per day', 'per week', 'per transaction'];
const networkOptions = ['Base only', 'Ethereum + Base', 'approved networks'];

export default function Home() {
  const [demoState, setDemoState] = useState<DemoState>('ready');
  const [spendIndex, setSpendIndex] = useState(0);
  const [periodIndex, setPeriodIndex] = useState(0);
  const [networkIndex, setNetworkIndex] = useState(0);
  const demoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (demoTimer.current) clearTimeout(demoTimer.current);
  }, []);

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

  function runDemo() {
    if (demoTimer.current) clearTimeout(demoTimer.current);
    setDemoState('checking');
    demoTimer.current = setTimeout(() => setDemoState('blocked'), 1100);
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
            <div><strong>1,284</strong><small>agent actions checked</small></div>
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
        </section>

        <section id="demo" className="demo-section">
          <div className="demo-copy">
            <div className="dark-kicker"><span /> LIVE PROTECTION TEST</div>
            <h2>Watch a compromised agent fail safely.</h2>
            <p>A malicious tool attempts to override the agent’s task and empty its wallet. The request reaches the policy boundary—and goes no further.</p>
            <Button className="demo-button" onClick={runDemo} disabled={demoState === 'checking'}>
              {demoState === 'checking' ? <><span className="spinner" /> Inspecting request</> : <><Play size={15} fill="currentColor" /> Run compromise test</>}
            </Button>
          </div>
          <div className={`demo-console ${demoState}`} aria-live="polite">
            <div className="console-bar"><span>Intent receipt</span><div><i /><i /><i /></div></div>
            <div className="console-body">
              <div className="console-row muted"><span>01</span><code>Agent requested research_data()</code><em>allowed</em></div>
              <div className="console-row muted"><span>02</span><code>Tool response contains hidden instruction</code><em>detected</em></div>
              <div className={`console-row ${demoState !== 'ready' ? 'active' : ''}`}><span>03</span><code>transfer(0x71F…9C21, 2,500 USDC)</code><em>requested</em></div>
              <div className={`blocked-result ${demoState === 'blocked' ? 'show' : ''}`}>
                <span className="blocked-icon"><X size={17} /></span>
                <div><small>TRANSACTION BLOCKED</small><strong>Daily limit exceeded by 2,450 USDC</strong><p>No signature created. No funds moved.</p></div>
              </div>
              {demoState !== 'blocked' && <div className="console-placeholder"><LockKeyhole size={17} /><span>{demoState === 'checking' ? 'Evaluating 6 policy rules…' : 'Ready to test the policy boundary'}</span></div>}
            </div>
          </div>
        </section>

        <section id="policy" className="policy-section">
          <div className="policy-heading"><div><div className="section-kicker">POLICY COMPOSER</div><h2>Say what the agent may do.<br />We’ll make it enforceable.</h2></div><p>Natural language makes the policy easy to write. Deterministic rules make it safe to trust.</p></div>
          <div className="policy-card">
            <div className="composer-label"><Sparkles size={15} /> Research Agent policy</div>
            <p className="policy-sentence">
              This agent may purchase verified data services using up to{' '}
              <button onClick={() => setSpendIndex((spendIndex + 1) % spendOptions.length)}>{spendOptions[spendIndex]} <ChevronDown size={16} /></button>{' '}
              <button onClick={() => setPeriodIndex((periodIndex + 1) % periodOptions.length)}>{periodOptions[periodIndex]} <ChevronDown size={16} /></button>, only on{' '}
              <button onClick={() => setNetworkIndex((networkIndex + 1) % networkOptions.length)}>{networkOptions[networkIndex]} <ChevronDown size={16} /></button>, and must never grant unlimited token approvals.
            </p>
            <div className="policy-footer">
              <div><span><Check size={13} /> 6 deterministic rules</span><span><Clock3 size={13} /> Expires Sep 13</span><span><KeyRound size={13} /> User confirmation required</span></div>
              <Button>Review rules <ArrowRight size={15} /></Button>
            </div>
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
    </main>
  );
}
