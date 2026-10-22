# daily-news

An AI agent that puts together a personal daily **newspaper**, not a news feed. Each edition is a printable, page-by-page PDF built around one reader's interests, location and preferences.

**What sets it apart: customization.** Every reader gets their own "just for you" paper: their topics, their sections, their name on the masthead.

Why a newspaper and not a news app:
- **It ends.** An edition has a fixed number of pages, unlike an endless feed.
- **It has layout.** Masthead, columns, headlines and sections, like print.
- **It can be printed.** The PDF looks right on paper, not only on a screen.
- **It is edited.** The agent decides what makes the front page and what gets cut.

## Status

Milestone 1 (MVP) is built: one command writes today's 4-page paper as a PDF.

## Run it

1. Requires Node 24 or later.
2. Install: `npm install`, then `npx playwright install chromium`.
3. Copy `.env.example` to `.env` and add your Anthropic API key.
4. Edit [paper.json](paper.json) to set the paper name, typeface (`classic`, `caslon` or `bodoni`), location and sections.
5. Run `npm run paper`. The paper is saved to `editions/YYYY-MM-DD.pdf`, and its text and cost go to `editions/YYYY-MM-DD.json`.

## Code

| File | What it does |
|---|---|
| [src/generate.ts](src/generate.ts) | Entry point: writes the edition, lays it out, saves the PDF |
| [src/editor.ts](src/editor.ts) | The agent: researches with web search, then writes the edition |
| [src/claude.ts](src/claude.ts) | Calls Claude and keeps track of cost |
| [src/layout.ts](src/layout.ts), [src/paper.css](src/paper.css) | Newspaper layout and typefaces |

## Docs

| File | What's in it |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layers, diagram, and which operations belong together |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Your preferences and the decisions made so far |
| [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) | Unknowns still to resolve |
| [docs/TODO.md](docs/TODO.md) | Next steps, milestones and future features |
