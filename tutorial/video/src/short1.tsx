// Short 1: "Chatbot or Agent?" — see SCREENPLAY.md, shots 1.1–1.8.
import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {During, FrontPage, Headline, LowerThird, PageTurn, Remember, Sfx, TitleCard, Veo} from './kit/frames';
import {AgentCard, Canvas, circlePath, Cutout, Draw, Notebook, Stamp, Sticky, Tick, usePop, useRamp, wobbleRect, Write} from './kit/paper';
import {C, hand, sans, serif} from './kit/theme';
import {Beat, f, SceneProps} from './kit/timing';

const MeetNora: React.FC<SceneProps> = () => (
  <Veo clip="1.1">
    <LowerThird at={f(1.2)}>Nora · runs a small bakery</LowerThird>
    <Sfx at={f(3.1)} name="oven" volume={0.5} />
  </Veo>
);

const REPLY = ['1. Find the purchase order', '2. Find the delivery note', '3. Compare quantities', '4. Compare prices', '5. Note any gaps', '6. Email the supplier', '7. …'];

const Chatbot: React.FC<SceneProps> = ({at}) => {
  const frame = useCurrentFrame();
  const sigh = at(1, 'Nora still');
  const step = (at(1, 'Nora still') - at(1)) / REPLY.length;
  return (
    <Notebook>
      <Canvas>
        <Draw d={wobbleRect(420, 300, 600, 900, 3)} at={2} len={16} color={C.blue} width={9} />
        <Draw d="M 425 380 L 1015 382" at={12} len={10} color={C.blue} width={6} />
      </Canvas>
      <Write at={10} style={{left: 450, top: 312, fontFamily: sans, fontWeight: 700, fontSize: 34, color: C.blue}}>CHAT</Write>
      {frame >= at(0) && (
        <div style={{position: 'absolute', left: 520, top: 410, width: 470, background: C.pink, color: '#fff', borderRadius: '28px 28px 6px 28px', padding: '18px 26px', fontFamily: sans, fontWeight: 500, fontSize: 40, transform: `scale(${grow(frame, at(0))})`, transformOrigin: '100% 100%'}}>
          <div style={{fontSize: 22, fontWeight: 700, letterSpacing: 3, opacity: 0.85}}>NORA</div>
          Can you check this invoice?
        </div>
      )}
      {REPLY.map((text, i) => (
        <Write key={i} at={at(1) + Math.round(i * step)} len={10} style={{left: 460, top: 600 + i * 78, fontSize: 52, color: C.blue}}>
          {text}
        </Write>
      ))}
      {REPLY.map((_, i) => (i % 2 === 0 ? <Sfx key={i} at={at(1) + Math.round(i * step)} name="marker" volume={0.35} /> : null))}
      {frame < sigh ? <Cutout x={50} y={760} w={340} at={0} src="nora-smile" rot={-4} /> : <Cutout x={40} y={760} w={360} at={sigh - 4} src="nora-tired" rot={-4} tilt={-4} />}
      <Sticky x={60} y={330} w={320} h={180} at={sigh} color={C.blue} rot={-5} style={{color: '#fff', fontSize: 56}}>
        CHATBOT
        <br />→ text
      </Sticky>
      <Sfx at={at(0) - 8} name="typing" volume={0.4} />
      <Sfx at={sigh} name="sticky" />
    </Notebook>
  );
};

/** 0→1 over 6 frames from `start`. */
const grow = (frame: number, start: number) => Math.min(1, Math.max(0, (frame - start) / 6));

const STEPS = [
  {icon: '📧', text: 'Open the invoice', word: 'opens the invoice'},
  {icon: '📁', text: 'Find the order', word: 'finds the order'},
  {icon: '📦', text: 'Check the delivery note', word: 'checks the delivery'},
  {icon: '⚠️', text: 'Billed: 50 bags. Delivered: 40.', word: 'spots the problem'},
  {icon: '✉️', text: 'Draft an email to the supplier', word: 'drafts the email'},
];
// A snake path: left, right, right, left, left, right.
const SLOTS = [
  [80, 290],
  [570, 290],
  [570, 590],
  [80, 590],
  [80, 890],
  [570, 890],
];

