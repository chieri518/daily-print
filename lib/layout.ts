import type { Edition, Story } from "./editor.ts";
import { css } from "./paper-css.ts";
import { fontsUrl, LAYOUTS, PAPER_SIZES, TYPEFACES, type Settings } from "./settings.ts";

// Builds the newspaper as one HTML document, one <section> per printed page.
export function layout(settings: Settings, date: string, edition: Edition) {
  const fonts = TYPEFACES[settings.typeface];
  const size = PAPER_SIZES[settings.paperSize];
  const masthead = `
    <header class="masthead">
      <h1>${esc(settings.name)}</h1>
      <div class="meta"><span>${esc(date)}</span><span>${esc(settings.location)}</span><span>${esc(edition.weather)}</span></div>
    </header>`;
  const illustration = `<figure class="illustration"><figcaption>Illustration: ${esc(edition.illustration)}</figcaption></figure>`;

  const pages = settings.pages.map((page, i) => {
    const { grid, slots } = LAYOUTS[page.layout];
    const filled = page.slots.map((section, j) => {
      const [lead, ...others] = edition.pages[i]?.slots[j]?.stories ?? [];
      const big = slots[j].words >= 300;
      return `<div class="slot" style="grid-area: ${"abc"[j]}; --columns: ${slots[j].columns}">
        <h3 class="section-title">${esc(section.title)}</h3>
        ${lead ? story(lead, big ? "lead" : "", i === 0 && j === 0 ? illustration : "") : ""}
        ${others.map((s) => story(s)).join("")}
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
  <footer><span>${esc(settings.name)} · ${esc(date)}</span><span>Written by an AI editor. News stories cite their sources.</span><span>Page ${i + 1}</span></footer>
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

// Escapes text from Claude so it can't break the HTML.
function esc(text: string) {
  return text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}
