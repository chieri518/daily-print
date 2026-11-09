import type { ReactNode } from "react";
import type { Paper } from "./editor.ts";
import type { Crossword, Puzzles } from "./puzzles.ts";
import { airLabel, condition, type Forecast, type Icon } from "./weather.ts";

// The paper's features, drawn by paper.tsx: the forecast, the puzzles (each with yesterday's answers) and the word.

// The forecast as printed: one column per day with an icon, today's almanac line, then the tip.
export function Weather({ forecast: f, tip }: { forecast: Forecast | null; tip: string }) {
  if (!f) return <p className="weather-tip">The forecast wasn't available today.</p>;
  const almanac = [
    `Sunrise ${f.sunrise}`,
    `Sunset ${f.sunset}`,
    `Daylight ${f.daylight}`,
    f.moon,
    f.airQuality !== null && `Air quality ${f.airQuality}, ${airLabel(f.airQuality).toLowerCase()}`,
  ].filter(Boolean);
  return (
    <div className="weather">
      <div className="days">
        {f.days.map((d, i) => {
          const { label, icon } = condition(d.code);
          const name = i === 0 ? "Today" : new Date(`${d.date}T12:00`).toLocaleDateString("en-US", { weekday: "short" });
          return (
            <div className="day" key={d.date}>
              <strong>{name}</strong>
              {ICONS[icon]}
              <span className="condition">{label}</span>
              <span className="temps">
                <b>{d.high}°</b> / {d.low}°
              </span>
              <span className="small">
                Rain {d.rain}% · Wind {d.wind} {f.windUnit}
              </span>
            </div>
          );
        })}
      </div>
      <p className="almanac">{almanac.join(" · ")}</p>
      <p className="weather-tip">{tip}</p>
    </div>
  );
}

// Black-and-white line icons for print.
const cloud = <path d="M14 34h22a8 8 0 0 0 0-16 11 11 0 0 0-21-2 9 9 0 0 0-1 18z" fill="#fff" stroke="#000" strokeWidth="2" />;
const sun = (x: number, y: number, r: number) => (
  <>
    <circle cx={x} cy={y} r={r} fill="#fff" stroke="#000" strokeWidth="2" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
      const c = Math.cos((a * Math.PI) / 180),
        s = Math.sin((a * Math.PI) / 180);
      return (
        <line key={a} x1={x + c * (r + 3)} y1={y + s * (r + 3)} x2={x + c * (r + 7)} y2={y + s * (r + 7)} stroke="#000" strokeWidth="2" />
      );
    })}
  </>
);
const drops = (d: string) => <path d={d} stroke="#000" strokeWidth="2" fill="none" />;
const svg = (body: ReactNode) => (
  <svg className="icon" viewBox="0 0 48 48">
    {body}
  </svg>
);

const ICONS: Record<Icon, ReactNode> = {
  sun: svg(sun(24, 24, 9)),
  partly: svg(
    <>
      {sun(30, 16, 7)}
      {cloud}
    </>,
  ),
  cloud: svg(cloud),
  fog: svg(
    <>
      {cloud}
      {drops("M10 40h28M14 45h20")}
    </>,
  ),
  rain: svg(
    <>
      {cloud}
      {drops("M17 38l-2 6M25 38l-2 6M33 38l-2 6")}
    </>,
  ),
  snow: svg(
    <>
      {cloud}
      <g fontSize="8" textAnchor="middle">
        <text x="16" y="45">*</text>
        <text x="25" y="45">*</text>
        <text x="34" y="45">*</text>
      </g>
    </>,
  ),
  storm: svg(
    <>
      {cloud}
      <path d="M26 34l-5 7h5l-3 6" stroke="#000" strokeWidth="2" fill="none" />
    </>,
  ),
};

// --- The puzzles ---

function Table({ rows, className }: { rows: ReactNode[][]; className: string }) {
  return (
    <table className={className}>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r}>{row}</tr>
        ))}
      </tbody>
    </table>
  );
}

