// Short 2: "Inside an Agent" — see SCREENPLAY.md, shots 2.1–2.9.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {During, FrontPage, Headline, Manager, StepChips, LowerThird, PageTurn, Remember, Sfx, TitleCard, Veo} from './kit/frames';
import {AgentCard, Canvas, Card, circlePath, Cutout, Draw, Notebook, Sticky, Tick, usePop, Write} from './kit/paper';
import {C, hand, sans, serif} from './kit/theme';
import {Beat, f, SceneProps} from './kit/timing';

const Counting: React.FC<SceneProps> = () => (
  <Veo clip="2.1">
    <LowerThird at={f(0.8)}>Nora · counting flour, again</LowerThird>
  </Veo>
);

const SPECIALISTS = [
  {icon: '🔍', name: 'READER'},
  {icon: '🗄️', name: 'CLERK'},
  {icon: '⚖️', name: 'CHECKER'},
  {icon: '✒️', name: 'WRITER'},
];
const specialistX = (i: number) => 40 + i * 255;

const Brain: React.FC<SceneProps> = ({at}) => {
  const manager = at(0, 'The brain');
  const team = at(0, 'Specialists');
  const tools = at(0, 'tools they');
  return (
    <Notebook>
      <Write at={at(0)} len={16} style={{left: 0, width: 1080, top: 250, textAlign: 'center', fontFamily: sans, fontWeight: 700, fontSize: 80}}>
        BRAIN + TOOLS
      </Write>
      <Canvas>
        {SPECIALISTS.map((_, i) => (
          <Draw key={i} d={`M 540 600 C 540 660 ${specialistX(i) + 110} 650 ${specialistX(i) + 110} 740`} at={team + i * 3} color={C.purple} width={6} />
        ))}
      </Canvas>
      <Card x={290} y={390} w={500} at={manager} color={C.purple} style={{color: '#fff'}}>
        <div style={{fontSize: 70}}>🧠</div>
        <div style={{fontSize: 48, letterSpacing: 3}}>MANAGER</div>
        <div style={{fontFamily: hand, fontWeight: 400, fontSize: 40}}>the language model</div>
      </Card>
      <Write at={at(0, 'it plans')} style={{left: 810, top: 430, fontSize: 52, color: C.purple}}>plans</Write>
      <Write at={at(0, 'it plans') + 6} style={{left: 810, top: 500, fontSize: 52, color: C.purple}}>decides</Write>
      {SPECIALISTS.map((s, i) => (
        <Card key={s.name} x={specialistX(i)} y={740} w={220} at={team + 6 + i * 4} style={{fontSize: 32}}>
          <div style={{fontSize: 64}}>{s.icon}</div>
          {s.name}
        </Card>
      ))}
      {SPECIALISTS.map((s, i) => (
        <Sfx key={s.name} at={team + 6 + i * 4} name="marker" volume={0.3} />
      ))}
      <Sticky x={110} y={1010} w={860} h={200} at={tools} rot={-1} style={{fontSize: 52, textAlign: 'center'}}>
        <div style={{fontFamily: sans, fontWeight: 700, fontSize: 30, letterSpacing: 4}}>TOOLBOX · only what they're allowed</div>
        📧 email · 🗄️ records · 📋 supplier list
      </Sticky>
      <Sfx at={tools} name="sticky" />
    </Notebook>
  );
};

const Invoice: React.FC<{at: number; x?: number; y?: number}> = ({at, x = 240, y = 620}) => {
  const p = usePop(at, 14);
  if (useCurrentFrame() < at) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y + (1 - p) * 120, width: 600, opacity: Math.min(1, p * 2), background: '#fff', border: `5px solid ${C.ink}`, padding: '28px 36px', boxSizing: 'border-box', fontFamily: sans, color: C.ink, boxShadow: '0 16px 30px rgba(0,0,0,.18)', transform: 'rotate(-2deg)'}}>
      <div style={{fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.grey}}>INVOICE</div>
      <div style={{fontWeight: 700, fontSize: 44, marginBottom: 18}}>Golden Mill Flour Co.</div>
      <div style={{fontSize: 40}}>Flour · 50 bags × $32</div>
      <div style={{fontWeight: 700, fontSize: 48, marginTop: 14, borderTop: `3px solid ${C.ink}`, paddingTop: 10}}>Total $1,600</div>
    </div>
  );
};

const TASKS = [
  {text: 'Read it', who: 'READER'},
  {text: 'Find the order + delivery note', who: 'CLERK'},
  {text: 'Compare', who: 'CHECKER'},
  {text: 'Draft a reply', who: 'WRITER'},
];

