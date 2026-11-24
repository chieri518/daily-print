// Turns the raw ElevenLabs takes into the voice files the shorts use, then measures them.
// Raw takes: ../assets/voice-raw/<short>/<id>.mp3. Output: ../assets/voice/<short>/<id>.mp3 and src/durations.json.
// Every line is sped up a little (SPEED keeps the pitch). KEEP lists the parts of a take to keep,
// as [from, to] in seconds of the raw file (no `to` = to the end); everything else is cut.
// Run from tutorial/video:  node scripts/voice.mjs
import {execFileSync} from 'node:child_process';
import {mkdirSync, readdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const bin = 'node_modules/@remotion/compositor-win32-x64-msvc';
const SPEED = 1.15;
const KEEP = {
  'short1/n5': [[4.8]], // drop "So: a chatbot generates text. An agent takes action." (the stickies already say it)
  'short1/n6': [[0, 8.5]], // drop "One quick question? A chatbot's fine."
  'short3/n2': [[0, 1.6], [3.55]], // drop "before it ever runs."
  'short3/n5': [[0.9]], // drop "Our turn."
};

/** An ffmpeg filter that keeps `parts` of the input, joins them, and speeds them up. */
function filter(parts = [[0]]) {
  const pieces = parts.map(([from, to], i) => `[0]atrim=start=${from}${to ? `:end=${to}` : ''},asetpts=PTS-STARTPTS[p${i}]`);
  const inputs = parts.map((_, i) => `[p${i}]`).join('');
  return `${pieces.join(';')};${inputs}concat=n=${parts.length}:v=0:a=1,atempo=${SPEED}`;
}

const raw = '../assets/voice-raw';
const out = {};
for (const short of readdirSync(raw)) {
  mkdirSync(join('../assets/voice', short), {recursive: true});
  for (const file of readdirSync(join(raw, short)).filter((f) => f.endsWith('.mp3'))) {
    const key = `${short}/${file.replace('.mp3', '')}`;
    const dest = join('../assets/voice', short, file);
    execFileSync(`${bin}/ffmpeg.exe`, ['-v', 'error', '-y', '-i', join(raw, short, file), '-filter_complex', filter(KEEP[key]), '-b:a', '160k', dest]);
    const s = execFileSync(`${bin}/ffprobe.exe`, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', dest]);
    out[key] = Number(Number(s).toFixed(3));
  }
}
writeFileSync('src/durations.json', JSON.stringify(out, null, 2));
console.log(out);
