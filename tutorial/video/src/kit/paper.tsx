// The notebook and newsprint look: backgrounds, marker strokes, sticky notes, cards, cutouts.
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, H, hand, sans, W} from './theme';

/** 0→1 with a little bounce, starting at frame `at`. */
export const usePop = (at: number, damping = 13) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - at, fps, config: {damping, stiffness: 170, mass: 0.7}});
};

/** 0→1 over `len` frames, easing out, starting at frame `at`. */
export const useRamp = (at: number, len = 12) =>
  interpolate(useCurrentFrame(), [at, at + len], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

export const Grain: React.FC = () => (
  <Img src={staticFile('images/grain.png')} style={{position: 'absolute', inset: 0, width: W, height: H, mixBlendMode: 'overlay', opacity: 0.35}} />
);

export const Tag: React.FC<{text: string}> = ({text}) => (
  <div style={{position: 'absolute', top: 150, right: 56, transform: 'rotate(3deg)', background: C.white, border: `4px solid ${C.ink}`, borderRadius: 40, padding: '8px 26px', fontFamily: sans, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.ink}}>
    {text}
  </div>
);

/** Cream dot-grid notebook page. */
export const Notebook: React.FC<{children?: React.ReactNode; example?: boolean}> = ({children, example = true}) => (
  <AbsoluteFill style={{background: C.paper}}>
    <svg width={W} height={H} style={{position: 'absolute'}}>
      <defs>
        <pattern id="dots" width="48" height="48" patternUnits="userSpaceOnUse">
          <circle cx="24" cy="24" r="3" fill={C.dot} />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#dots)" />
    </svg>
    <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(60,40,10,.16), rgba(60,40,10,0) 70px)'}} />
    <Grain />
    {children}
    {example && <Tag text="EXAMPLE" />}
  </AbsoluteFill>
);

/** Rubber stamp that slams down at frame `at`. */
export const Stamp: React.FC<{at: number; text: string; color?: string; style?: React.CSSProperties; size?: number}> = ({at, text, color = C.tomato, style, size = 34}) => {
  const p = usePop(at, 11);
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <div style={{position: 'absolute', transform: `rotate(-7deg) scale(${2.2 - 1.2 * p})`, opacity: Math.min(1, p * 2), border: `6px solid ${color}`, outline: `2px solid ${color}`, outlineOffset: 5, borderRadius: 10, padding: '10px 22px', fontFamily: sans, fontWeight: 700, fontSize: size, letterSpacing: 3, color, whiteSpace: 'nowrap', mixBlendMode: 'multiply', ...style}}>
      {text}
    </div>
  );
};

/** Newsprint background for the case-file segments. */
export const Newsprint: React.FC<{children?: React.ReactNode; stampAt?: number}> = ({children, stampAt = 0}) => (
  <AbsoluteFill style={{background: C.news}}>
    <svg width={W} height={H} style={{position: 'absolute'}}>
      <defs>
        <pattern id="halftone" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="1.5" fill="rgba(0,0,0,.07)" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#halftone)" />
    </svg>
    <Grain />
    {children}
    <Stamp at={stampAt} text="CASE FILE: DAILY PRINT" style={{top: 140, right: 50}} />
  </AbsoluteFill>
);

/** A path that draws itself like a marker stroke. */
export const Draw: React.FC<{d: string; at: number; len?: number; color?: string; width?: number}> = ({d, at, len = 12, color = C.ink, width = 8}) => {
  const p = useRamp(at, len);
  return (
    <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 1" strokeDashoffset={1 - p} opacity={p > 0 ? 1 : 0} />
  );
};

/** A slightly wobbly hand-drawn rectangle path. */
export const wobbleRect = (x: number, y: number, w: number, h: number, seed = 1) => {
  const j = (i: number) => (random(`${seed}-${i}`) - 0.5) * 8;
  return `M ${x + j(1)} ${y + j(2)} L ${x + w + j(3)} ${y + j(4)} L ${x + w + j(5)} ${y + h + j(6)} L ${x + j(7)} ${y + h + j(8)} Z`;
};

export const circlePath = (cx: number, cy: number, r: number) =>
  `M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy + 1} A ${r} ${r} 0 0 1 ${cx + r + 4} ${cy - 6}`;

/** An SVG layer the size of the frame, for drawings. */
export const Canvas: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
    {children}
  </svg>
);

/** A check mark that draws itself. (x, y) is the top-left of a 70 px box. */
export const Tick: React.FC<{x: number; y: number; at: number; color?: string; size?: number}> = ({x, y, at, color = C.teal, size = 70}) => {
  const s = size / 70;
  return <Draw d={`M ${x + 6 * s} ${y + 38 * s} L ${x + 26 * s} ${y + 60 * s} L ${x + 66 * s} ${y + 8 * s}`} at={at} len={8} color={color} width={12 * s} />;
};

type Box = {x: number; y: number; w: number; h?: number; at: number};

