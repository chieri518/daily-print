// Short 3: "Building an Agent Safely" — see SCREENPLAY.md, shots 3.1–3.7.
import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {During, Headline, Manager, PageTurn, Remember, Sfx, TitleCard, Veo} from './kit/frames';
import {AgentCard, Canvas, Card, RuleCard, circlePath, Cutout, Draw, Notebook, Stamp, StepNum, Tick, usePop, useRamp, Write} from './kit/paper';
import {C, hand, sans} from './kit/theme';
import {Beat, SceneProps} from './kit/timing';

const Icing: React.FC<SceneProps> = () => (
  <Veo clip="3.1">
    <Sfx at={50} name="ping" volume={0.5} />
  </Veo>
);

const Rules: React.FC<SceneProps> = ({at}) => {
  const rules = [
    {text: 'Only pay suppliers on the list.', word: 'Only pay'},
    {text: 'Over $500? Ask Nora.', word: 'Over five'},
  ];
  const keyAt = at(0, 'least access');
  const bounce = at(0, 'never move') + 12;
  const frame = useCurrentFrame();
  const fly = interpolate(frame, [bounce, bounce + 8, bounce + 22], [700, 0, 380], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Notebook>
      <StepNum x={70} y={250} at={at(0)} n={1} label="RULES + GUARDS" />
      {rules.map((r, i) => (
        <React.Fragment key={r.text}>
          <RuleCard y={430 + i * 190} at={at(0, r.word) - 6}>{r.text}</RuleCard>
          <Stamp at={at(0, r.word) + 10} text="RULE" color={C.teal} size={40} style={{left: 790, top: 470 + i * 190}} />
          <Sfx at={at(0, r.word) + 10} name="stamp" />
        </React.Fragment>
      ))}
      <Card x={80} y={830} w={560} at={keyAt} color={C.sun} style={{fontSize: 40, textAlign: 'left', padding: '18px 26px'}}>
        🔑 BANK: READ ONLY
      </Card>
      <Write at={keyAt + 10} style={{left: 680, top: 840, fontSize: 64, color: C.pink}}>least access</Write>
      <Sfx at={keyAt} name="key" />
      {frame >= bounce && (
        <div style={{position: 'absolute', left: 300 + fly, top: 1000, transform: `rotate(${fly / 30}deg)`, background: '#fff', border: `4px solid ${C.ink}`, padding: '10px 20px', fontFamily: sans, fontWeight: 700, fontSize: 30}}>
          INVOICE · Premium Flour Partners · $5,000
        </div>
      )}
      <Sfx at={bounce + 8} name="err" volume={0.5} />
      <AgentCard x={80} y={1080} w={920} at={bounce + 22} size={42}>
        Held for Nora: unknown supplier · $5,000
      </AgentCard>
      <Sfx at={bounce + 22} name="ping" volume={0.5} />
    </Notebook>
  );
};

const DOORS = [
  {label: 'Email', x: 70, y: 640},
  {label: 'Accounting', x: 420, y: 640},
  {label: 'Bank', x: 770, y: 640},
];

/** A drawn doorway with an API plate; a cable runs to the manager once it's unlocked. */
const Door: React.FC<{label: string; x: number; y: number; at: number}> = ({label, x, y, at}) => {
  const p = usePop(at, 14);
  if (useCurrentFrame() < at) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 240, height: 230, transform: `scale(${p})`, border: `6px solid ${C.ink}`, borderRadius: '120px 120px 8px 8px', background: C.white, fontFamily: sans, fontWeight: 700, textAlign: 'center', boxSizing: 'border-box', paddingTop: 50}}>
      <div style={{fontSize: 34}}>{label}</div>
      <div style={{margin: '12px auto 0', width: 110, background: C.sun, border: `3px solid ${C.ink}`, borderRadius: 6, fontSize: 30}}>API</div>
      <div style={{fontSize: 40, marginTop: 6}}>🔑</div>
    </div>
  );
};

const FAKES = ['a duplicate', 'a wrong total', 'an unknown supplier'];

