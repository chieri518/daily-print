"use client";

// Small pieces of the Customize page.
import { LAYOUTS, spotCount, type Feature, type Layout } from "@/lib/settings";
import { gridAreas, spotLetter } from "@/lib/edition/space";

// A tiny drawing of a layout's spots.
export function LayoutThumb({ layout }: { layout: Layout }) {
  const { rows, areas } = LAYOUTS[layout];
  return (
    <span
      className="layout-thumb"
      style={{
        gridTemplateAreas: gridAreas(areas),
        gridTemplateRows: rows.map((r) => `${r}fr`).join(" "),
      }}
      aria-hidden
    >
      {Array.from({ length: spotCount(layout) }, (_, j) => (
        <span key={j} style={{ gridArea: spotLetter(j) }} />
      ))}
    </span>
  );
}

// A sketch of how the weather or a puzzle looks in print, shown in its section.
const CROSSWORD = "0010000100000001010000100"; // 1 = black square

export function FeaturePreview({ kind }: { kind: Feature }) {
  switch (kind) {
    case "weather":
      return (
        <span className="mini-weather">
          {["☀", "☁", "☂", "☁", "☀"].map((icon, i) => (
            <span key={i}>{icon}</span>
          ))}
        </span>
      );
    case "sudoku":
      return <span className="mini-sudoku" />;
    case "crossword":
      return (
        <span className="mini-crossword">
          {[...CROSSWORD].map((c, i) => (
            <span key={i} className={c === "1" ? "black" : ""} />
          ))}
        </span>
      );
    case "wordSearch":
      return <span className="mini-letters">QWHARVESTZBALLOTKMNTRAINOPLUSDXFOGEYRV</span>;
    case "jumble":
      return (
        <span className="mini-jumble">
          {["TEALBL", "VASHRE", "NIRTA"].map((w) => (
            <span key={w}>{w}</span>
          ))}
        </span>
      );
    case "comic":
      return (
        <span className="mini-comic">
          {["🐱", "🐦", "🐱", "🐦"].map((face, i) => (
            <span key={i}>{face}</span>
          ))}
        </span>
      );
    case "wordOfTheDay":
      return (
        <span className="mini-word">
          <b>serendipity</b> <i>noun</i>
        </span>
      );
    case "trivia":
      return (
        <span className="mini-quiz">
          {[1, 2, 3, 4].map((n) => (
            <span key={n}>{n}.</span>
          ))}
        </span>
      );
  }
}
