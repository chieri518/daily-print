# daily-print

An AI agent that puts together a personal daily **newspaper**, not a news feed. Each edition is built around one reader's interests, location and preferences. Read it in the browser, or print it.

**What sets it apart: customization.** Every reader gets their own "just for you" paper: their topics, their sections, their name on the masthead.

Why a newspaper and not a news app:
- **It ends.** An edition has a fixed number of pages, unlike an endless feed.
- **It has layout.** Masthead, columns, headlines and sections, like print.
- **It reads on screen and on paper.** The web page and the PDF are the same pages, line for line.
- **It is edited.** The agent decides what makes the front page and what gets cut.

## Status

Built: a web app where readers sign in with Google, design their paper on the Customize page, and read each edition on the Paper page, turning pages left and right, or as a PDF. Editions are made on demand, or every morning for a printer box at home. Readers can follow a story with + on the Paper page; updates on it appear in the Your Desk section. Next: deploying it so the paper prints by itself every morning, and explaining any term on the web view. See [docs/TODO.md](docs/TODO.md).

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
7. Automatic printing: set `CRON_SECRET` to a long random value (for example from `openssl rand -hex 32`). Vercel sends it when it runs the daily scheduler, so no one else can trigger it. Without it, the scheduler refuses every request.
8. On Vercel, add the same variables: `vercel env add NAME` for each one in `.env.example`.

## Run it

- **Web app:** `npm run dev`, then open http://localhost:3000. Run `npx workflow web` to watch edition runs. Editions keep going in the background: stopping the dev server only pauses them. Use **Stop** on the Editions page to end one. Don't run `next build` while the dev server is running: it wipes the progress of editions being written.
- **Test on your Claude subscription:** set `USE_CLAUDE_CODE=1` in `.env` (or put it in front of a command, for example `USE_CLAUDE_CODE=1 npm run paper`). Claude runs through the [Claude Code](https://claude.com/claude-code) CLI on this machine, using your subscription instead of the API. You need Claude Code installed and signed in. This is for personal testing only, and never on Vercel.
- **One command, no web app:** edit [paper.json](paper.json) and run `npm run paper`. The paper is saved to `editions/YYYY-MM-DD.pdf`, and its text and cost go to `editions/YYYY-MM-DD.json`. New readers in the web app also start with paper.json's settings.

## Test automatic printing on your Mac

1. Apply the database changes: `npx supabase db push`.
2. Run the app with `USE_CLAUDE_CODE=1 npm run dev` (free on your Claude subscription), and keep the Mac awake.
3. In Customize, set the print time to about 25 minutes from now, and Save. The Editions page shows the paper as **Scheduled**. It's written 20 minutes before the print time.
4. Set up a printer box: this Mac, or a Raspberry Pi using your Mac's address (see [PRINTER_SETUP.md](docs/PRINTER_SETUP.md)).
5. To run the daily scheduler by hand: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron`.

When that works, deploy to Vercel with the API key, so the paper is made while your Mac sleeps.

## Code

| File | What it does |
|---|---|
| [app/](app/) | Web pages: the landing page, the Paper page (the latest edition, page by page), the Editions page, PDF links and sign-in |
| [app/customize/](app/customize/) | The Customize page: tabs and save bar (`customizer.tsx`), the page builder (`page-builder.tsx`) and printing (`printing.tsx`) |
| [app/actions.ts](app/actions.ts) | Server actions: sign in and out, save settings, start or stop an edition, connect Google, make a printer key |
| [app/api/](app/api/) | The daily scheduler (`cron`), the printer box's API (`printer`) and the Google Calendar connection (`google`) |
| [workflows/edition.ts](workflows/edition.ts) | The edition workflow: research, write, draw, print the PDF, and save it with its layout and pictures |
| [lib/settings.ts](lib/settings.ts) | Everything a reader can choose (typefaces, layouts, sections) and the rules for valid settings |
| [lib/editor.ts](lib/editor.ts), [lib/claude.ts](lib/claude.ts) | The editor's research and writing, and the calls to Claude with their cost |
| [lib/space.ts](lib/space.ts) | How big each spot of a layout is in print, and so how many words fit |
| [lib/paper.tsx](lib/paper.tsx), [lib/paper-features.tsx](lib/paper-features.tsx), [lib/paper-css.ts](lib/paper-css.ts) | The newspaper as React components and their stylesheet, drawn the same on the Paper page and in the PDF |
| [lib/render.ts](lib/render.ts) | Prints the PDF with headless Chromium: measures the fit (text shrunk to fit, fillers placed), which is saved so the Paper page matches |
| [lib/weather.ts](lib/weather.ts), [lib/puzzles.ts](lib/puzzles.ts), [lib/illustrate.ts](lib/illustrate.ts), [lib/google.ts](lib/google.ts) | The forecast, puzzles, pictures and birthdays |
| [lib/schedule.ts](lib/schedule.ts), [lib/printer.ts](lib/printer.ts), [lib/allowed.ts](lib/allowed.ts) | Scheduling morning papers, printer keys, and who can get editions |
| [public/printer/](public/printer/) | The printer box's install and print scripts |
| [scripts/paper.ts](scripts/paper.ts) | `npm run paper`: makes an edition from paper.json without the web app |
| [supabase/migrations/](supabase/migrations/) | Database tables, security rules and the bucket for PDFs and pictures |

## Docs

| File | What's in it |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the parts fit together: the edition workflow, Stop, scheduling and printing |
| [docs/DECISIONS.md](docs/DECISIONS.md) | How things are decided, by topic, and why |
| [docs/TODO.md](docs/TODO.md) | What's next, starting with getting the paper to print every morning |
| [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) | Unknowns still to resolve |
| [docs/PRINTER_SETUP.md](docs/PRINTER_SETUP.md) | How to print on your own printer: from the browser, or with a printer box on a Mac or Raspberry Pi, and its printer settings |

## License

[MIT](LICENSE): use it, change it and share it, keeping the copyright notice.
