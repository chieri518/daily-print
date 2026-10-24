import type { Paper, Story } from "./editor.ts";
import { esc } from "./html.ts";
import { css } from "./paper-css.ts";
import { crosswordHtml, jumbleHtml, sudokuHtml, triviaHtml, wordSearchHtml, type Puzzles } from "./puzzles.ts";
import {
  area,
  fontsUrl,
  LAYOUTS,
  MAIN_STORY_WORDS,
  PAPER_SIZES,
  slotWords,
  TYPEFACES,
  type Feature,
  type Settings,
} from "./settings.ts";
import { todayLine, weatherHtml } from "./weather.ts";

// Builds the newspaper as one HTML document, one <section> per printed page.
// `image` is the front-page illustration (a data URL), and `yesterday` holds the puzzles whose answers this paper prints.
export function layout(
  settings: Settings,
  date: string,
  paper: Paper,
  image: string | null,
  yesterday: Puzzles | null,
) {
  const fonts = TYPEFACES[settings.typeface];
  const size = PAPER_SIZES[settings.paperSize];
  const masthead = `
    <header class="masthead">
      <h1>${esc(settings.name)}</h1>
      <div class="meta"><span>${esc(date)}</span><span>${esc(settings.location)}</span><span>${
        paper.forecast ? todayLine(paper.forecast) : ""
      }</span></div>
    </header>
    ${
      paper.birthdays.length ? `<p class="birthdays">Birthdays today: ${paper.birthdays.map(esc).join(", ")}</p>` : ""
    }`;
  const illustration = image
    ? `<figure class="illustration"><img src="${image}" alt=""></figure>`
    : `<figure class="illustration empty"><figcaption>Illustration: ${esc(paper.illustration)}</figcaption></figure>`;
  const illustrated = settings.pages[0].slots.findIndex((s) => !s.kind); // the first slot of stories on the front page

  const features: Record<Feature, () => string> = {
    weather: () => weatherHtml(paper.forecast, paper.weatherTip),
    crossword: () => crosswordHtml(paper.puzzles.crossword, yesterday?.crossword),
    sudoku: () => sudokuHtml(paper.puzzles.sudoku, yesterday?.sudoku),
    wordSearch: () => wordSearchHtml(paper.puzzles.wordSearch),
    trivia: () => triviaHtml(paper.puzzles.trivia, yesterday?.trivia),
    jumble: () => jumbleHtml(paper.puzzles.jumble!, yesterday?.jumble),
    wordOfTheDay: () => {
      const w = paper.wordOfTheDay;
      return `<div class="word-of-the-day"><p><b class="word">${esc(w.word)}</b> <i>${esc(w.partOfSpeech)}</i></p>
        <p>${esc(w.definition)}</p><p class="example">“${esc(w.example)}”</p></div>`;
    },
  };

  const pages = settings.pages.map((page, i) => {
    const { grid, slots } = LAYOUTS[page.layout];
    const filled = page.slots.map((section, j) => {
      const [lead, ...others] = paper.pages[i]?.slots[j]?.stories ?? [];
      const big = slotWords(i, page.layout, j) >= MAIN_STORY_WORDS;
      const content = section.kind
        ? features[section.kind]()
        : `${lead ? story(lead, big ? "lead" : "", i === 0 && j === illustrated ? illustration : "") : ""}
           ${others.map((s) => story(s)).join("")}`;
      return `<div class="slot" style="grid-area: ${area(j)}; --columns: ${slots[j].columns}">
        <h3 class="section-title">${esc(section.title)}</h3>
        ${content}
      </div>`;
    });
    return `${i === 0 ? masthead : ""}<div class="slots" style='grid-template: ${grid}'>${filled.join("")}</div>`;
  });

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="${fontsUrl(fonts)}">
  <style>:root { --masthead: "${fonts.masthead}"; --headline: "${fonts.headline}"; --body: "${fonts.body}"; }</style>
  <style>${css}</style>
  <style>@page { size: ${size.width} ${size.height}; } .page { width: ${size.width}; height: ${size.height}; }</style>
</head>
<body>
${pages
  .map(
    (content, i) => `<section class="page">
  <div class="content">${content}</div>
  <footer><span>${esc(settings.name)} · ${esc(
    date,
  )}</span><span>Written by an AI editor. News stories cite their sources.</span><span>Page ${i + 1}</span></footer>
</section>`,
  )
  .join("\n")}
</body>
</html>`;
}

function story(s: Story, className = "", figure = "") {
  return `<article class="${className}">
    ${s.label ? `<p class="label">${esc(s.label)}</p>` : ""}
    <h2>${esc(s.headline)}</h2>
    <p class="deck">${esc(s.deck)}</p>
    ${figure}
    <div class="body">
      ${s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}
      ${s.sources.length ? `<p class="sources">Sources: ${s.sources.map((src) => esc(src.name)).join(", ")}</p>` : ""}
    </div>
  </article>`;
}
