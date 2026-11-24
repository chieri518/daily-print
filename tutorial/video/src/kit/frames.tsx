// Pieces every short shares: the Veo clip, title card, Remember card, captions, sound, and the short itself.
import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Card, Cutout, Notebook, Newsprint, Sticky, Tag, usePop, useRamp, Write} from './paper';
import {C, hand, sans, serif, W} from './theme';
import {Beat, layout, SceneProps, spoken, TimedLine} from './timing';

/** A sound effect at frame `at` of the current scene. */
export const Sfx: React.FC<{at: number; name: string; volume?: number}> = ({at, name, volume = 0.7}) => (
  <Sequence from={Math.max(0, at)} durationInFrames={90} layout="none">
    <Audio src={staticFile(`sfx/${name}.mp3`)} volume={volume} />
  </Sequence>
);

/** A Veo clip filling the frame, with its own audio kept quiet underneath. */
export const Veo: React.FC<{clip: string; startFrom?: number; volume?: number; children?: React.ReactNode}> = ({clip, startFrom = 0, volume = 0.25, children}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <OffthreadVideo src={staticFile(`veo_creations/${clip}.mp4`)} startFrom={startFrom} volume={volume} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <Tag text="EXAMPLE" />
    {children}
  </AbsoluteFill>
);

/** A handwritten label on a strip of white paper, for the bottom of a Veo shot. */
export const LowerThird: React.FC<{at: number; children: React.ReactNode}> = ({at, children}) => {
  const p = usePop(at, 15);
  return (
    <div style={{position: 'absolute', left: 60, top: 1140, transform: `translateX(${(1 - p) * -700}px) rotate(-2deg)`, background: C.white, padding: '10px 30px 14px', boxShadow: '0 10px 20px rgba(0,0,0,.3)', fontFamily: hand, fontSize: 64, color: C.ink}}>
      {children}
    </div>
  );
};

/** "AGENTS, EXPLAINED · Part N": a cloth notebook cover with a sticker slapped on. */
export const TitleCard: React.FC<{part: number; title: string}> = ({part, title}) => {
  const frame = useCurrentFrame();
  const cover = interpolate(frame, [0, 9], [1920, 0], {extrapolateRight: 'clamp', easing: (t) => 1 - (1 - t) ** 3});
  const sticker = usePop(8, 10);
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <AbsoluteFill style={{transform: `translateY(${cover}px)`, background: `repeating-linear-gradient(45deg, rgba(255,255,255,.07) 0 3px, rgba(0,0,0,.05) 3px 6px), ${C.pink}`}}>
        <div style={{position: 'absolute', left: W / 2 - 300, top: 520, width: 600, height: 600, borderRadius: '50%', background: C.white, border: `8px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', transform: `rotate(-6deg) scale(${frame < 8 ? 0 : 2 - sticker})`, opacity: frame < 8 ? 0 : 1, boxShadow: '0 20px 40px rgba(0,0,0,.25)'}}>
          <div style={{fontFamily: sans, fontWeight: 700, fontSize: 84, lineHeight: 1, color: C.ink, letterSpacing: 2}}>
            AGENTS,
            <br />
            EXPLAINED
          </div>
        </div>
        <Write at={22} len={14} style={{left: 0, width: W, top: 1180, textAlign: 'center', fontSize: 84, color: C.white}}>
          Part {part} · {title}
        </Write>
      </AbsoluteFill>
      <Sfx at={8} name="slap" />
    </AbsoluteFill>
  );
};

/** The closing sticky note: three takeaways and what's next. `cutout={null}` leaves Nora off. */
export const Remember: React.FC<{points: string[]; next: string; cutout?: string | null}> = ({points, next, cutout = 'nora-smile'}) => (
  <Notebook>
    <Sticky x={110} y={300} w={860} h={840} at={0} rot={-2} style={{padding: '40px 50px'}}>
      <div style={{fontFamily: sans, fontWeight: 700, fontSize: 70, letterSpacing: 6, marginBottom: 30}}>REMEMBER</div>
      {points.map((point, i) => (
        <Point key={i} n={i + 1} at={10 + i * 14} text={point} />
      ))}
      <div style={{position: 'absolute', left: 50, right: cutout ? 300 : 50, bottom: 40, fontFamily: sans, fontWeight: 700, fontSize: 40, lineHeight: 1.1, color: C.teal}}>{next}</div>
    </Sticky>
    {cutout && <Cutout x={640} y={1010} w={300} at={24} src={cutout} rot={6} />}
    <div style={{position: 'absolute', left: 0, width: W, top: 1500, textAlign: 'center', fontFamily: sans, fontWeight: 500, fontSize: 26, color: C.grey}}>
      Voices: ElevenLabs · Clips: Google Flow · A Daily Print team tutorial
    </div>
    <Sfx at={0} name="sticky" />
  </Notebook>
);

const Point: React.FC<{n: number; at: number; text: string}> = ({n, at, text}) => {
  const p = useRamp(at, 16);
  return (
    <div style={{display: 'flex', gap: 22, alignItems: 'flex-start', marginBottom: 34, opacity: p > 0 ? 1 : 0}}>
      <div style={{flex: 'none', width: 74, height: 74, borderRadius: '50%', border: `6px solid ${C.pink}`, fontFamily: sans, fontWeight: 700, fontSize: 44, color: C.pink, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${p})`}}>{n}</div>
      <div style={{fontFamily: hand, fontSize: 62, lineHeight: 1.05, clipPath: `inset(-20% ${100 - p * 100}% -20% 0)`}}>{text}</div>
    </div>
  );
};

