// Puzzles made by code, so they are always solvable. Claude only picks the words, clues and quiz questions.
// Each puzzle uses a seeded random generator, so making the same edition again gives the same puzzles.
import { esc } from "./html.ts";

export type Clue = { answer: string; clue: string };
// Grid squares are null where black; numbered squares start a word.
export type Crossword = {
  grid: ({ letter: string; n?: number } | null)[][];
  across: (Clue & { n: number })[];
  down: (Clue & { n: number })[];
};
export type Puzzles = {
  sudoku: { puzzle: number[]; solution: number[] };
  crossword: Crossword;
  wordSearch: { grid: string[]; words: string[] };
  trivia: { question: string; answer: string }[];
};

export function makePuzzles(
  seed: string,
  words: { crossword: Clue[]; wordSearch: string[]; trivia: Puzzles["trivia"] },
): Puzzles {
  const rand = random(seed);
  return {
    sudoku: sudoku(rand),
    crossword: crossword(words.crossword, rand),
    wordSearch: wordSearch(words.wordSearch, rand),
    trivia: words.trivia,
  };
}

// A small, fast seeded random number generator (mulberry32).
function random(seed: string) {
  let h = [...seed].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761), 1);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const shuffle = <T>(items: T[], rand: () => number) =>
  items
    .map((x) => [rand(), x] as const)
    .sort((a, b) => a[0] - b[0])
    .map(([, x]) => x);
const letters = (word: string) => word.toUpperCase().replace(/[^A-Z]/g, "");

// --- Sudoku: fill a grid, then remove numbers while the puzzle still has exactly one solution ---

function sudoku(rand: () => number) {
  const grid = Array<number>(81).fill(0);
  solve(grid, rand);
  const solution = [...grid];
  let removed = 0;
  for (const i of shuffle([...Array(81).keys()], rand)) {
    if (removed === 50) break; // leaves 31 clues: medium difficulty
    const keep = grid[i];
    grid[i] = 0;
    if (countSolutions([...grid], 2) === 1) removed++;
    else grid[i] = keep;
  }
  return { puzzle: grid, solution };
}

const allowed = (g: number[], i: number, n: number) => {
  const r = Math.floor(i / 9),
    c = i % 9,
    br = r - (r % 3),
    bc = c - (c % 3);
  for (let k = 0; k < 9; k++) {
    if (g[r * 9 + k] === n || g[k * 9 + c] === n || g[(br + Math.floor(k / 3)) * 9 + bc + (k % 3)] === n) return false;
  }
  return true;
};

// Fills the empty cells in random order of digits. Returns false if it can't.
function solve(g: number[], rand: () => number): boolean {
  const i = g.indexOf(0);
  if (i < 0) return true;
  for (const n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rand)) {
    if (!allowed(g, i, n)) continue;
    g[i] = n;
    if (solve(g, rand)) return true;
  }
  g[i] = 0;
  return false;
}

function countSolutions(g: number[], limit: number): number {
  const i = g.indexOf(0);
  if (i < 0) return 1;
  let count = 0;
  for (let n = 1; n <= 9 && count < limit; n++) {
    if (!allowed(g, i, n)) continue;
    g[i] = n;
    count += countSolutions(g, limit - count);
  }
  g[i] = 0;
  return count;
}

// --- Crossword: lay the words out so each one crosses another, then number them ---

function crossword(clues: Clue[], rand: () => number): Crossword {
  const size = 13;
  const cells = new Map<string, { letter: string; across: boolean; down: boolean }>();
  const placed: (Clue & { word: string; r: number; c: number; down: boolean })[] = [];
  const at = (r: number, c: number) => cells.get(`${r},${c}`);

  // Whether a word fits at r, c without touching other words except where it crosses them.
  const crossings = (word: string, r: number, c: number, down: boolean) => {
    const [dr, dc] = down ? [1, 0] : [0, 1];
    if (r < 0 || c < 0 || r + dr * word.length > size || c + dc * word.length > size) return -1;
    if (at(r - dr, c - dc) || at(r + dr * word.length, c + dc * word.length)) return -1;
    let count = 0;
    for (let i = 0; i < word.length; i++) {
      const [y, x] = [r + dr * i, c + dc * i];
      const cell = at(y, x);
      if (cell) {
        if (cell.letter !== word[i] || (down ? cell.down : cell.across)) return -1;
        count++;
      } else if (at(y + dc, x + dr) || at(y - dc, x - dr)) return -1; // a side neighbor would form a stray word
    }
    return count;
  };

  const place = (clue: Clue, word: string, r: number, c: number, down: boolean) => {
    for (let i = 0; i < word.length; i++) {
      const key = `${down ? r + i : r},${down ? c : c + i}`;
      const cell = cells.get(key) ?? { letter: word[i], across: false, down: false };
      cells.set(key, { ...cell, [down ? "down" : "across"]: true });
    }
    placed.push({ ...clue, word, r, c, down });
  };

  const words = clues
    .map((clue) => ({ clue, word: letters(clue.answer) }))
    .filter(({ word }) => word.length >= 3 && word.length <= size)
    .sort((a, b) => b.word.length - a.word.length);
  for (const [k, { clue, word }] of words.entries()) {
    if (k === 0) {
      place(clue, word, Math.floor(size / 2), Math.floor((size - word.length) / 2), false);
      continue;
    }
    // Try every spot where this word crosses a letter already on the grid; keep the one with the most crossings.
    let best: { r: number; c: number; down: boolean; score: number } | null = null;
    for (const [key, cell] of cells) {
      const [y, x] = key.split(",").map(Number);
      for (let i = 0; i < word.length; i++) {
        if (word[i] !== cell.letter) continue;
        for (const down of [true, false]) {
          const [r, c] = down ? [y - i, x] : [y, x - i];
          const score = crossings(word, r, c, down);
          if (score > 0 && (!best || score + rand() > best.score)) best = { r, c, down, score };
        }
      }
    }
    if (best) place(clue, word, best.r, best.c, best.down);
  }

  // Crop to the used area and number the starting squares, left to right, top to bottom.
  const keys = [...cells.keys()].map((k) => k.split(",").map(Number));
  const top = Math.min(...keys.map(([r]) => r)),
    left = Math.min(...keys.map(([, c]) => c));
  const bottom = Math.max(...keys.map(([r]) => r)),
    right = Math.max(...keys.map(([, c]) => c));
  const starts = [...new Set(placed.map((p) => `${p.r - top},${p.c - left}`))].sort((a, b) => {
    const [ar, ac] = a.split(",").map(Number),
      [br, bc] = b.split(",").map(Number);
    return ar - br || ac - bc;
  });
  const grid = Array.from({ length: bottom - top + 1 }, (_, r) =>
    Array.from({ length: right - left + 1 }, (_, c) => {
      const letter = at(r + top, c + left)?.letter;
      const n = starts.indexOf(`${r},${c}`) + 1;
      return letter ? { letter, ...(n && { n }) } : null;
    }),
  );
  const numbered = placed.map((p) => ({
    n: starts.indexOf(`${p.r - top},${p.c - left}`) + 1,
    answer: p.word,
    clue: p.clue,
    down: p.down,
  }));
  const byNumber = (a: { n: number }, b: { n: number }) => a.n - b.n;
  return {
    grid,
    across: numbered
      .filter((p) => !p.down)
      .sort(byNumber)
      .map(({ n, answer, clue }) => ({ n, answer, clue })),
    down: numbered
      .filter((p) => p.down)
      .sort(byNumber)
      .map(({ n, answer, clue }) => ({ n, answer, clue })),
  };
}

