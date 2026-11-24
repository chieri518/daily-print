import React from 'react';
import {Composition} from 'remotion';
import {Short, shortLength} from './kit/frames';
import {FPS, H, W} from './kit/theme';
import {Beat} from './kit/timing';
import {short1} from './short1';
import {short2} from './short2';
import {short3} from './short3';
import {short4} from './short4';

const SHORTS: Record<string, Beat[]> = {short1, short2, short3, short4};

export const Root: React.FC = () => (
  <>
    {Object.entries(SHORTS).map(([name, beats]) => (
      <Composition key={name} id={name} component={() => <Short name={name} beats={beats} />} durationInFrames={shortLength(name, beats)} fps={FPS} width={W} height={H} />
    ))}
  </>
);
