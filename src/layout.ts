import { readFileSync } from "node:fs";
import type { Edition, Settings, Story } from "./editor.ts";

// Font sets readers can choose with "typeface" in paper.json. All are free Google Fonts.
const TYPEFACES: Record<string, { masthead: string; headline: string; body: string }> = {
  classic: { masthead: "UnifrakturMaguntia", headline: "Playfair Display", body: "Source Serif 4" },
  caslon: { masthead: "Libre Caslon Display", headline: "Libre Caslon Text", body: "Libre Caslon Text" },
  bodoni: { masthead: "Bodoni Moda", headline: "Bodoni Moda", body: "Newsreader" },
};

const css = readFileSync(new URL("./paper.css", import.meta.url), "utf8");

// Builds the newspaper as one HTML document, one <section> per printed page.
export function layout(settings: Settings, date: string, edition: Edition) {
  const fonts = TYPEFACES[settings.typeface];
  if (!fonts) throw new Error(`Unknown typeface "${settings.typeface}". Choose one of: ${Object.keys(TYPEFACES).join(", ")}`);

  const [lead, ...others] = edition.frontPage;
  const frontPage = `
    <header class="masthead">
      <h1>${esc(settings.name)}</h1>
      <div class="meta"><span>${esc(date)}</span><span>${esc(settings.location)}</span><span>${esc(edition.weather)}</span></div>
    </header>
    ${story(lead, "lead", `<figure class="illustration"><figcaption>Illustration: ${esc(edition.illustration)}</figcaption></figure>`)}
    <div class="pair">${others.map((s) => story(s)).join("")}</div>`;

  const pages = [
    frontPage,
    ...edition.pages.map((p) => `<h1 class="section-title">${esc(p.title)}</h1>${p.stories.map((s) => story(s)).join("")}`),
  ];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="${fontsUrl(fonts)}">
  <style>:root { --masthead: "${fonts.masthead}"; --headline: "${fonts.headline}"; --body: "${fonts.body}"; }</style>
  <style>${css}</style>
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

// Loads each font once, with the weights its role needs (later roles win if a font is reused).
function fontsUrl(fonts: { masthead: string; headline: string; body: string }) {
  const axes = { [fonts.masthead]: "", [fonts.headline]: ":wght@700" };
  axes[fonts.body] = ":ital,wght@0,400;0,700;1,400";
  const families = Object.entries(axes).map(([name, axis]) => `family=${name.replaceAll(" ", "+")}${axis}`);
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=block`;
}

// Escapes text from Claude so it can't break the HTML.
function esc(text: string) {
  return text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}