// --- Word search: hide the words across, down and diagonally, then fill the gaps with random letters ---

function wordSearch(list: string[], rand: () => number) {
  const size = 12;
  const grid = Array.from({ length: size }, () => Array<string>(size).fill(""));
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [-1, 1],
  ];
  const words: string[] = [];
  for (const word of list.map(letters).filter((w) => w.length >= 3 && w.length <= size)) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const [dr, dc] = directions[Math.floor(rand() * directions.length)];
      const r = Math.floor(rand() * size),
        c = Math.floor(rand() * size);
      const spots = [...word].map((_, i) => [r + dr * i, c + dc * i]);
      if (!spots.every(([y, x], i) => grid[y]?.[x] !== undefined && (grid[y][x] === "" || grid[y][x] === word[i])))
        continue;
      spots.forEach(([y, x], i) => (grid[y][x] = word[i]));
      words.push(word);
      break;
    }
  }
  const alphabet = "ABCDEFGHIJKLMNOPRSTUW";
  return {
    grid: grid.map((row) => row.map((l) => l || alphabet[Math.floor(rand() * alphabet.length)]).join("")),
    words: words.sort(),
  };
}

// --- How each puzzle prints ---

const table = (rows: string[][], className: string) =>
  `<table class="${className}">${rows.map((row) => `<tr>${row.join("")}</tr>`).join("")}</table>`;

// Each puzzle prints with yesterday's answers below it, when there was a puzzle yesterday.
const answers = (content: string | false) =>
  content ? `<div class="yesterday"><b>Yesterday's answers</b>${content}</div>` : "";

const grid9 = (cells: number[], className: string) =>
  table(
    Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => `<td>${cells[r * 9 + c] || ""}</td>`)),
    className,
  );

export function sudokuHtml({ puzzle }: Puzzles["sudoku"], yesterday?: Puzzles["sudoku"]) {
  return grid9(puzzle, "sudoku") + answers(!!yesterday && grid9(yesterday.solution, "sudoku mini"));
}

export function crosswordHtml({ grid, across, down }: Crossword, yesterday?: Crossword) {
  const rows = grid.map((row) =>
    row.map((cell) => (cell ? `<td>${cell.n ? `<sup>${cell.n}</sup>` : ""}</td>` : `<td class="black"></td>`)),
  );
  const list = (title: string, clues: { n: number; clue: string }[]) =>
    `<p><b>${title}</b></p>${clues.map((c) => `<p>${c.n}. ${esc(c.clue)}</p>`).join("")}`;
  const words = (list: Crossword["across"]) => list.map((w) => `${w.n} ${w.answer}`).join(", ");
  return `<div class="crossword">${table(rows, "grid")}<div class="clues">${list("Across", across)}${list(
    "Down",
    down,
  )}</div></div>
    ${answers(!!yesterday && `<p>Across: ${words(yesterday.across)}. Down: ${words(yesterday.down)}.</p>`)}`;
}

// No answers for the word search: its words are already listed.
export function wordSearchHtml({ grid, words }: Puzzles["wordSearch"]) {
  return `<div class="word-search">${table(
    grid.map((row) => [...row].map((l) => `<td>${l}</td>`)),
    "grid letters",
  )}
    <p class="words">${words.join(" · ")}</p></div>`;
}

export function triviaHtml(trivia: Puzzles["trivia"], yesterday?: Puzzles["trivia"]) {
  return `<ol class="trivia">${trivia.map((t) => `<li>${esc(t.question)}</li>`).join("")}</ol>
    ${answers(!!yesterday && `<p>${yesterday.map((t, i) => `${i + 1}. ${esc(t.answer)}`).join(" · ")}</p>`)}`;
}
