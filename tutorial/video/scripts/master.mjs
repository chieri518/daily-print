// Brings each rendered short up to phone loudness (-14 LUFS, peaks under -1.5 dB) without touching the picture.
// Reads out/<name>.mp4, writes the finished short to ../final/<name>.mp4. Two passes: measure, then correct.
// Run from tutorial/video:  node scripts/master.mjs short1 short2 ...
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';

const ffmpeg = 'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe';
const target = 'I=-14:TP=-1.5:LRA=11';

mkdirSync('../final', {recursive: true});
for (const name of process.argv.slice(2)) {
  const input = `out/${name}.mp4`;
  const log = spawnSync(ffmpeg, ['-hide_banner', '-i', input, '-vn', '-af', `loudnorm=${target}:print_format=json`, '-f', 'null', '-']).stderr.toString();
  const m = JSON.parse(log.slice(log.lastIndexOf('{'), log.lastIndexOf('}') + 1));
  const measured = `measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}`;
  execFileSync(ffmpeg, ['-v', 'error', '-y', '-i', input, '-c:v', 'copy', '-af', `loudnorm=${target}:${measured}:linear=true`, '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', `../final/${name}.mp4`]);
  console.log(`${name}: ${m.input_i} LUFS → -14`);
}