const DOCS = [
  {label: 'INVOICE', n: 50, word: 'Read the invoice'},
  {label: 'ORDER', n: 50, word: 'pull the order'},
  {label: 'DELIVERED', n: 40, word: 'delivery note'},
];

const OUTPUT = [
  {text: 'Pay $1,280 for 40 bags', word: 'Pay'},
  {text: 'Hold $320 for the 10 missing', word: 'flag'},
  {text: 'Email to Golden Mill drafted', word: 'draft'},
];

const Steps: React.FC<SceneProps> = ({at, dur}) => {
  const frame = useCurrentFrame();
  const starts = [0, 1, 2, 3].map((i) => at(i) - 4);
  const split = at(1, 'splits');
  const forty = at(2, 'forty');
  return (
    <Notebook>
      <StepChips labels={['INPUT', 'PLAN', 'TOOLS+CHECK', 'OUTPUT']} starts={starts} />
      <During from={starts[0]} to={starts[1]}>
        <div style={{position: 'absolute', left: 340, top: 470, fontSize: 200, transform: `translateY(${Math.max(0, 1 - (frame - starts[0]) / 8) * -400}px)`}}>✉️</div>
        <Invoice at={at(0, 'An invoice')} />
        <Sfx at={at(0, 'An invoice')} name="ping" volume={0.5} />
      </During>
      <During from={starts[1]} to={starts[2]}>
        <Manager at={starts[1]} thinking={frame < split} />
        {TASKS.map((t, i) => (
          <Sticky key={t.text} x={70 + (i % 2) * 480} y={640 + Math.floor(i / 2) * 300} w={450} h={250} at={split + i * 5} rot={i % 2 ? 2 : -2} style={{fontSize: 54}}>
            {t.text}
            <div style={{fontFamily: sans, fontWeight: 700, fontSize: 28, letterSpacing: 3, marginTop: 14, color: C.purple}}>→ {t.who}</div>
          </Sticky>
        ))}
        {TASKS.map((t, i) => (
          <Sfx key={t.text} at={split + i * 5} name="sticky" volume={0.5} />
        ))}
      </During>
      <During from={starts[2]} to={starts[3]}>
        {DOCS.map((d, i) => (
          <Card key={d.label} x={50 + i * 330} y={480} w={300} at={at(2, d.word)} style={{fontSize: 30, padding: '20px 10px'}}>
            {d.label}
            <div style={{fontFamily: serif, fontSize: 150, lineHeight: 1.1}}>{d.n}</div>
          </Card>
        ))}
        <Sfx at={at(2, 'pull the order')} name="drawer" volume={0.5} />
        <Canvas>
          <Tick x={150} y={790} at={at(2, 'compare')} />
          <Tick x={480} y={790} at={at(2, 'compare') + 6} />
          <Draw d={circlePath(860, 650, 120)} at={forty} len={10} color={C.pink} width={12} />
        </Canvas>
        <Sfx at={at(2, 'compare')} name="tick" />
        <Sfx at={at(2, 'compare') + 6} name="tick" />
        <Write at={forty + 8} len={8} style={{left: 730, top: 800, fontFamily: sans, fontWeight: 700, fontSize: 52, color: C.pink}}>MISMATCH</Write>
        <Sfx at={forty + 4} name="err" volume={0.5} />
        <Sticky x={110} y={930} w={860} h={240} at={at(2, 'Verifying')} color={C.teal} rot={-1} style={{color: '#fff', fontSize: 58}}>
          VERIFY = check against a record you trust
        </Sticky>
        <Write at={at(2, 'Verifying') + 20} style={{left: 140, top: 1190, fontSize: 40, color: C.grey}}>Accountants call this a three-way match.</Write>
      </During>
      <During from={starts[3]} to={dur}>
        <AgentCard x={90} y={460} w={900} at={starts[3] + 4} size={50}>
          {OUTPUT.map((o) => (
            <Item key={o.text} at={at(3, o.word)}>{o.text}</Item>
          ))}
          <div style={{color: C.grey, fontSize: 40, marginTop: 10}}>Waiting for Nora.</div>
        </AgentCard>
        <Sfx at={starts[3] + 4} name="ping" volume={0.5} />
        <Cutout x={640} y={900} w={340} at={at(3, 'draft')} src="nora-smile" rot={5} />
      </During>
    </Notebook>
  );
};

/** A line inside a card that appears with a tick when it's said. */
const Item: React.FC<{at: number; children: React.ReactNode}> = ({at, children}) => (
  <div style={{opacity: useCurrentFrame() >= at ? 1 : 0.15, marginBottom: 8}}>✓ {children}</div>
);

