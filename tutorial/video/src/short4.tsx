// Short 4: "What We Learned" — see SCREENPLAY.md, shots 4.1–4.9.
import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {During, Headline, Manager, PageTurn, Remember, Sfx, StepChips, TitleCard, Veo} from './kit/frames';
import {Canvas, Card, Cutout, Newsprint, Notebook, RuleCard, Stamp, Tick, usePop, useRamp, Write} from './kit/paper';
import {C, hand, sans, serif} from './kit/theme';
import {Beat, f, SceneProps} from './kit/timing';

const LESSONS = ['ACCURACY', 'EDGE CASES', 'COST', 'PRIVACY'];

const Intro: React.FC<SceneProps> = ({at}) => (
  <PageTurn>
    <div style={{position: 'absolute', left: 160, top: 420, width: 760, height: 760, background: '#fffdf6', border: `6px solid ${C.newsInk}`, boxShadow: '12px 12px 0 rgba(0,0,0,.12)', padding: '40px 60px', boxSizing: 'border-box'}}>
      <div style={{fontFamily: serif, fontWeight: 900, fontSize: 90, marginBottom: 40}}>Lessons</div>
      {LESSONS.map((l) => (
        <div key={l} style={{display: 'flex', alignItems: 'center', gap: 30, marginBottom: 44, fontFamily: sans, fontWeight: 700, fontSize: 50, color: C.grey}}>
          <div style={{width: 64, height: 64, border: `5px solid ${C.newsInk}`}} />
          {l}
        </div>
      ))}
    </div>
    <Write at={at(0, 'non-coders')} style={{left: 0, width: 1080, top: 1200, textAlign: 'center', fontSize: 72, color: C.tomato}}>+ how anyone can help</Write>
  </PageTurn>
);

