import type React from 'react';
import durations from '../durations.json';
import {FPS} from './theme';

/** One recorded voice line. `who` is set for Nora; everything else is the narrator. */
export type Line = {id: string; text: string; who?: 'nora'};

/** A stretch of the short with one scene on screen. Times are in seconds. */
export type Beat = {
  id: string;
  Scene: React.FC<SceneProps>;
  lines?: Line[];
  lead?: number; // before the first line
  gap?: number; // between lines
  tail?: number; // after the last line
  min?: number; // shortest the beat may be
};

/** A line placed in time: frames, relative to its beat. */
export type TimedLine = Line & {from: number; dur: number};

export type SceneProps = {
  dur: number;
  lines: TimedLine[];
  /** The frame (in the beat) where `word` is heard in line `i`, or the line's start. */
  at: (i: number, word?: string) => number;
};

export const f = (seconds: number) => Math.round(seconds * FPS);

/** What the voice actually says: no [tags]. */
export const spoken = (text: string) => text.replace(/\[[^\]]*\]\s*/g, '').trim();

export function layout(short: string, beats: Beat[]) {
  let t = 0;
  const placed = beats.map((beat) => {
    const {lines = [], lead = 0.4, gap = 0.3, tail = 0.6, min = 0} = beat;
    let cursor = f(lead);
    const timed: TimedLine[] = lines.map((line, i) => {
      const seconds = (durations as Record<string, number>)[`${short}/${line.id}`];
      if (seconds === undefined) throw new Error(`No voice file for ${short}/${line.id}`);
      const from = cursor + (i > 0 ? f(gap) : 0);
      const dur = f(seconds);
      cursor = from + dur;
      return {...line, from, dur};
    });
    const dur = Math.max(f(min), lines.length ? cursor + f(tail) : f(min));
    const at = (i: number, word?: string) => {
      const line = timed[i];
      if (!word) return line.from;
      const text = spoken(line.text);
      const index = text.indexOf(word);
      if (index < 0) throw new Error(`"${word}" not in line ${line.id}`);
      return line.from + Math.round((line.dur * index) / text.length);
    };
    const result = {beat, from: t, dur, lines: timed, at};
    t += dur;
    return result;
  });
  return {beats: placed, total: t};
}