const Agent: React.FC<SceneProps> = ({at}) => {
  const ask = at(0, 'asks Nora');
  return (
    <Notebook>
      <Canvas>
        <Draw d="M 500 400 C 530 390 545 395 565 400" at={at(0, 'finds') - 10} color={C.ink} width={6} />
        <Draw d="M 780 520 C 790 545 790 565 785 585" at={at(0, 'checks') - 10} color={C.ink} width={6} />
        <Draw d="M 565 700 C 545 705 530 705 505 700" at={at(0, 'spots') - 10} color={C.ink} width={6} />
        <Draw d="M 290 820 C 300 845 300 865 295 885" at={at(0, 'drafts') - 10} color={C.ink} width={6} />
        <Draw d="M 500 1000 C 530 990 545 995 565 1000" at={ask - 10} color={C.ink} width={6} />
      </Canvas>
      {STEPS.map((s, i) => {
        const kw = at(0, s.word);
        const bad = i === 3;
        return (
          <React.Fragment key={i}>
            <Sticky x={SLOTS[i][0]} y={SLOTS[i][1]} w={420} h={230} at={kw - 8} color={bad ? C.pink : C.yellow} rot={i % 2 ? 2 : -2} style={{fontSize: 50, color: bad ? '#fff' : C.ink}}>
              <div style={{fontSize: 54}}>{s.icon}</div>
              {s.text}
            </Sticky>
            {bad ? <Sfx at={kw + 6} name="err" volume={0.5} /> : <Sfx at={kw - 8} name="sticky" volume={0.5} />}
            {!bad && (
              <Canvas>
                <Tick x={SLOTS[i][0] + 330} y={SLOTS[i][1] + 20} at={kw + 8} />
              </Canvas>
            )}
            {!bad && <Sfx at={kw + 8} name="tick" volume={0.6} />}
          </React.Fragment>
        );
      })}
      <AgentCard x={570} y={880} w={440} at={ask - 6} size={42}>
        Email ready. Send it?
        <YesButton press={ask + 18} />
      </AgentCard>
      <Sfx at={ask - 6} name="ping" volume={0.5} />
      <Sticky x={80} y={1170} w={420} h={130} at={ask + 10} color={C.teal} rot={-3} style={{color: '#fff', fontSize: 54, padding: '26px 30px'}}>
        AGENT → actions
      </Sticky>
    </Notebook>
  );
};

const YesButton: React.FC<{press: number}> = ({press}) => {
  const frame = useCurrentFrame();
  const pressed = frame >= press;
  const s = pressed ? 1 - 0.12 * Math.max(0, 1 - (frame - press) / 6) : 1;
  return (
    <div style={{display: 'flex', gap: 16, marginTop: 14}}>
      <div style={{padding: '8px 26px', borderRadius: 30, background: pressed ? C.teal : '#fff', color: pressed ? '#fff' : C.teal, border: `4px solid ${C.teal}`, fontWeight: 700, fontSize: 34, transform: `scale(${s})`}}>Yes{pressed ? ' ✓' : ''}</div>
      <div style={{padding: '8px 26px', borderRadius: 30, border: `4px solid ${C.grey}`, color: C.grey, fontWeight: 700, fontSize: 34}}>Not yet</div>
    </div>
  );
};

const LOOP = {cx: 760, cy: 560, r: 200};
const loopPoint = (t: number) => {
  const a = -Math.PI / 2 + t * 2 * Math.PI;
  return [LOOP.cx + LOOP.r * Math.cos(a), LOOP.cy + LOOP.r * Math.sin(a)];
};