/** The notebook page turns over into newsprint (first ~16 frames of a case file). */
export const PageTurn: React.FC<{children?: React.ReactNode; stampAt?: number}> = ({children, stampAt = 16}) => {
  const frame = useCurrentFrame();
  const angle = interpolate(frame, [0, 14], [0, -110], {extrapolateRight: 'clamp', easing: (t) => t * t});
  return (
    <AbsoluteFill>
      <Newsprint stampAt={stampAt}>{children}</Newsprint>
      {frame < 15 && (
        <AbsoluteFill style={{perspective: 2400}}>
          <AbsoluteFill style={{transformOrigin: '0% 50%', transform: `rotateY(${angle}deg)`, boxShadow: '30px 0 60px rgba(0,0,0,.35)'}}>
            <Notebook example={false} />
          </AbsoluteFill>
        </AbsoluteFill>
      )}
      <Sfx at={0} name="page" />
      <Sfx at={stampAt} name="stamp" />
      <Sfx at={6} name="sting" volume={0.5} />
    </AbsoluteFill>
  );
};

/** Shows its children only between frames `from` and `to`. */
export const During: React.FC<{from: number; to: number; children: React.ReactNode}> = ({from, to, children}) => {
  const frame = useCurrentFrame();
  return frame >= from && frame < to ? <>{children}</> : null;
};

/** A real Daily Print front page dropping onto the desk. */
export const FrontPage: React.FC<{at: number; src: string; x?: number; y?: number; w?: number; rot?: number}> = ({at, src, x = 70, y = 520, w = 470, rot = -4}) => {
  const p = usePop(at, 12);
  return (
    <>
      <Img src={staticFile(`images/${src}.png`)} style={{position: 'absolute', left: x, top: y, width: w, transform: `rotate(${rot}deg) scale(${1.4 - 0.4 * p})`, opacity: Math.min(1, p * 2), boxShadow: '0 20px 40px rgba(0,0,0,.3)'}} />
      <Sfx at={at + 4} name="thump" />
    </>
  );
};

/** The manager card: the language model. `thinking` adds "…". */
export const Manager: React.FC<{at: number; y?: number; thinking?: boolean}> = ({at, y = 420, thinking}) => (
  <Card x={290} y={y} w={500} at={at} color={C.purple} style={{color: '#fff', fontSize: 44}}>
    🧠 MANAGER{thinking ? ' …' : ''}
  </Card>
);

