import type { Paper, Story } from "./editor.ts";
import { esc } from "./html.ts";
import { css } from "./paper-css.ts";
import { crosswordHtml, jumbleHtml, sudokuHtml, triviaHtml, wordSearchHtml, type Puzzles } from "./puzzles.ts";
import {
  comicShape,
  fontsUrl,
  LAYOUTS,
  MAIN_STORY_WORDS,
  PAPER_SIZES,
  TYPEFACES,
  type Feature,
  type Settings,
} from "./settings.ts";
import { filledAreas, illustratedSpot, measure, spotLetter, textColumns, words, type Size } from "./space.ts";
import { todayLine, weatherHtml } from "./weather.ts";

// Builds the newspaper as one HTML document, one <section> per printed page.
// `images` are the drawn illustration and comic (data URLs, or null), and `yesterday` holds the puzzles whose answers
// this paper prints.
export function layout(
  settings: Settings,
  date: string,
  paper: Paper,
  images: { illustration: string | null; comic: string | null },
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
  // The illustration goes with the story the editor chose for it, or nowhere if it chose none.
  const { headline, scene } = paper.illustration;
  const illustration = images.illustration
    ? `<figure class="illustration"><img src="${images.illustration}" alt=""></figure>`
    : `<figure class="illustration empty"><figcaption>Illustration: ${esc(scene)}</figcaption></figure>`;
  const illustrated = illustratedSpot(settings);
  const figureFor = (s: Story, page: number, slot: number) =>
    scene && page === 0 && slot === illustrated && s.headline === headline ? illustration : "";

  const features: Record<Feature, (size: Size) => string> = {
    weather: () => weatherHtml(paper.forecast, paper.weatherTip),
    crossword: () => crosswordHtml(paper.puzzles.crossword, yesterday?.crossword),
    sudoku: () => sudokuHtml(paper.puzzles.sudoku, yesterday?.sudoku),
    wordSearch: () => wordSearchHtml(paper.puzzles.wordSearch),
    trivia: () => triviaHtml(paper.puzzles.trivia, yesterday?.trivia),
    jumble: () => jumbleHtml(paper.puzzles.jumble!, yesterday?.jumble),
    // Without an image key, the comic prints as its four panels in words.
    comic: (size) =>
      images.comic
        ? `<figure class="comic"><img src="${images.comic}" alt=""></figure>`
        : `<div class="comic-text ${comicShape(size)}">${paper.comic.panels
            .map((p) => `<p>${esc(p.scene)}${p.dialogue ? ` <b>“${esc(p.dialogue)}”</b>` : ""}</p>`)
            .join("")}</div>`,
    wordOfTheDay: () => {
      const w = paper.wordOfTheDay;
      return `<div class="word-of-the-day"><p><b class="word">${esc(w.word)}</b> <i>${esc(w.partOfSpeech)}</i></p>
        <p>${esc(w.definition)}</p><p class="example">“${esc(w.example)}”</p></div>`;
    },
  };

  // Each page is its layout's grid. Empty spots are taken over by a section next to them (see filledAreas).
  const pages = settings.pages.map((page, i) => {
    const space = measure(page, i === 0, settings.paperSize);
    const stories = paper.pages[i]?.sections ?? [];
    let k = 0; // the editor writes stories for the filled spots, in order
    const sections = page.slots.map((section, j) => {
      if (!section) return "";
      const size = space[j]!;
      const [lead, ...others] = stories[k++]?.stories ?? [];
      const content = section.kind
        ? features[section.kind](size)
        : `${lead ? story(lead, words(size) >= MAIN_STORY_WORDS ? "lead" : "", figureFor(lead, i, j)) : ""}
           ${others.map((s) => story(s, "", figureFor(s, i, j))).join("")}`;
      return `<div class="section" style="grid-area: ${spotLetter(j)}; --columns: ${textColumns(size.width)}">
        <h3 class="section-title">${esc(section.title)}</h3>
        ${content}
      </div>`;
    });
    const areas = filledAreas(page)
      .map((row) => `"${row.join(" ")}"`)
      .join(" ");
    const rows = LAYOUTS[page.layout].rows.map((r) => `minmax(0, ${r}fr)`).join(" ");
    return `${
      i === 0 ? masthead : ""
    }<div class="spots" style='grid-template-areas: ${areas}; grid-template-rows: ${rows}'>${sections.join("")}</div>`;
  });

  // Small items for sections with space left. render.ts puts each where it fits, or leaves it out. "On this day" is
  // left out when the paper has a section of that name.
  const { quote, funFact, onThisDay } = paper.fillers;
  const hasOnThisDay = settings.pages.some((p) => p.slots.some((s) => s?.title === "On This Day"));
  const fillers = `<div class="fillers">
    <aside class="filler"><b>Quote of the day</b><p>“${esc(quote.text)}”</p><p class="by">${esc(quote.by)}</p></aside>
    <aside class="filler"><b>Fun fact</b><p>${esc(funFact)}</p></aside>
    ${hasOnThisDay ? "" : `<aside class="filler"><b>On this day</b><p>${esc(onThisDay)}</p></aside>`}
  </div>`;

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
${fillers}
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