/** A crop of a real front page: one story and its source line, which gets highlighted. */
const Receipt: React.FC<{at: number; mark: number}> = ({at, mark}) => {
  const p = usePop(at, 14);
  const swipe = useRamp(mark, 10);
  const frame = useCurrentFrame();
  const scale = 1.21; // page pixels → screen pixels
  const lens = interpolate(frame, [mark, mark + 40], [-200, 700], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (frame < at) return null;
  return (
    <div style={{position: 'absolute', left: 80, top: 470, width: 920, height: 270, overflow: 'hidden', background: '#fff', border: `5px solid ${C.newsInk}`, transform: `scale(${p}) rotate(-1deg)`, boxShadow: '0 16px 30px rgba(0,0,0,.2)'}}>
      <Img src={staticFile('images/page-1-the-morning-edition.png')} style={{position: 'absolute', left: -70 * scale, top: -1255 * scale, width: 1275 * scale}} />
      <div style={{position: 'absolute', left: 462, top: 196, width: 150 * swipe, height: 34, background: C.sun, mixBlendMode: 'multiply'}} />
      {frame >= mark && <div style={{position: 'absolute', left: lens, top: 130, fontSize: 120}}>🔍</div>}
    </div>
  );
};

const BLOCKS = ['World', 'Tech', 'Local', 'Science', 'Sports'];

/** A tower of sections. Before `fix`, pulling Science topples it; after, a "No news today" card holds it up. */
const Tower: React.FC<{pull: number; fix: number}> = ({pull, fix}) => {
  const frame = useCurrentFrame();
  const after = frame >= fix;
  const t = after ? frame - fix : frame - pull;
  const slide = Math.min(1, Math.max(0, t / 8));
  const fall = after ? 0 : Math.max(0, t - 8);
  return (
    <>
      {BLOCKS.map((b, i) => {
        const y = 1120 - i * 120;
        const science = i === 3;
        const above = i > 3;
        const x = science ? 330 + slide * 900 : 330;
        const drop = above ? Math.min(140 + i * 30, fall * fall * 2) : 0;
        const tip = above ? Math.min(40, fall * 3) : 0;
        return (
          <div key={b} style={{position: 'absolute', left: x, top: y + drop, width: 420, height: 110, transform: `rotate(${tip}deg)`, background: science ? C.sun : '#fffdf6', border: `5px solid ${C.newsInk}`, boxSizing: 'border-box', fontFamily: sans, fontWeight: 700, fontSize: 44, textAlign: 'center', lineHeight: '100px'}}>
            {b}
          </div>
        );
      })}
      {after && slide === 1 && (
        <div style={{position: 'absolute', left: 330, top: 760, width: 420, height: 110, background: C.white, border: `5px dashed ${C.teal}`, boxSizing: 'border-box', fontFamily: hand, fontSize: 56, color: C.teal, textAlign: 'center', lineHeight: '100px'}}>No news today</div>
      )}
    </>
  );
};

/** A taxi meter whose dollars climb; each fix slows it, the last one stops it. */
const Meter: React.FC<{at: number; fixes: number[]}> = ({at, fixes}) => {
  const frame = useCurrentFrame();
  const rates = [9, 5, 2.5, 0];
  let cents = 0;
  for (let fr = at; fr < frame; fr++) cents += rates[fixes.filter((x) => fr >= x).length];
  return (
    <div style={{position: 'absolute', left: 240, top: 470, width: 600, background: C.newsInk, borderRadius: 24, padding: '20px 30px', boxSizing: 'border-box', textAlign: 'center'}}>
      <div style={{fontFamily: sans, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: C.sun}}>COST OF ONE PAPER</div>
      <div style={{fontFamily: 'monospace', fontWeight: 700, fontSize: 120, color: C.sun}}>${(cents / 100).toFixed(2)}</div>
    </div>
  );
};

const FIXES = [
  {text: 'RESEARCH IN PARALLEL', word: 'parallel'},
  {text: 'RETRY ONCE, NOT FOREVER', word: 'retries'},
  {text: 'ONE PAPER AT A TIME', word: 'one paper'},
];

const Lessons: React.FC<SceneProps> = ({at, dur}) => {
  const frame = useCurrentFrame();
  const starts = [0, 1, 2, 3].map((i) => at(i) - 4);
  const fixes = FIXES.map((x) => at(2, x.word));
  const lock = at(3, 'names never');
  const slip = Math.min(1, Math.max(0, (frame - lock) / 12));
  return (
    <Newsprint stampAt={-30}>
      <StepChips labels={LESSONS} starts={starts} color={C.tomato} />
      <During from={starts[0]} to={starts[1]}>
        <Receipt at={starts[0] + 4} mark={at(0, 'names its sources')} />
        <Write at={at(0, 'check it')} len={16} style={{left: 0, width: 1080, top: 860, textAlign: 'center', fontSize: 88, color: C.tomato}}>Can't trace it? Don't trust it.</Write>
      </During>
      <During from={starts[1]} to={starts[2]}>
        <Tower pull={at(1, 'One broken')} fix={at(1, 'Now it says')} />
        <Sfx at={at(1, 'One broken') + 8} name="blocks" volume={0.6} />
        <During from={at(1, 'One broken') + 24} to={at(1, 'Now it says')}>
          <Stamp at={at(1, 'One broken') + 24} text="PAPER FAILED" size={64} style={{left: 250, top: 640}} />
          <Sfx at={at(1, 'One broken') + 24} name="stamp" />
        </During>
        <Stamp at={at(1, 'rest still prints')} text="PRINTED" color={C.teal} size={64} style={{left: 600, top: 460}} />
        <Sfx at={at(1, 'rest still prints')} name="stamp" />
      </During>
      <During from={starts[2]} to={starts[3]}>
        <Meter at={starts[2]} fixes={fixes} />
        <Sfx at={starts[2]} name="meter" volume={0.4} />
        {FIXES.map((x, i) => (
          <React.Fragment key={x.text}>
            <Stamp at={fixes[i]} text={x.text} color={C.teal} size={48} style={{left: 110 + (i % 2) * 120, top: 800 + i * 140}} />
            <Sfx at={fixes[i]} name="stamp" volume={0.6} />
          </React.Fragment>
        ))}
      </During>
      <During from={starts[3]} to={dur}>
        <Card x={80} y={460} w={520} at={starts[3]} style={{textAlign: 'left', fontSize: 34, padding: '20px 30px'}}>
          <div style={{letterSpacing: 4, color: C.tomato}}>📅 TODAY</div>
          {['Maya', 'Dev'].map((name, i) => (
            <div key={name} style={{fontFamily: hand, fontWeight: 400, fontSize: 56, marginTop: 10}}>
              🎂 <span style={{display: 'inline-block', opacity: 1 - slip, transform: `translate(${slip * 260}px, ${slip * (230 - i * 70)}px) scale(${1 - slip * 0.7})`}}>{name}'s birthday</span>
            </div>
          ))}
        </Card>
        <div style={{position: 'absolute', left: 700, top: 560, width: 260, height: 240, background: '#5A5F66', border: `6px solid ${C.newsInk}`, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 110}}>{frame >= lock + 12 ? '🔒' : '🔓'}</div>
        <Sfx at={lock + 12} name="safe" volume={0.6} />
        <Manager at={lock + 16} y={980} />
        <Card x={340} y={1120} w={400} at={lock + 24} color={C.sun} style={{fontSize: 44}}>🎂 × 2 today</Card>
        <Write at={lock + 30} style={{left: 330, top: 1220, fontSize: 44, color: C.grey}}>no names leave your account</Write>
      </During>
    </Newsprint>
  );
};

const ROLES = [
  {icon: '✍️', title: 'WRITE THE RULES', sub: 'in plain language', word: 'write the rules'},
  {icon: '🧪', title: 'COLLECT TRICKY EXAMPLES', sub: 'to test with', word: 'collect'},
  {icon: '✅', title: 'CHECK THE RESULTS', sub: "and flag what's wrong", word: 'check the results'},
];

const Help: React.FC<SceneProps> = ({at}) => (
  <Notebook>
    <Cutout x={60} y={300} w={300} at={2} src="nora-smile" rot={-4} />
    <RuleCard x={380} y={380} at={at(0, "Nora's rule")}>Over $500? Ask Nora.</RuleCard>
    <Write at={at(0, 'Only Nora')} style={{left: 400, top: 560, fontSize: 60, color: C.pink}}>Only Nora could write this rule.</Write>
    {ROLES.map((r, i) => (
      <React.Fragment key={r.title}>
        <Card x={80} y={720 + i * 190} w={920} at={at(0, r.word)} style={{display: 'flex', alignItems: 'center', gap: 26, textAlign: 'left', padding: '14px 30px'}}>
          <div style={{fontSize: 80}}>{r.icon}</div>
          <div>
            <div style={{fontSize: 44}}>{r.title}</div>
            <div style={{fontFamily: hand, fontWeight: 400, fontSize: 44, color: C.teal}}>{r.sub}</div>
          </div>
        </Card>
        <Sfx at={at(0, r.word)} name="sticky" />
      </React.Fragment>
    ))}
  </Notebook>
);

const OURS = [
  {who: 'EDITORS', what: 'set the house style and tone', word: 'editors'},
  {who: 'READERS', what: 'flag mistakes in real editions', word: 'readers'},
];

const Ours: React.FC<SceneProps> = ({at}) => (
  <PageTurn>
    <Headline at={at(0) - 4} top={300}>For Daily Print</Headline>
    {OURS.map((o, i) => (
      <React.Fragment key={o.who}>
        <Card x={80} y={560 + i * 260} w={920} at={at(0, o.word)} color="#fffdf6" style={{textAlign: 'left', padding: '24px 36px'}}>
          <div style={{fontSize: 40, letterSpacing: 4, color: C.tomato}}>{o.who}</div>
          <div style={{fontFamily: serif, fontWeight: 900, fontSize: 56}}>{o.what}</div>
        </Card>
        <Sfx at={at(0, o.word)} name="stamp" volume={0.5} />
      </React.Fragment>
    ))}
    <Canvas>
      <Tick x={880} y={600} at={at(0, 'editors') + 10} color={C.tomato} />
      <Tick x={880} y={860} at={at(0, 'readers') + 10} color={C.tomato} />
    </Canvas>
  </PageTurn>
);

const Finale: React.FC<SceneProps> = () => (
  <Veo clip="4.8">
    <Sfx at={f(5.4)} name="bell" volume={0.6} />
  </Veo>
);

const SERIES = ['1 · Chatbot or Agent?', '2 · Inside an Agent', '3 · Building an Agent Safely', '4 · What We Learned'];

const End: React.FC = () => (
  <>
    <Remember points={["Can't trace it? Don't trust it.", 'Design for failure, cost and privacy from day one.', 'The rules are plain language: experts write them.']} next="Agents, Explained · the end" cutout={null} />
    <div style={{position: 'absolute', left: 110, top: 1170, width: 860, fontFamily: sans, fontWeight: 500, fontSize: 30, lineHeight: 1.45, color: C.ink}}>
      {SERIES.map((s) => (
        <div key={s}>{s}</div>
      ))}
      <div style={{color: C.teal, fontWeight: 700}}>Case study: Daily Print · daily-print.vercel.app</div>
    </div>
  </>
);

export const short4: Beat[] = [
  {id: 'intro', Scene: Intro, lines: [{id: 'n1', text: 'Four lessons from building a real agent, and how non-coders can help.'}], lead: 0.9, tail: 0.4},
  {id: 'title', Scene: () => <TitleCard part={4} title="What We Learned" />, min: 1.6},
  {
    id: 'lessons',
    Scene: Lessons,
    lines: [
      {id: 'n2', text: 'One: accuracy needs receipts. Every story names its sources, so a person can check it.'},
      {id: 'n3', text: 'Two: plan for failure. One broken section used to sink the whole paper. Now it says "no news today", and the rest still prints.'},
      {id: 'n4', text: 'Three: every step costs money. So research runs in parallel, retries stop at one, and one paper runs at a time.'},
      {id: 'n5', text: 'Four: share less. We read your calendar for birthdays, but the names never go to the AI.'},
    ],
    lead: 0.3,
    gap: 0.4,
    tail: 0.9,
  },
  {id: 'help', Scene: Help, lines: [{id: 'n6', text: 'And you don\'t need to code to help. Nora\'s rule, "over five hundred, ask me"? Only Nora could write it. Experts write the rules, collect tricky examples, and check the results.'}], lead: 0.4, tail: 0.7},
  {id: 'ours', Scene: Ours, lines: [{id: 'n7', text: 'For us, editors set the house style, and readers flag mistakes.'}], lead: 0.8, tail: 0.6},
  {id: 'finale', Scene: Finale, lines: [{id: 'n8', text: '[warmly] If you can explain your job, you can help build an agent.'}], lead: 4.6, min: 8.0},
  {id: 'remember', Scene: End, min: 3.8},
];