/** Four step chips along the top; the current one is filled in `color`, the done ones ticked. */
export const StepChips: React.FC<{labels: string[]; starts: number[]; color?: string}> = ({labels, starts, color = C.pink}) => {
  const frame = useCurrentFrame();
  const current = starts.filter((s) => frame >= s).length - 1;
  return (
    <>
      {labels.map((label, i) => {
        const on = i === current;
        const done = i < current;
        return (
          <div key={label} style={{position: 'absolute', left: 50 + i * 248, top: 250, width: 230, height: 96, borderRadius: 16, border: `5px solid ${on ? color : C.ink}`, background: on ? color : done ? C.white : 'transparent', color: on ? '#fff' : C.ink, opacity: i > current ? 0.35 : 1, fontFamily: sans, fontWeight: 700, fontSize: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${on ? 1.06 : 1})`}}>
            <div style={{fontSize: 34}}>{done ? '✓' : i + 1}</div>
            {label}
          </div>
        );
      })}
      {starts.map((s, i) => (
        <Sfx key={i} at={s} name="marker" volume={0.35} />
      ))}
    </>
  );
};

/** A big newspaper headline that drops in. */
export const Headline: React.FC<{at: number; top: number; children: React.ReactNode; size?: number}> = ({at, top, children, size = 92}) => {
  const p = usePop(at, 16);
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: top - (1 - p) * 40, opacity: Math.min(1, p * 1.5), fontFamily: serif, fontWeight: 900, fontSize: size, lineHeight: 1.02, color: C.newsInk, textAlign: 'center'}}>
      {children}
    </div>
  );
};

/** Narration captions: 3–4 words at a time on a yellow highlighter swipe. */
const Captions: React.FC<{lines: (TimedLine & {start: number})[]}> = ({lines}) => {
  const frame = useCurrentFrame();
  for (const line of lines) {
    if (frame < line.start || frame >= line.start + line.dur) continue;
    const chunks = chunk(spoken(line.text));
    const total = chunks.reduce((n, c) => n + c.length, 0);
    let t = line.start;
    for (const c of chunks) {
      const len = (line.dur * c.length) / total;
      if (frame < t + len) return <Caption key={`${line.id}-${t}`} text={c} from={Math.round(t)} />;
      t += len;
    }
  }
  return null;
};

const Caption: React.FC<{text: string; from: number}> = ({text, from}) => {
  const frame = useCurrentFrame();
  const swipe = interpolate(frame - from, [0, 5], [0, 100], {extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1330, display: 'flex', justifyContent: 'center'}}>
      <div style={{position: 'relative', padding: '6px 22px', fontFamily: sans, fontWeight: 700, fontSize: 60, lineHeight: 1.15, color: C.ink, textAlign: 'center'}}>
        <div style={{position: 'absolute', inset: 0, background: C.yellow, transform: 'skewX(-8deg)', clipPath: `inset(0 ${100 - swipe}% 0 0)`, boxShadow: '0 4px 0 rgba(0,0,0,.15)'}} />
        <span style={{position: 'relative'}}>{text}</span>
      </div>
    </div>
  );
};

/** Split a line into caption chunks of up to 4 words, breaking after punctuation. */
function chunk(text: string) {
  const words = text.replace(/\.\.\./g, '…').split(/\s+/).filter((w) => w && w !== '…');
  const out: string[] = [];
  let cur: string[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= 4 || (/[.,:;?!…]$/.test(w) && cur.length >= 2)) {
      out.push(cur.join(' '));
      cur = [];
    }
  }
  if (cur.length) out.push(cur.join(' '));
  return out;
}

/** Music sits low under speech and comes up in the gaps. */
function musicVolume(frame: number, lines: {start: number; dur: number}[], total: number) {
  let dist = Infinity;
  for (const l of lines) {
    const d = frame < l.start ? l.start - frame : frame > l.start + l.dur ? frame - l.start - l.dur : 0;
    dist = Math.min(dist, d);
  }
  const level = 0.09 + 0.16 * Math.min(1, dist / 12);
  const fade = interpolate(frame, [0, 15, total - 30, total], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return level * fade;
}

/** A whole short: beats in order, their voice lines, captions and music. */
export const Short: React.FC<{name: string; beats: Beat[]}> = ({name, beats}) => {
  const {beats: placed, total} = layout(name, beats);
  const lines = placed.flatMap((b) => b.lines.map((l) => ({...l, start: b.from + l.from})));
  return (
    <AbsoluteFill style={{background: C.paper}}>
      {placed.map(({beat, from, dur, lines: timed, at}) => (
        <Sequence key={beat.id} name={beat.id} from={from} durationInFrames={dur}>
          <beat.Scene dur={dur} lines={timed} at={at} />
        </Sequence>
      ))}
      {lines.map((l) => (
        <Sequence key={l.id} name={`voice ${l.id}`} from={l.start} durationInFrames={l.dur + 10} layout="none">
          <Audio src={staticFile(`voice/${name}/${l.id}.mp3`)} />
        </Sequence>
      ))}
      <Captions lines={lines.filter((l) => !l.who)} />
      <Audio src={staticFile('music/lesson-bed.mp3')} volume={(fr) => musicVolume(fr, lines, total)} />
    </AbsoluteFill>
  );
};

export const shortLength = (name: string, beats: Beat[]) => layout(name, beats).total;