const Definition: React.FC<SceneProps> = ({at}) => {
  const frame = useCurrentFrame();
  const chat = 2;
  const agent = 10;
  const go = at(0);
  const done = at(0, 'until the job');
  // The dot goes round twice between "plans" and "until the job", then leaves for DONE.
  const t = interpolate(frame, [go, done], [0, 2], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const exit = useRamp(done, 14);
  const [lx, ly] = loopPoint(t);
  const dx = lx + exit * (1010 - lx);
  const dy = ly + exit * (300 - ly);
  const nodes = [
    {label: 'PLAN', x: 760, y: 330, word: 'plans'},
    {label: 'ACT', sub: '(use a tool)', x: 960, y: 700, word: 'uses tools'},
    {label: 'CHECK', x: 540, y: 700, word: 'checks'},
  ];
  return (
    <Notebook>
      <Canvas>
        {/* Chatbot: question in, text out. */}
        <Draw d={wobbleRect(120, 420, 190, 130, 9)} at={chat} color={C.blue} width={8} />
        <Draw d="M 40 485 L 112 485 M 92 465 L 112 485 L 92 505" at={chat + 8} color={C.blue} width={6} />
        <Draw d="M 318 485 L 390 485 M 370 465 L 390 485 L 370 505" at={chat + 12} color={C.blue} width={6} />
        {/* Agent: the loop. */}
        <Draw d={circlePath(LOOP.cx, LOOP.cy, LOOP.r)} at={agent} len={18} color={C.teal} width={10} />
        <Draw d="M 1000 300 L 1000 220 L 1060 240 L 1000 260" at={done} color={C.pink} width={8} />
        {frame >= go && <circle cx={dx} cy={dy} r={20} fill={C.pink} />}
      </Canvas>
      <Write at={chat + 2} style={{left: 140, top: 450, fontFamily: sans, fontWeight: 700, fontSize: 40, color: C.blue}}>Chatbot</Write>
      <Write at={chat + 10} style={{left: 50, top: 540, fontSize: 40, color: C.blue}}>question → text</Write>
      {nodes.map((n) => (
        <Node key={n.label} {...n} at={agent + 6} lit={at(0, n.word)} />
      ))}
      <Write at={done + 6} style={{left: 900, top: 320, fontFamily: sans, fontWeight: 700, fontSize: 40, color: C.pink}}>DONE</Write>
      <Sticky x={90} y={920} w={900} h={330} at={done - 10} color={'#fff'} rot={-1} style={{fontFamily: sans, fontWeight: 500, fontSize: 48, lineHeight: 1.25}}>
        An <b>AI agent</b> is an AI that can <b>plan</b>, <b>use tools</b>, <b>check</b> the results, and <b>repeat</b> until the job is done.
      </Sticky>
      <Sfx at={go} name="whoosh" volume={0.4} />
      <Sfx at={Math.round((go + done) / 2)} name="whoosh" volume={0.4} />
      <Sfx at={done + 8} name="tick" />
      <Sfx at={done - 10} name="sticky" volume={0.5} />
    </Notebook>
  );
};

const Node: React.FC<{label: string; sub?: string; x: number; y: number; at: number; lit: number}> = ({label, sub, x, y, at, lit}) => {
  const p = usePop(at);
  const frame = useCurrentFrame();
  const on = frame >= lit;
  if (frame < at) return null;
  return (
    <div style={{position: 'absolute', left: x - 110, top: y - 50, width: 220, textAlign: 'center', transform: `scale(${p * (on ? 1.08 : 1)})`, background: on ? C.teal : C.white, color: on ? '#fff' : C.teal, border: `5px solid ${C.teal}`, borderRadius: 20, padding: '10px 0', fontFamily: sans, fontWeight: 700, fontSize: 42, boxShadow: '0 8px 14px rgba(0,0,0,.12)'}}>
      {label}
      {sub && <div style={{fontFamily: hand, fontWeight: 400, fontSize: 32}}>{sub}</div>}
    </div>
  );
};

const QUESTIONS = [
  {text: 'Many steps?', word: 'Many steps'},
  {text: 'Needs tools or data?', word: 'Tools or data'},
  {text: 'Needs judgment?', word: 'Judgment'},
  {text: 'Happens again and again?', word: 'Again and again'},
];

const AgentTest: React.FC<SceneProps> = ({at}) => {
  const yes = at(0, 'Four yeses');
  return (
    <Notebook>
      <Sticky x={110} y={290} w={860} h={640} at={0} rot={-2} style={{padding: '34px 46px'}}>
        <div style={{fontFamily: sans, fontWeight: 700, fontSize: 60, letterSpacing: 4, marginBottom: 26}}>THE AGENT TEST</div>
        {QUESTIONS.map((q) => (
          <div key={q.text} style={{fontSize: 64, marginBottom: 26, paddingLeft: 100}}>{q.text}</div>
        ))}
      </Sticky>
      <Canvas>
        {QUESTIONS.map((q, i) => (
          <React.Fragment key={q.text}>
            <Draw d={wobbleRect(170, 420 + i * 103, 62, 62, i)} at={6 + i * 3} width={6} />
            <Tick x={166} y={406 + i * 103} at={at(0, q.word)} />
          </React.Fragment>
        ))}
      </Canvas>
      {QUESTIONS.map((q) => (
        <Sfx key={q.text} at={at(0, q.word)} name="tick" />
      ))}
      <Stamp at={yes} text="AGENT-SHAPED" color={C.teal} size={56} style={{left: 470, top: 800}} />
      <Sfx at={yes} name="stamp" />
    </Notebook>
  );
};

const INK_TEST = [
  {text: 'Many steps', word: 'Steps'},
  {text: 'Tools (web search)', word: 'tools'},
  {text: 'Judgment (what matters to you)', word: 'judgment'},
  {text: 'Every day', word: 'daily'},
];

const PAPER_ROWS = [
  ['Never ends', 'Ends: a fixed number of pages'],
  ['An algorithm ranks what you see', 'You choose the sections and sources'],
];

const CaseFile: React.FC<SceneProps> = ({at, dur}) => (
  <PageTurn stampAt={16}>
    <Headline at={at(0) - 4} top={290}>The same test, on the news</Headline>
    <During from={at(1) - 4} to={at(2) - 4}>
      <div style={{position: 'absolute', left: 110, top: 560, width: 860, height: 560, border: `6px solid ${C.newsInk}`, background: '#fffdf6', boxShadow: '10px 10px 0 rgba(0,0,0,.12)', padding: '30px 40px', boxSizing: 'border-box'}}>
        <div style={{fontFamily: serif, fontWeight: 900, fontSize: 56, marginBottom: 20}}>The Agent Test</div>
        {INK_TEST.map((q) => (
          <div key={q.text} style={{fontFamily: sans, fontWeight: 500, fontSize: 44, marginBottom: 24, paddingLeft: 90}}>{q.text}</div>
        ))}
      </div>
      <Canvas>
        {INK_TEST.map((q, i) => (
          <React.Fragment key={q.text}>
            <rect x={150} y={665 + i * 82} width={52} height={52} fill="none" stroke={C.newsInk} strokeWidth={5} />
            <Tick x={146} y={650 + i * 82} at={at(1, q.word)} color={C.tomato} />
          </React.Fragment>
        ))}
      </Canvas>
      {INK_TEST.map((q) => (
        <Sfx key={q.text} at={at(1, q.word)} name="tick" />
      ))}
      <Stamp at={at(1, 'Four yeses')} text="AGENT-SHAPED" size={52} style={{left: 520, top: 1000}} />
      <Sfx at={at(1, 'Four yeses')} name="stamp" />
    </During>
    <During from={at(2) - 4} to={dur}>
      <FrontPage at={at(2) - 4} src="page-1-the-morning-edition" />
      {PAPER_ROWS.map(([feed, paper], i) => (
        <PaperRow key={i} at={at(2, i ? 'for one reader' : 'researches')} top={560 + i * 330} feed={feed} paper={paper} />
      ))}
    </During>
  </PageTurn>
);

const PaperRow: React.FC<{at: number; top: number; feed: string; paper: string}> = ({at, top, feed, paper}) => {
  const p = useRamp(at, 16);
  return (
    <div style={{position: 'absolute', left: 580, top, width: 440, opacity: p > 0 ? 1 : 0, fontFamily: sans}}>
      <div style={{fontSize: 24, fontWeight: 700, letterSpacing: 2, color: C.grey}}>YOUR FEED</div>
      <div style={{fontSize: 36, color: C.grey, textDecoration: p > 0.5 ? 'line-through' : 'none', marginBottom: 12}}>{feed}</div>
      <div style={{fontSize: 24, fontWeight: 700, letterSpacing: 2, color: C.tomato}}>YOUR PAPER</div>
      <div style={{fontFamily: serif, fontWeight: 900, fontSize: 44, lineHeight: 1.1, clipPath: `inset(-10% ${100 - p * 100}% -10% 0)`}}>{paper}</div>
    </div>
  );
};

const End: React.FC = () => (
  <Remember points={['Chatbots answer. Agents act.', 'Agents loop: plan → act → check.', 'Use the Agent Test before you build.']} next="Next: Inside an Agent →" />
);

export const short1: Beat[] = [
  {id: 'meet-nora', Scene: MeetNora, lines: [{id: 'n1', text: 'This is Nora. Bread at five a.m. ... Paperwork at nine.'}], lead: 0.6, min: 5.5},
  {id: 'title', Scene: () => <TitleCard part={1} title="Chatbot or Agent?" />, min: 1.6},
  {id: 'chatbot', Scene: Chatbot, lines: [{id: 'nora-1', who: 'nora', text: '[curious] Can you check this invoice?'}, {id: 'n3', text: 'A chatbot replies with instructions. ... Nora still does every step.'}], lead: 0.5},
  {id: 'agent', Scene: Agent, lines: [{id: 'n4', text: 'An agent does the steps. It opens the invoice, finds the order, checks the delivery, spots the problem, drafts the email... and asks Nora before sending.'}], tail: 0.6},
  {id: 'definition', Scene: Definition, lines: [{id: 'n5', text: 'It plans, uses tools, checks the results, and loops until the job is done.'}], tail: 0.9},
  {id: 'agent-test', Scene: AgentTest, lines: [{id: 'n6', text: "Is your job agent-shaped? Many steps? Tools or data? Judgment? Again and again? Four yeses: good fit."}], tail: 0.7},
  {
    id: 'case-file',
    Scene: CaseFile,
    lines: [
      {id: 'n7a', text: 'Our project ran the same test on the news.'},
      {id: 'n7c', text: 'Steps, tools, judgment, daily. Four yeses.'},
      {id: 'n7d', text: 'So we built Daily Print: an agent that researches and edits one newspaper, for one reader, that ends.'},
    ],
    lead: 0.9,
    gap: 0.35,
    tail: 0.9,
  },
  {id: 'remember', Scene: End, lines: [{id: 'n8', text: "Next: what's inside an agent."}], lead: 1.0, tail: 1.4},
];
