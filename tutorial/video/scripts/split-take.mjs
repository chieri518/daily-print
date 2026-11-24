// Splits one long voice take into lines at its longest pauses.
// Usage (from tutorial/video):  node scripts/split-take.mjs <take.mp3> <out dir> <id1> <id2> ...
// With N ids it cuts at the N-1 longest silences, in the middle of each.
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';

const ffmpeg = 'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe';
const [take, dir, ...ids] = process.argv.slice(2);
const log = spawnSync(ffmpeg, ['-hide_banner', '-i', take, '-af', 'silencedetect=noise=-35dB:d=0.4', '-f', 'null', '-']).stderr.toString();
const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
const gaps = ends.map((end, i) => ({start: starts[i], end, len: end - starts[i]})).filter((g) => g.start > 0.05);
const cuts = gaps.sort((a, b) => b.len - a.len).slice(0, ids.length - 1).sort((a, b) => a.start - b.start);
console.log(cuts.map((g) => `${g.start.toFixed(2)}–${g.end.toFixed(2)}`).join('  '));
mkdirSync(dir, {recursive: true});
ids.forEach((id, i) => {
  const from = i === 0 ? 0 : cuts[i - 1].end - 0.05;
  const to = i < cuts.length ? cuts[i].start + 0.1 : undefined;
  execFileSync(ffmpeg, ['-v', 'error', '-y', '-ss', String(from), ...(to ? ['-to', String(to)] : []), '-i', take, join(dir, `${id}.mp3`)]);
});
