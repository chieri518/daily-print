// Printed newspaper, black and white. layout.ts sets the paper size. Sizes are in em so the fit step can shrink a whole page at once.
export const css = `
@page { margin: 0; }
* { box-sizing: border-box; margin: 0; }
body { font-family: var(--body), serif; color: #000; background: #fff; }

.page { padding: 0.5in; display: flex; flex-direction: column; break-after: page; }
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

/* Columns: each page is a grid of columns, and maybe a band (see layout.ts) */
.columns { flex: 1; min-height: 0; display: grid; gap: 1em 1.5em; }
.stack, .band { display: flex; flex-direction: column; gap: 1em; min-height: 0; overflow: hidden; }
.section { min-height: 0; overflow: hidden; }

/* Fillers: render.ts moves them into columns with space left */
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
.body { columns: var(--columns); column-gap: 1.5em; column-rule: 1px solid #999; text-align: justify; hyphens: auto; }
.body p + p { text-indent: 1em; }
.body .sources { text-indent: 0; font-size: 0.8em; font-style: italic; margin-top: 0.3em; }

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
.sudoku td, .crossword td, .letters td { border: 1px solid #000; text-align: center; padding: 0; }
.sudoku td { width: 1.75em; height: 1.75em; font-size: 1.05em; }
.sudoku tr:nth-child(3n) td { border-bottom-width: 2px; }
.sudoku td:nth-child(3n) { border-right-width: 2px; }
.sudoku tr:first-child td { border-top-width: 2px; }
.sudoku td:first-child { border-left-width: 2px; }
.sudoku.mini { margin: 0 0 0.5em; }
.sudoku.mini td { width: 1.25em; height: 1.25em; font-size: 0.7em; }
.crossword { display: flex; flex-wrap: wrap; gap: 0 1.5em; align-items: flex-start; }
.crossword table { margin: 0 0 0.6em; }
.crossword td { width: 1.9em; height: 1.9em; position: relative; }
.crossword td.black { border: none; }
.crossword sup { position: absolute; top: 1px; left: 2px; font-size: 0.55em; line-height: 1; }
.clues { flex: 1; min-width: 14em; font-size: 0.85em; }
.clues p { margin-bottom: 0.15em; }
.letters td { width: 1.3em; height: 1.3em; border: none; font-size: 1.05em; letter-spacing: 0; }
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

.comic img { display: block; width: 100%; filter: grayscale(1); }
.comic-text { display: grid; gap: 0.5em; }
.comic-text.strip { grid-template-columns: repeat(4, 1fr); }
.comic-text p { border: 1px solid #000; padding: 0.4em; font-size: 0.85em; }
`;
