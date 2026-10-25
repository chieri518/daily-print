import type { Paper, Story } from "./editor.ts";
import { esc } from "./html.ts";
import { css } from "./paper-css.ts";
import { crosswordHtml, jumbleHtml, sudokuHtml, triviaHtml, wordSearchHtml, type Puzzles } from "./puzzles.ts";
import {
  fontsUrl,
  illustrated,
  MAIN_STORY_WORDS,
  pageItems,
  PAPER_SIZES,
  STRIP_WIDTH,
  TYPEFACES,
  type Feature,
  type Item,
  type Settings,
} from "./settings.ts";
import { BAND_SHARE, gridPlaces, measure, WEIGHT, words } from "./space.ts";
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
  const figureFor = (s: Story, page: number, section: number) =>
    scene && page === 0 && section === 0 && illustrated(settings) && s.headline === headline ? illustration : "";

  const features: Record<Feature, (width: number) => string> = {
    weather: () => weatherHtml(paper.forecast, paper.weatherTip),
    crossword: () => crosswordHtml(paper.puzzles.crossword, yesterday?.crossword),
    sudoku: () => sudokuHtml(paper.puzzles.sudoku, yesterday?.sudoku),
    wordSearch: () => wordSearchHtml(paper.puzzles.wordSearch),
    trivia: () => triviaHtml(paper.puzzles.trivia, yesterday?.trivia),
    jumble: () => jumbleHtml(paper.puzzles.jumble!, yesterday?.jumble),
    // Without an image key, the comic prints as its four panels in words.
    comic: (width) =>
      images.comic
        ? `<figure class="comic"><img src="${images.comic}" alt=""></figure>`
        : `<div class="comic-text${width > STRIP_WIDTH ? " strip" : ""}">${paper.comic.panels
            .map((p) => `<p>${esc(p.scene)}${p.dialogue ? ` <b>“${esc(p.dialogue)}”</b>` : ""}</p>`)
            .join("")}</div>`,
    wordOfTheDay: () => {
      const w = paper.wordOfTheDay;
      return `<div class="word-of-the-day"><p><b class="word">${esc(w.word)}</b> <i>${esc(w.partOfSpeech)}</i></p>
        <p>${esc(w.definition)}</p><p class="example">“${esc(w.example)}”</p></div>`;
    },
  };

  // Each page is a grid: one row of columns, plus a row for the band if it has one. Stories in a column share its
  // height by their length; the weather and puzzles take the height they need.
  const pages = settings.pages.map((page, i) => {
    const space = measure(page, i === 0, settings.paperSize);
    const stories = paper.pages[i]?.sections ?? [];
    const section = (item: Item, j: number, columns: number, grow: number) => {
      const [lead, ...others] = stories[j]?.stories ?? [];
      const big = words(space[j]) >= MAIN_STORY_WORDS;
      const kind = item.section.kind;
      const content = kind
        ? features[kind](space[j].width)
        : `${lead ? story(lead, big ? "lead" : "", figureFor(lead, i, j)) : ""}
           ${others.map((s) => story(s, "", figureFor(s, i, j))).join("")}`;
      // Stories share the free height by `grow`; the weather and puzzles keep the height they need, and grow only to
      // take what's left.
      return `<div class="section" style="--columns: ${columns}; flex: ${grow} ${kind ? "0 auto" : "1 0"}">
        <h3 class="section-title">${esc(item.section.title)}</h3>
        ${content}
      </div>`;
    };

    const { band, columns } = page;
    const places = gridPlaces(page);
    let j = band ? 1 : 0;
    const stacks = page.stacks.map((stack, k) => {
      // The stories share the column; with none, the last section takes what's left (for fillers).
      const grows = stack.map((s, n) =>
        s.section.kind ? (stack.every((x) => x.section.kind) && n === stack.length - 1 ? 1 : 0) : WEIGHT[s.length],
      );
      const { column, row } = places.column(k);
      return `<div class="stack" style="grid-column: ${column}; grid-row: ${row}">${stack
        .map((s, n) => section(s, j++, 1, grows[n]))
        .join("")}</div>`;
    });
    const bandHtml = band
      ? `<div class="band" style="grid-column: ${places.band.column}; grid-row: ${places.band.row}">${section(
          band.item,
          0,
          band.rail === "none" ? columns : columns - 1,
          1,
        )}</div>`
      : "";
    // A band of stories gets its share of the height; the weather or a puzzle in the band takes what it needs.
    const share = band && !band.item.section.kind ? BAND_SHARE[band.item.length] : null;
    const bandSize = share ? `${share}fr` : "auto";
    const restSize = share ? `${1 - share}fr` : "1fr";
    const rows = !band ? "1fr" : band.at === "top" ? `${bandSize} ${restSize}` : `${restSize} ${bandSize}`;
    return `${
      i === 0 ? masthead : ""
    }<div class="columns" style="grid-template: ${rows} / repeat(${columns}, 1fr)">${bandHtml}${stacks.join("")}</div>`;
  });

  // Small items for columns with space left. render.ts puts each where it fits, or leaves it out. "On this day" is left
  // out when the paper has a section of that name.
  const { quote, funFact, onThisDay } = paper.fillers;
  const hasOnThisDay = settings.pages.some((p) => pageItems(p).some((item) => item.section.title === "On This Day"));
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