const Connect: React.FC<SceneProps> = ({at}) => {
  const doors = at(0, 'APIs') - 6;
  const test = at(0, 'Then test');
  return (
    <Notebook>
      <StepNum x={70} y={250} at={at(0)} n={2} label="CONNECT" />
      <Canvas>
        {DOORS.map((d, i) => (
          <Draw key={d.label} d={`M 540 520 C 540 580 ${d.x + 120} 570 ${d.x + 120} 640`} at={doors + 10 + i * 8} color={C.teal} width={8} />
        ))}
      </Canvas>
      <Manager at={at(0)} y={420} />
      {DOORS.map((d, i) => (
        <React.Fragment key={d.label}>
          <Door {...d} at={doors + i * 8} />
          <Sfx at={doors + i * 8} name="key" volume={0.6} />
        </React.Fragment>
      ))}
      <Card x={80} y={950} w={920} at={test} color={C.sun} style={{textAlign: 'left', fontSize: 34, padding: '16px 30px', height: 330}}>
        <div style={{letterSpacing: 4, marginBottom: 10}}>TEST KITCHEN · fake invoices</div>
        {FAKES.map((t) => (
          <div key={t} style={{fontFamily: hand, fontWeight: 400, fontSize: 54, paddingLeft: 80}}>{t} → flagged</div>
        ))}
      </Card>
      <Canvas>
        {FAKES.map((t, i) => (
          <Tick key={t} x={120} y={1020 + i * 66} at={at(0, 'tricky') + i * 8} size={56} />
        ))}
      </Canvas>
      {FAKES.map((t, i) => (
        <Sfx key={t} at={at(0, 'tricky') + i * 8} name="tick" />
      ))}
    </Notebook>
  );
};

const QUEUE = [
  {text: 'Golden Mill · $1,280', ok: true},
  {text: 'Milk delivery · $96', ok: true},
  {text: 'Premium Flour Partners · $5,000 · unknown supplier', ok: false},
];

const Human: React.FC<SceneProps> = ({at}) => {
  const decide = at(0, 'Nora approves');
  return (
    <Notebook>
      <StepNum x={70} y={250} at={at(0)} n={3} label="HUMAN IN THE LOOP" />
      {QUEUE.map((q, i) => (
        <QueueCard key={q.text} y={430 + i * 190} at={at(0, 'prepares') - 8 + i * 4} decided={decide + i * 8} {...q} />
      ))}
      {QUEUE.map((q, i) => (
        <Sfx key={q.text} at={decide + i * 8} name={q.ok ? 'tick' : 'err'} volume={0.6} />
      ))}
      <Cutout x={760} y={980} w={250} at={at(0)} src="nora-smile" rot={4} />
    </Notebook>
  );
};

const QueueCard: React.FC<{y: number; at: number; decided: number; text: string; ok: boolean}> = ({y, at, decided, text, ok}) => {
  const frame = useCurrentFrame();
  const p = usePop(at, 15);
  const ramp = useRamp(decided + 6, 10);
  const crumple = ok ? 0 : ramp;
  if (frame < at) return null;
  const done = frame >= decided;
  return (
    <div style={{position: 'absolute', left: 80, top: y, width: 920, minHeight: 150, transform: `translateY(${(1 - p) * 60}px) scale(${1 - 0.6 * crumple}) rotate(${crumple * 25}deg)`, opacity: Math.min(1, p * 2) * (1 - crumple * 0.7), background: '#fff', borderRadius: 22, borderLeft: `16px solid ${ok ? C.teal : C.pink}`, boxShadow: '0 12px 24px rgba(0,0,0,.15)', padding: '18px 26px', boxSizing: 'border-box', fontFamily: sans, display: 'flex', alignItems: 'center', gap: 20}}>
      <div style={{flex: 1, fontWeight: 500, fontSize: 40, lineHeight: 1.15}}>{text}</div>
      <div style={{flex: 'none', padding: '8px 22px', borderRadius: 30, fontWeight: 700, fontSize: 32, background: done ? (ok ? C.teal : C.pink) : '#fff', color: done ? '#fff' : C.grey, border: `4px solid ${done ? (ok ? C.teal : C.pink) : C.grey}`}}>
        {done ? (ok ? 'Approved ✓' : 'Rejected ✗') : 'Waiting'}
      </div>
    </div>
  );
};

