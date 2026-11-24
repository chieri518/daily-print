// The newspaper's stylesheet, black and white, for newspaper.tsx. Everything is scoped to .paper, so it can sit inside the
// web app without clashing with its styles. Sizes are in em so the layout step can shrink a whole section at once.
export const css = `
.paper {
font: 16px/normal var(--body), serif; color: #000; background: #fff;
& * { box-sizing: border-box; margin: 0; }

.page { width: var(--page-width); height: var(--page-height); padding: 0.5in; display: flex; flex-direction: column; break-after: page; }
.content { flex: 1; display: flex; flex-direction: column; overflow: hidden; font-size: 10pt; line-height: 1.35; }
footer { display: flex; justify-content: space-between; border-top: 1px solid #000; padding-top: 4pt; font-size: 7pt; }

/* Front page */
.masthead { text-align: center; border-bottom: 3px double #000; margin-bottom: 1em; }
.masthead h1 { font-family: var(--masthead), serif; font-size: 5em; font-weight: normal; line-height: 1.15; }
.masthead .meta { display: flex; justify-content: space-between; border-top: 1px solid #000; padding: 3pt 0; font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.05em; }
.illustration { aspect-ratio: 3 / 1; margin-bottom: 0.7em; }
.illustration img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1) contrast(1.1); }
.illustration.empty { display: flex; align-items: flex-end; border: 1px dashed #000; padding: 0.5em; }
.illustration figcaption { font-size: 0.8em; font-style: italic; }

/* Spots: each page is its layout's grid of 6 tracks (see LAYOUTS in lib/settings.ts), one section per spot */
.spots { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 1em 1.5em; }
.section { display: flex; flex-direction: column; min-height: 0; overflow: hidden; container-type: inline-size; }

/* Fillers: render.ts moves them into sections with space left */
.fillers { display: none; }
.filler { margin-top: 0.8em; padding: 0.5em 0; border-top: 3px double #000; border-bottom: 1px solid #000; text-align: center; }
.filler b { font-size: 0.75em; text-transform: uppercase; letter-spacing: 0.1em; }
.filler p { font-family: var(--headline), serif; font-style: italic; margin-top: 0.2em; }
.filler .by { font-family: var(--body), serif; font-style: normal; font-size: 0.85em; }
.section-title { font-family: var(--headline), serif; font-size: 1.2em; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 3px double #000; padding-bottom: 2pt; margin-bottom: 0.6em; }

/* Stories */
article { border-bottom: 1px solid #000; padding-bottom: 0.8em; margin-bottom: 0.8em; }
article:last-child { border-bottom: none; }
h2 { font-family: var(--headline), serif; font-size: 1.6em; line-height: 1.1; margin-bottom: 0.2em; }
.lead h2 { font-size: 2.4em; }
.label { font-size: 0.75em; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; }
.deck { font-style: italic; margin-bottom: 0.5em; }
.body { columns: var(--columns); column-gap: 1.5em; column-rule: 1px solid #999; text-align: justify; }
.body p:not(:first-child, .sources) { text-indent: 1em; }
.pull-quote { margin: 0.5em 0; padding: 0.4em 0; border-top: 2px solid #000; border-bottom: 1px solid #000; font-family: var(--headline), serif; font-size: 1.25em; font-style: italic; line-height: 1.2; text-align: center; break-inside: avoid; }
.body .sources { text-indent: 0; font-size: 0.8em; font-style: italic; margin-top: 0.3em; }

/* A compact chronology below each news story, shared by screen and print. */
.story-timeline { margin-top: 0.7em; padding-top: 0.45em; border-top: 1px solid #999; break-inside: avoid; }
.timeline-title { font-size: 0.65em; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.55em; }
.story-timeline ol { display: flex; list-style: none; padding: 0; }
.story-timeline li { flex: 1; min-width: 0; position: relative; border-top: 1px solid #999; padding: 0.65em 0.8em 0 0; font-size: 0.75em; line-height: 1.3; overflow-wrap: anywhere; }
.story-timeline li::before { content: ""; position: absolute; top: -0.25em; left: 0; width: 0.5em; height: 0.5em; border: 1px solid #000; border-radius: 50%; background: #fff; }
.story-timeline li:last-child::before { background: #000; }
.timeline-date { display: block; font-weight: bold; margin-bottom: 0.2em; }
.timeline-impact { border-top: 1px solid #ddd; margin-top: 0.35em; padding-top: 0.35em; font-size: 0.72em; line-height: 1.3; }
.timeline-impact b { text-transform: uppercase; letter-spacing: 0.04em; }
@container (max-width: 2.5in) {
  .story-timeline ol { display: block; }
  .story-timeline li { border-top: none; border-left: 1px solid #999; padding: 0 0 0.65em 1em; }
  .story-timeline li::before { top: 0.35em; left: -0.3em; }
  .story-timeline li:last-child { padding-bottom: 0; }
}

.small { font-size: 0.75em; }

/* Weather */
.weather .days { display: grid; grid-template-columns: repeat(5, 1fr); border: 1px solid #000; }
.weather .day { display: flex; flex-direction: column; align-items: center; padding: 0.3em; text-align: center; border-left: 1px solid #000; }
.weather .day:first-child { border-left: none; }
.weather .icon { width: 2.8em; height: 2.8em; }
.weather .condition { font-size: 0.85em; }
.weather .temps { font-size: 1.15em; }
.almanac { margin-top: 0.3em; text-align: center; font-size: 0.8em; }
.weather-tip { font-family: var(--headline), serif; font-style: italic; text-align: center; margin-top: 0.4em; font-size: 1.1em; }

/* Puzzles */
table { border-collapse: collapse; margin: 0 auto 0.6em; }
.sudoku td, .crossword td, .letters td { border: 1px solid #000; text-align: center; padding: 0; line-height: 1; }
.sudoku td { width: 1.6em; height: 1.6em; font-size: 1em; }
.sudoku tr:nth-child(3n) td { border-bottom-width: 2px; }
.sudoku td:nth-child(3n) { border-right-width: 2px; }
.sudoku tr:first-child td { border-top-width: 2px; }
.sudoku td:first-child { border-left-width: 2px; }
.sudoku.mini { margin: 0 0 0.5em; }
.sudoku.mini td { width: 1.1em; height: 1.1em; font-size: 0.6em; }
.crossword { display: flex; flex-wrap: wrap; gap: 0 1.5em; align-items: flex-start; }
.crossword table { margin: 0 0 0.6em; }
.crossword td { width: 1.6em; height: 1.6em; position: relative; }
.crossword td.black { border: none; }
.crossword sup { position: absolute; top: 1px; left: 2px; font-size: 0.55em; line-height: 1; }
.clues { flex: 1; min-width: 14em; font-size: 0.85em; }
.clues p { margin-bottom: 0.15em; }
.letters td { width: 1.15em; height: 1.15em; border: none; font-size: 1.05em; letter-spacing: 0; }
.word-search .words { text-align: center; font-size: 0.85em; }
.trivia { padding-left: 1.3em; }
.trivia li { margin-bottom: 0.5em; }
.yesterday { margin-top: 0.6em; padding-top: 0.4em; border-top: 1px solid #000; font-size: 0.85em; }
.yesterday b { display: block; margin-bottom: 0.2em; }
.yesterday .sudoku.mini { margin: 0; }

.birthdays { margin: -0.6em 0 0.8em; text-align: center; font-size: 0.9em; }

/* Jumble and Word of the Day */
.jumble { display: grid; gap: 0.6em; }
.jumble-word { display: flex; flex-wrap: wrap; gap: 0.3em 1em; align-items: center; }
.jumble-word span span { display: inline-block; width: 1.6em; height: 1.6em; margin-right: 2px; text-align: center; line-height: 1.6em; border: 1px solid #000; }
.jumble-word .tiles span { font-weight: bold; border-radius: 50%; }
.word-of-the-day p { margin-bottom: 0.3em; }
.word-of-the-day .word { font-family: var(--headline), serif; font-size: 1.6em; }
.word-of-the-day .example { font-style: italic; }

/* The comic shrinks to fit its spot rather than being cut off */
.comic { flex: 0 1 auto; min-height: 0; display: flex; }
.comic img { width: 100%; max-height: 100%; object-fit: contain; object-position: top; filter: grayscale(1); }
.comic-text { display: grid; gap: 0.5em; }
.comic-text.strip { grid-template-columns: repeat(4, 1fr); }
.comic-text.square { grid-template-columns: repeat(2, 1fr); }
.comic-text p { border: 1px solid #000; padding: 0.4em; font-size: 0.85em; }

/* In a wide spot, the crossword's clues use two columns */
@container (min-width: 5in) {
  .clues { columns: 2; column-gap: 1.5em; }
}

/* The weather in a narrow spot: one row per day */
@container (max-width: 3.4in) {
  .weather .days { grid-template-columns: 1fr; }
  .weather .day { flex-direction: row; justify-content: space-between; gap: 0.4em; border-left: none; border-top: 1px solid #000; padding: 0 0.3em; }
  .weather .day:first-child { border-top: none; }
  .weather .icon { width: 1.4em; height: 1.4em; }
  .weather .day strong { width: 3em; text-align: left; }
  .weather .condition, .weather .day .small { display: none; }
  .almanac { font-size: 0.7em; }
  .weather-tip { font-size: 1em; }
}

/* On screen (the Paper page), the pages sit on the web page's own background, side by side: the reader scrolls (or
   turns) from one page to the next, and each page stops in the middle. */
@media screen {
  & { background: none; display: flex; gap: 0.5in; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none;
      padding-inline: max(0px, (100% - var(--page-width)) / 2); }
  .page { flex: none; scroll-snap-align: center; }
}
}
`;
