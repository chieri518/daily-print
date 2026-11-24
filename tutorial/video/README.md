# Agents, Explained: the video project

The four shorts are built in code with [Remotion](https://www.remotion.dev). Everything they use (clips, voices, music, sound effects, images) is in `../assets/`, which Remotion serves as its public folder.

## Make the shorts

From this folder:

```
npm install
node scripts/voice.mjs
npx remotion render src/index.ts short1 out/short1.mp4
node scripts/master.mjs short1
```

Swap in `short2`, `short3` and `short4` for the others. The finished files land in `../final/`. To preview and scrub through a short, run `npm run studio`.

## The scripts

- `scripts/prepare_images.py` makes Nora's cutouts from the clips, the front-page images from the sample PDFs, the app screenshots and the grain texture. Run it with the path to an ffmpeg as its argument.
- `scripts/split-take.mjs` splits one long ElevenLabs take into lines at its longest pauses, into `../assets/voice-raw/`.
- `scripts/voice.mjs` turns the raw takes into the lines the shorts play: it trims them, speeds them up 15% and writes `src/durations.json`. Run it again whenever a voice file changes.
- `scripts/master.mjs` brings a render up to -14 LUFS, the usual loudness for phone video.

## The code

- `src/kit/` holds what all four shorts share. `theme.ts` has the colours and fonts. `paper.tsx` has the notebook and newsprint pieces (sticky notes, marker strokes, cards, cutouts). `frames.tsx` has the clip, title card, page turn, Remember card, captions and music. `timing.ts` lays the scenes out from the voice lines.
- `src/short1.tsx` … `src/short4.tsx` each hold one short: its scenes and its narration. A scene can ask for the moment a word is heard, `at(line, 'word')`, and that is how ticks, stamps and sounds land on the words.
- A short's length comes from its voice lines plus each scene's `lead`, `gap` and `tail`, in seconds.