const ROWS = [
  {step: 'INPUT', word: 'Input', text: 'your sections + tone', sub: "🗄️ what you've read · last 14 days"},
  {step: 'PLAN', word: 'Plan', text: 'every section at once', sub: '→ → → → all researched in parallel'},
  {step: 'TOOLS + CHECKS', word: 'Tools and checks', text: 'search + sources · skip what you’ve read · 📏 fit each column', sub: 'Claude Sonnet · Claude Opus · Chromium'},
  {step: 'OUTPUT', word: 'Output', text: '🖨️ print it · 📱 read it', sub: ''},
];

const CaseFile: React.FC<SceneProps> = ({at}) => (
  <PageTurn>
    <Headline at={at(0) - 4} top={270} size={84}>Daily Print: same four steps</Headline>
    {ROWS.map((r, i) => (
      <InkRow key={r.step} n={i + 1} at={at(0, r.word)} top={490 + i * 210} {...r} />
    ))}
    <Sfx at={at(0, 'measure')} name="zip" volume={0.5} />
    <Sfx at={at(0, 'Output')} name="printer" volume={0.4} />
    <FrontPage at={at(0, 'your paper') - 4} src="page-4-the-daily-vibe-check-gen-z" x={280} y={480} w={540} rot={3} />
  </PageTurn>
);

const InkRow: React.FC<{n: number; at: number; top: number; step: string; text: string; sub: string}> = ({n, at, top, step, text, sub}) => {
  const p = usePop(at, 15);
  if (useCurrentFrame() < at) return null;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top, minHeight: 190, border: `5px solid ${C.newsInk}`, background: '#fffdf6', display: 'flex', alignItems: 'center', gap: 26, padding: '0 26px', boxSizing: 'border-box', transform: `translateX(${(1 - p) * 300}px)`, opacity: Math.min(1, p * 2)}}>
      <div style={{flex: 'none', width: 90, height: 90, borderRadius: '50%', background: C.tomato, color: '#fff', fontFamily: serif, fontSize: 60, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{n}</div>
      <div style={{fontFamily: sans}}>
        <div style={{fontWeight: 700, fontSize: 30, letterSpacing: 3, color: C.tomato}}>{step}</div>
        <div style={{fontWeight: 700, fontSize: 38, lineHeight: 1.15}}>{text}</div>
        {sub && <div style={{fontWeight: 500, fontSize: 26, color: C.grey}}>{sub}</div>}
      </div>
    </div>
  );
};

const End: React.FC = () => (
  <Remember points={['Brain = the manager. Tools = the hands.', 'Input → plan → tools & checks → output.', 'Verify against a record you trust.']} next="Next: Building an Agent Safely →" />
);

export const short2: Beat[] = [
  {id: 'counting', Scene: Counting, lines: [{id: 'nora-1', who: 'nora', text: '[counting, flat] Thirty-nine... forty. [sighs] Forty bags.'}], lead: 0.1, tail: 0.1},
  {id: 'title', Scene: () => <TitleCard part={2} title="Inside an Agent" />, lines: [{id: 'n1', text: "Last time, Nora's agent caught a bad invoice. How?"}], lead: 0.3, tail: 0.4},
  {id: 'brain', Scene: Brain, lines: [{id: 'n2', text: "An agent is a brain plus tools. The brain, a language model, is the manager: it plans. Specialists do the work, with the tools they're allowed to use."}], lead: 0.3, tail: 0.3},
  {
    id: 'steps',
    Scene: Steps,
    lines: [
      {id: 'n3', text: 'One: input. An invoice arrives.'},
      {id: 'n4', text: 'Two: plan. The manager splits the job.'},
      {id: 'n5', text: 'Three: tools and checks. Read the invoice, pull the order and the delivery note, compare. Fifty billed... forty delivered. Verifying means checking against a record you trust.'},
      {id: 'n6', text: 'Four: output. Pay for forty, flag ten, draft the email.'},
    ],
    lead: 0.3,
    gap: 0.4,
    tail: 0.6,
  },
  {id: 'case-file', Scene: CaseFile, lines: [{id: 'n7', text: "Daily Print, same steps. Input: your sections, and what you've already read. Plan: every section at once. Tools and checks: search with sources, skip what you've read, measure each column. Output: your paper."}], lead: 0.8, tail: 0.8},
  {id: 'remember', Scene: End, lines: [{id: 'n8', text: 'Next: building one safely.'}], lead: 1.0, tail: 1.1},
];
