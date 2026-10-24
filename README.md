# daily-print

An AI agent that puts together a personal daily **newspaper**, not a news feed. Each edition is a printable, page-by-page PDF built around one reader's interests, location and preferences.

**What sets it apart: customization.** Every reader gets their own "just for you" paper: their topics, their sections, their name on the masthead.

Why a newspaper and not a news app:
- **It ends.** An edition has a fixed number of pages, unlike an endless feed.
- **It has layout.** Masthead, columns, headlines and sections, like print.
- **It can be printed.** The PDF looks right on paper, not only on a screen.
- **It is edited.** The agent decides what makes the front page and what gets cut.

## Status

Milestone 1 (MVP) is built: one command writes today's 4-page paper as a PDF.
Milestone 2 has started: a web app where readers sign in with Google, edit their settings, generate today's paper and open past editions.

## Set up

Requires Node 24 or later.

1. `npm install`, then `npx playwright-core install chromium` (used to print PDFs locally).
2. Copy `.env.example` to `.env` and add your Anthropic API key.

### Supabase (for the web app)

1. Create a project at [supabase.com](https://supabase.com). Under Project Settings → API Keys, copy the URL, the publishable key and a secret key into `.env`.
2. Create the tables and storage bucket: `npx supabase login`, `npx supabase link`, then `npx supabase db push`.
3. Google sign-in: in Google Cloud, create an OAuth client of type "Web application" with the redirect URI shown on Supabase's Authentication → Providers → Google page. Paste the client ID and secret into that page and turn Google on.
4. Under Authentication → URL Configuration, add `http://localhost:3000/auth/callback` and your Vercel URL plus `/auth/callback` to the redirect URLs.
5. Put your email in `ALLOWED_EMAILS` so you can generate editions.
6. Birthdays from Google Calendar (optional): in Google Cloud, turn on the **Google Calendar API**, add the `calendar.events.readonly` scope under Data Access, and add `http://localhost:3000/api/google/callback` (and your Vercel URL + `/api/google/callback`) to the OAuth client's redirect URIs. Put the client ID and secret in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Set the app's publishing status to **In production**; in Testing, Google cancels the access every 7 days.
7. On Vercel, add the same variables: `vercel env add NAME` for each one in `.env.example`.

## Run it

- **Web app:** `npm run dev`, then open http://localhost:3000. Run `npx workflow web` to watch edition runs. Editions keep going in the background: stopping the dev server only pauses them. Use **Stop** on the Editions page to end one. Don't run `next build` while the dev server is running: it wipes the progress of editions being written.
- **Test on your Claude subscription:** set `USE_CLAUDE_CODE=1` in `.env` (or put it in front of a command, for example `USE_CLAUDE_CODE=1 npm run paper`). Claude runs through the [Claude Code](https://claude.com/claude-code) CLI on this machine, using your subscription instead of the API. You need Claude Code installed and signed in. This is for personal testing only, and never on Vercel.
- **One command, no web app:** edit [paper.json](paper.json) and run `npm run paper`. The paper is saved to `editions/YYYY-MM-DD.pdf`, and its text and cost go to `editions/YYYY-MM-DD.json`. New readers in the web app also start with paper.json's settings.

## Code

| File | What it does |
|---|---|
| [app/](app/) | Web app pages: editions archive, sign-in, PDF links |
| [app/customize/](app/customize/) | The Customize page: tabs and save bar (`customizer.tsx`), and the page builder where sections are dragged or clicked into slots (`page-builder.tsx`) |
| [app/actions.ts](app/actions.ts) | Server actions: sign in and out, save settings, start an edition |
| [workflows/edition.ts](workflows/edition.ts) | The edition workflow: research, write, print the PDF and save it |
| [lib/settings.ts](lib/settings.ts) | Everything a reader can choose (typefaces, page layouts, sections, templates) and the rules for valid settings |
| [lib/editor.ts](lib/editor.ts) | The agent: researches with web search, then writes the edition |
| [lib/claude.ts](lib/claude.ts) | Calls Claude and works out each call's cost |
| [lib/layout.ts](lib/layout.ts), [lib/paper-css.ts](lib/paper-css.ts) | Newspaper layout and typefaces |
| [lib/weather.ts](lib/weather.ts) | The forecast from Open-Meteo, weather icons and the printed forecast |
| [lib/puzzles.ts](lib/puzzles.ts) | Sudoku, crossword and word search generators, and how the puzzles print |
| [lib/google.ts](lib/google.ts) | Connects a reader's Google Calendar and reads today's birthdays |
| [lib/illustrate.ts](lib/illustrate.ts) | Draws the front-page illustration with OpenAI or Google |
| [lib/render.ts](lib/render.ts) | Prints the layout to PDF with headless Chromium, shrinking text that doesn't fit |
| [lib/supabase/](lib/supabase/) | Supabase clients for the signed-in reader and for the workflow |
| [scripts/paper.ts](scripts/paper.ts) | `npm run paper`: makes an edition from paper.json without the web app |
| [supabase/migrations/](supabase/migrations/) | Database tables, security rules and the PDF bucket |

## Docs

| File | What's in it |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layers, diagram, and which operations belong together |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Your preferences and the decisions made so far |
| [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) | Unknowns still to resolve |
| [docs/TODO.md](docs/TODO.md) | Next steps, milestones and future features |
| [docs/PRINTER_SETUP.md](docs/PRINTER_SETUP.md) | How to set up the Raspberry Pi printer box |