const OUR_RULES = [
  {text: 'LENGTH = THE SIZE OF THE BOX', word: 'length comes'},
  {text: 'EVERY STORY CITES SOURCES', word: 'cite'},
  {text: 'PICTURES AVOID TRAGEDY', word: 'avoid'},
];

/** A newspaper column whose text spills past the bottom, then fits once the rule lands. */
const Column: React.FC<{at: number; fit: number}> = ({at, fit}) => {
  const frame = useCurrentFrame();
  const pour = interpolate(frame, [at, at + 40], [0, 26], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const lines = frame >= fit ? 17 : Math.floor(pour);
  return (
    <>
      <div style={{position: 'absolute', left: 80, top: 480, width: 380, height: 640, border: `5px dashed ${C.newsInk}`}} />
      {Array.from({length: lines}, (_, i) => (
        <div key={i} style={{position: 'absolute', left: 100, top: 500 + i * 36, width: i % 6 === 5 ? 220 : 340, height: 16, background: i >= 17 ? C.tomato : C.newsInk, opacity: 0.75}} />
      ))}
    </>
  );
};

const STEPS = ['Research', 'Write', 'Draw', 'Fit', 'Print'];
const SERVICES = [
  {icon: '🔎', text: 'search', word: 'search'},
  {icon: '⛅', text: 'weather', word: 'weather'},
  {icon: '📅', text: 'calendar', word: 'calendar'},
  {icon: '🗄️', text: 'database', word: 'database'},
  {icon: '🖨️', text: 'printer', word: 'printer'},
];

/** Five steps fill, crash on step 3, then resume from step 3. */
const Progress: React.FC<{at: number; crash: number; resume: number}> = ({at, crash, resume}) => {
  const frame = useCurrentFrame();
  const filled = frame < crash ? interpolate(frame, [at, crash], [0, 2.6], {extrapolateLeft: 'clamp'}) : frame < resume ? 2.6 : interpolate(frame, [resume, resume + 30], [2.6, 5], {extrapolateRight: 'clamp'});
  const red = frame >= crash && frame < resume;
  return (
    <>
      {STEPS.map((s, i) => (
        <div key={s} style={{position: 'absolute', left: 80 + i * 186, top: 900, width: 176, height: 110, border: `5px solid ${C.newsInk}`, boxSizing: 'border-box', background: '#fffdf6', overflow: 'hidden'}}>
          <div style={{position: 'absolute', inset: 0, width: `${Math.max(0, Math.min(1, filled - i)) * 100}%`, background: red && i === 2 ? C.tomato : C.teal}} />
          <div style={{position: 'relative', textAlign: 'center', lineHeight: '100px', fontFamily: sans, fontWeight: 700, fontSize: 32, color: filled - i > 0.5 ? '#fff' : C.newsInk}}>{s}</div>
        </div>
      ))}
      {red && <div style={{position: 'absolute', left: 430, top: 1020, fontFamily: sans, fontWeight: 700, fontSize: 48, color: C.tomato}}>⚡ crash</div>}
    </>
  );
};

const CaseFile: React.FC<SceneProps> = ({at, dur}) => {
  const crash = at(1, 'and saves') - 10;
  const resume = at(1, 'so a crash');
  return (
    <PageTurn>
      <During from={0} to={at(1) - 4}>
        <Headline at={at(0) - 4} top={270} size={84}>Our rules</Headline>
        <Column at={at(0, 'first edition')} fit={at(0, 'length comes')} />
        <Stamp at={at(0, 'forty percent')} text="+40%" size={80} style={{left: 160, top: 1180}} />
        <Sfx at={at(0, 'forty percent')} name="stamp" />
        {OUR_RULES.map((r, i) => (
          <React.Fragment key={r.text}>
            <Stamp at={at(0, r.word)} text={r.text} color={C.teal} size={36} style={{left: 500, top: 540 + i * 170, whiteSpace: 'normal', width: 460}} />
            <Sfx at={at(0, r.word)} name="stamp" volume={0.6} />
          </React.Fragment>
        ))}
      </During>
      <During from={at(1) - 4} to={at(2) - 4}>
        <Headline at={at(1) - 4} top={270} size={84}>Our connections</Headline>
        {SERVICES.map((s, i) => (
          <React.Fragment key={s.text}>
            <Card x={80 + i * 186} y={520} w={176} at={at(1, s.word)} style={{fontSize: 28, padding: '14px 4px'}}>
              <div style={{fontSize: 64}}>{s.icon}</div>
              {s.text}
            </Card>
            <Sfx at={at(1, s.word)} name="key" volume={0.4} />
          </React.Fragment>
        ))}
        <Progress at={at(1, 'printer')} crash={crash} resume={resume} />
        <Sfx at={crash} name="err" volume={0.5} />
        <Stamp at={resume + 6} text="SAVED · RESUMES FROM STEP 3" color={C.teal} size={38} style={{left: 150, top: 1100}} />
        <Sfx at={resume + 6} name="stamp" volume={0.6} />
      </During>
      <During from={at(2) - 4} to={dur}>
        <Headline at={at(2) - 4} top={270} size={84}>Readers steer it</Headline>
        <Screen at={at(2, 'design')} src="screen-customize" y={500} rot={-3} />
        <Screen at={at(2, 'pick')} src="screen-paper" y={820} rot={2} />
      </During>
    </PageTurn>
  );
};

/** A screenshot of the real app, sliding in with a sunflower circle. */
const Screen: React.FC<{at: number; src: string; y: number; rot: number}> = ({at, src, y, rot}) => {
  const p = usePop(at, 14);
  if (useCurrentFrame() < at) return null;
  return (
    <>
      <Img src={staticFile(`images/${src}.png`)} style={{position: 'absolute', left: 90, top: y, width: 900, transform: `translateX(${(1 - p) * 900}px) rotate(${rot}deg)`, border: `5px solid ${C.newsInk}`, boxShadow: '0 20px 40px rgba(0,0,0,.3)'}} />
      <Canvas>
        <Draw d={circlePath(540, y + 300, 250)} at={at + 12} len={14} color={C.sun} width={14} />
      </Canvas>
      <Sfx at={at} name="whoosh" volume={0.4} />
    </>
  );
};

const End: React.FC = () => (
  <Remember points={['Write the rules first. Give the least access.', 'Connect through APIs. Test with fake data.', 'A human approves the risky moments.']} next="Next: What We Learned →" />
);

export const short3: Beat[] = [
  {id: 'icing', Scene: Icing, lines: [{id: 'nora-1', who: 'nora', text: '[suspicious] Who is "Premium Flour Partners"?'}], lead: 2.0, tail: 0.6},
  {id: 'title', Scene: () => <TitleCard part={3} title="Building an Agent Safely" />, lines: [{id: 'n1', text: "A five-thousand-dollar invoice, from a supplier Nora's never heard of. What should her agent do?"}], lead: 0.3, tail: 0.4},
  {id: 'rules', Scene: Rules, lines: [{id: 'n2', text: 'Step one: rules. Only pay known suppliers. Over five hundred dollars? Ask Nora. And least access: it can read the bank, but never move money.'}], lead: 0.3, tail: 1.2},
  {id: 'connect', Scene: Connect, lines: [{id: 'n3', text: 'Step two: connect the tools through APIs, official doors with keys. Then test on fake invoices, tricky ones included.'}], lead: 0.3, tail: 0.6},
  {id: 'human', Scene: Human, lines: [{id: 'n4', text: 'Step three: a human in the loop. The agent prepares; Nora approves the risky ones.'}], lead: 0.3, tail: 0.7},
  {
    id: 'case-file',
    Scene: CaseFile,
    lines: [
      {id: 'n5', text: "Daily Print's first edition ran forty percent too long. Now length comes from the box, stories cite sources, and pictures avoid tragedy."},
      {id: 'n6', text: 'It connects to search, weather, a calendar, a database and a printer, and saves every step, so a crash resumes.'},
      {id: 'n7', text: 'And readers steer: they design the pages and pick the sources.'},
    ],
    lead: 0.7,
    gap: 0.4,
    tail: 0.8,
  },
  {id: 'remember', Scene: End, lines: [{id: 'n8', text: 'Next: what we learned.'}], lead: 0.9, tail: 0.9},
];