// Each puzzle prints with yesterday's answers below it, when there was a puzzle yesterday.
const answers = (content: ReactNode) =>
  content && (
    <div className="yesterday">
      <b>Yesterday's answers</b>
      {content}
    </div>
  );

const grid9 = (cells: number[], className: string) => (
  <Table
    className={className}
    rows={Array.from({ length: 9 }, (_, r) =>
      Array.from({ length: 9 }, (_, c) => <td key={c}>{cells[r * 9 + c] || ""}</td>),
    )}
  />
);

export function Sudoku({ puzzle, yesterday }: { puzzle: Puzzles["sudoku"]; yesterday?: Puzzles["sudoku"] }) {
  return (
    <>
      {grid9(puzzle.puzzle, "sudoku")}
      {answers(yesterday && grid9(yesterday.solution, "sudoku mini"))}
    </>
  );
}

export function CrosswordPuzzle({ puzzle, yesterday }: { puzzle: Crossword; yesterday?: Crossword }) {
  const rows = puzzle.grid.map((row) =>
    row.map((cell, c) => (cell ? <td key={c}>{cell.n ? <sup>{cell.n}</sup> : ""}</td> : <td key={c} className="black" />)),
  );
  const list = (title: string, clues: Crossword["across"]) => (
    <>
      <p>
        <b>{title}</b>
      </p>
      {clues.map((c) => (
        <p key={c.n}>
          {c.n}. {c.clue}
        </p>
      ))}
    </>
  );
  const words = (list: Crossword["across"]) => list.map((w) => `${w.n} ${w.answer}`).join(", ");
  return (
    <>
      <div className="crossword">
        <Table rows={rows} className="grid" />
        <div className="clues">
          {list("Across", puzzle.across)}
          {list("Down", puzzle.down)}
        </div>
      </div>
      {answers(
        yesterday && (
          <p>
            Across: {words(yesterday.across)}. Down: {words(yesterday.down)}.
          </p>
        ),
      )}
    </>
  );
}

// No answers for the word search: its words are already listed.
export function WordSearch({ puzzle }: { puzzle: Puzzles["wordSearch"] }) {
  return (
    <div className="word-search">
      <Table rows={puzzle.grid.map((row) => [...row].map((l, c) => <td key={c}>{l}</td>))} className="grid letters" />
      <p className="words">{puzzle.words.join(" · ")}</p>
    </div>
  );
}

// Each scrambled word in tiles, with empty squares to write the answer.
export function Jumble({ puzzle, yesterday }: { puzzle: NonNullable<Puzzles["jumble"]>; yesterday?: Puzzles["jumble"] }) {
  return (
    <>
      <div className="jumble">
        {puzzle.scrambled.map((word, w) => (
          <div className="jumble-word" key={w}>
            <span className="tiles">
              {[...word].map((l, n) => (
                <span key={n}>{l}</span>
              ))}
            </span>
            <span className="blanks">
              {[...word].map((_, n) => (
                <span key={n} />
              ))}
            </span>
          </div>
        ))}
      </div>
      {answers(yesterday && <p>{yesterday.words.join(" · ")}</p>)}
    </>
  );
}

export function Trivia({ puzzle, yesterday }: { puzzle: Puzzles["trivia"]; yesterday?: Puzzles["trivia"] }) {
  return (
    <>
      <ol className="trivia">
        {puzzle.map((t, n) => (
          <li key={n}>{t.question}</li>
        ))}
      </ol>
      {answers(yesterday && <p>{yesterday.map((t, i) => `${i + 1}. ${t.answer}`).join(" · ")}</p>)}
    </>
  );
}

export function WordOfTheDay({ word: w }: { word: Paper["wordOfTheDay"] }) {
  return (
    <div className="word-of-the-day">
      <p>
        <b className="word">{w.word}</b> <i>{w.partOfSpeech}</i>
      </p>
      <p>{w.definition}</p>
      <p className="example">“{w.example}”</p>
    </div>
  );
}