/** A sticky note that peels on with a small curl and shadow. */
export const Sticky: React.FC<Box & {color?: string; rot?: number; children?: React.ReactNode; style?: React.CSSProperties}> = ({x, y, w, h, at, color = C.yellow, rot = -2, children, style}) => {
  const p = usePop(at);
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, transform: `rotate(${rot - (1 - p) * 14}deg) scale(${0.55 + 0.45 * p})`, transformOrigin: '20% 0%', opacity: Math.min(1, p * 2), background: color, boxShadow: '0 14px 22px rgba(60,40,10,.22), 0 2px 3px rgba(60,40,10,.2)', padding: '22px 26px', boxSizing: 'border-box', fontFamily: hand, fontSize: 48, lineHeight: 1.05, color: C.ink, ...style}}>
      <div style={{position: 'absolute', right: 0, bottom: 0, width: 46, height: 46, background: 'linear-gradient(135deg, rgba(255,255,255,0) 50%, rgba(60,40,10,.18) 50%)'}} />
      {children}
    </div>
  );
};

/** What the agent "says": white card, teal bar, ✦ Agent label. */
export const AgentCard: React.FC<Box & {children: React.ReactNode; size?: number}> = ({x, y, w, at, children, size = 40}) => {
  const p = usePop(at, 15);
  const frame = useCurrentFrame();
  if (frame < at) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y + (1 - p) * 60, width: w, opacity: Math.min(1, p * 1.5), background: '#fff', borderRadius: 22, boxShadow: '0 16px 30px rgba(30,30,30,.18)', borderLeft: `16px solid ${C.teal}`, padding: '20px 28px', boxSizing: 'border-box', fontFamily: sans, color: C.ink}}>
      <div style={{fontWeight: 700, fontSize: 28, color: C.teal, letterSpacing: 2, marginBottom: 6}}>✦ AGENT</div>
      <div style={{fontWeight: 500, fontSize: size, lineHeight: 1.2}}>{children}</div>
    </div>
  );
};

/** Text that writes on left to right. */
export const Write: React.FC<{at: number; len?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at, len = 14, children, style}) => {
  const p = useRamp(at, len);
  return <div style={{position: 'absolute', clipPath: `inset(-20% ${100 - p * 100}% -20% -5%)`, fontFamily: hand, color: C.ink, whiteSpace: 'nowrap', ...style}}>{children}</div>;
};

/** A photo of Nora cut out with a white border, bobbing gently. */
export const Cutout: React.FC<Box & {src: string; rot?: number; tilt?: number}> = ({x, y, w, at, src, rot = -3, tilt = 0}) => {
  const p = usePop(at);
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const bob = Math.sin((frame - at) / 9) * 5;
  return (
    <Img src={staticFile(`images/${src}.png`)} style={{position: 'absolute', left: x, top: y + bob, width: w, transform: `rotate(${rot + tilt}deg) scale(${0.6 + 0.4 * p})`, transformOrigin: '50% 100%', opacity: Math.min(1, p * 2), filter: 'drop-shadow(0 14px 18px rgba(60,40,10,.3))'}} />
  );
};

/** A big pink circled step number with a label beside it. */
export const StepNum: React.FC<{x: number; y: number; at: number; n: number; label: string}> = ({x, y, at, n, label}) => (
  <>
    <Canvas>
      <Draw d={circlePath(x + 60, y + 60, 54)} at={at} len={10} color={C.pink} width={10} />
    </Canvas>
    <Write at={at + 2} len={6} style={{left: x + 34, top: y + 6, fontSize: 96, color: C.pink}}>{n}</Write>
    <Write at={at + 8} len={10} style={{left: x + 140, top: y + 30, fontFamily: sans, fontWeight: 700, fontSize: 52, letterSpacing: 3}}>{label}</Write>
  </>
);

/** A card that pops in at `at`. */
export const Card: React.FC<{x: number; y: number; w: number; at: number; color?: string; children: React.ReactNode; style?: React.CSSProperties}> = ({x, y, w, at, color = C.white, children, style}) => {
  const p = usePop(at, 14);
  if (useCurrentFrame() < at) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, transform: `scale(${p})`, background: color, border: `5px solid ${C.ink}`, borderRadius: 18, padding: '16px 10px', boxSizing: 'border-box', textAlign: 'center', fontFamily: sans, fontWeight: 700, color: C.ink, boxShadow: '6px 6px 0 rgba(0,0,0,.12)', ...style}}>
      {children}
    </div>
  );
};

/** A lined index card with a handwritten rule. */
export const RuleCard: React.FC<{x?: number; y: number; at: number; children: React.ReactNode}> = ({x = 80, y, at, children}) => {
  const p = usePop(at, 14);
  if (useCurrentFrame() < at) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 640, height: 150, transform: `rotate(-1deg) translateX(${(1 - p) * -500}px)`, background: `repeating-linear-gradient(#fff 0 46px, #9EC9E8 46px 48px)`, borderTop: `8px solid ${C.pink}`, boxShadow: '0 10px 18px rgba(0,0,0,.15)', fontFamily: hand, fontSize: 62, color: C.ink, padding: '30px 30px', boxSizing: 'border-box'}}>
      {children}
    </div>
  );
};
