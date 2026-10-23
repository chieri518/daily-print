# Decisions log

This file records the owner's stated preferences and the decisions made from them. Add new entries at the bottom, and record changed decisions as new entries rather than editing old ones.

## 2026-10-22: Initial direction

| # | Topic | Decision | Notes |
|---|---|---|---|
| 1a | Audience | Build for the owner first, with settings stored per user so it can grow into a multi-user product | |
| 1b | Reading device | **Paper.** The PDF must be printable. | This drives the layout: print margins, page size, black-and-white readability |
| 2a | Format | A real PDF first. A page-turn web viewer comes later. | |
| 2b | Page count | **4 pages** for now. The user will choose it later. | |
| 3a | Sections | Chosen by the user from their interests and location. This is **the feature that sets the app apart**. A fixed mix is OK for testing. | |
| 3b | Writing | News is **summarized with citations**. Editorials and features are **written by the agent and labeled as such**. | |
| 3c | Sources | The agent searches the web freely for now. Users will choose sources later. | |
| 4a | How users customize | **Structured settings only** for now | Written brief and feedback learning come later |
| 4b | Visual options | **Paper name and typeface** only for now | |
| 4c | Images | **AI-generated illustrations** | A Google Photos "years ago today" photo is a future feature |
| 5a | Delivery | Final target: ready in the web app at a time the user sets | The MVP is generated on demand instead (see 6b) |
| 5b | Budget | **No more than $1 per edition** | The owner doesn't yet know how quality changes with cost; we should measure this |
| 6a | Stack | Next.js on Vercel, Claude as the agent, HTML/CSS printed to PDF, Supabase for data | |
| 6b | First milestone | "Generate today's paper for me" by running one command | No web app or sign-in yet |

## 2026-10-22: MVP details

| Topic | Decision | Notes |
|---|---|---|
| Paper size | **US Letter** (8.5 × 11 in) | Users can choose A4 later |
| Color | **Black and white** | Illustrations must work in grayscale. Pen-and-ink or woodcut styles suit this |
| Test sections | **Startups/tech** and **Bay Area** | Page 2 is Startups/tech, page 3 is Bay Area news |
| Keys | The owner has an Anthropic API key | No image service account yet |

## 2026-10-22: Building the MVP

| Topic | Decision | Notes |
|---|---|---|
| Code style | **Short and sweet.** Code must be easy for a person to read, with no unnecessary complexity and no repetition | Also in [CLAUDE.md](../CLAUDE.md) |
| Illustrations | Left out of the first version. The front page has a dashed box with the agent's description of the illustration | This description becomes the image prompt once an image service is chosen |
| Search | Claude's built-in web search | Switch only if source quality turns out to be poor |
| Typefaces | Three sets of free Google Fonts: `classic` (blackletter name, Playfair Display, Source Serif 4), `caslon` (Libre Caslon), `bodoni` (Bodoni Moda, Newsreader) | |
| Language | TypeScript, run directly by Node (no build step) | Matches the planned Next.js web app |
| Model | Claude Opus 5.5 for both research and writing, at medium effort | Adjust after measuring cost per edition |
| Fitting text | Claude is given a word count for each page. After layout, text on any page that is too long shrinks (down to 7.5pt) until it fits | |

## 2026-10-22: Automatic printing

| Topic | Decision | Notes |
|---|---|---|
| End goal | The paper **prints automatically every morning** on a physical printer | Hardware is probably a Raspberry Pi; not decided yet |
| Architecture | Organized as presentation, service and data layers. The printer box is another client, like the web app | See [ARCHITECTURE.md](ARCHITECTURE.md) |

## 2026-10-22: Web app (Milestone 2, first version)

| Topic | Decision | Notes |
|---|---|---|
| Name | The repo and website are called **daily-print** (was daily-news) | |
| Scope | Sign in, edit settings, press "Generate today's paper", then read past editions as PDFs | Scheduled editions come later |
| Sign-in | **Google** through Supabase Auth | Fits the planned Google Calendar and Photos features |
| Who can generate | Only emails listed in `ALLOWED_EMAILS` | Anyone can sign in with Google, but each edition costs money |
| Generation | A **Vercel Workflow** with three steps: research, write, print. Each Claude step retries at most once | PDFs are rendered with `@sparticuz/chromium` on Vercel and with Playwright's Chromium locally |
| Date | "Today" is today in the reader's browser time zone, sent when they press Generate | Answers part of the time zone question for on-demand editions |
| Data | Two tables: `papers` (settings as JSON, checked by the `Settings` schema in code) and `editions` (status, text with sources, cost). PDFs go in a private `editions` storage bucket at `{user_id}/{edition_id}.pdf` | No `users` table (Supabase's `auth.users` is enough). No `articles` or `devices` tables until a feature needs them |
| Settings | Paper name, typeface, location and the two sections on pages 2 and 3 | |
| Code layout | Next.js app at the repo root. The edition pipeline lives in `lib/` and is shared by the web app and the `npm run paper` command | |

## 2026-10-23: Testing on the Claude subscription

| Topic | Decision | Notes |
|---|---|---|
| Local testing | `USE_CLAUDE_CODE=1` runs Claude through the Claude Code CLI on the owner's Claude subscription instead of the API | For personal testing on the owner's machine only, until the owner is ready to publish. Works with `npm run paper` and with the web app in `npm run dev` |
| Deployed app | Always uses `ANTHROPIC_API_KEY` | A subscription login isn't allowed in a deployed or multi-user app |
| Differences | Claude Code uses its own web search tools and the `opus` model alias, which may be a different Opus version than the API's `claude-opus-5-5`. The cost it reports is an estimate of the API price | Compare a few editions from both before publishing |

## 2026-10-23: More customization (Milestone 3, first version)

| Topic | Decision | Notes |
|---|---|---|
| Pages | The front page is always first. After it, the reader has a list of 1–7 pages, each with a title, what it covers and a layout. **Drag and drop** reorders them | Page count is the number of pages in the list plus the front page. Built with the browser's own drag and drop, so reordering doesn't work on phones yet |
| Opinion page | Now an ordinary page in the list, so readers can move or remove it | Pieces the agent writes itself must still say so in their label |
| Page layouts | Three for now: **Lead story** (one main story, two below), **Two columns** (four short stories) and **Stacked** (2–4 stories in full width) | Each layout tells the editor how many stories to write and how long. The front page layout is fixed |
| Paper size | US Letter or A4 | |
| Writing | Language (free text), tone (straight news, conversational, witty) and reading level (simple, general, expert) | Labels outside the stories, such as the date and footer, are still in English |
| Sources | Lists of sources to trust and to never use | Only instructions to Claude for now; nothing enforces them |
| Brief to the editor | Free text, up to 2,000 characters, given to both the research and writing steps | |
| Old settings | Settings saved in the older format are replaced by the defaults in paper.json | Only the owner had saved settings |

## 2026-10-23: Customize page, built like a page builder

Replaces the page list from the previous entry.

| Topic | Decision | Notes |
|---|---|---|
| Name | The Settings tab is now **Customize** (`/customize`) | |
| Editing | Readers see their paper as small page previews in their typeface. They **drag sections into slots** on each page, between slots to move or swap, and back to the list to remove | Like a website builder (Wix), but much simpler. Still no touch support |
| Page layouts | Each page has a layout of 1–3 slots: **One section**, **Top + two below**, **Two halves**, **Two columns** | The slot size sets how many words the editor writes |
| Front page | Editable like the others, below the masthead | The illustration sits in the first slot on the front page |
| Sections | A list of ready-made sections (Top Stories, Local News, World, Business, Tech, Science, Sports, Culture, Weather, Opinion, On This Day) plus sections the reader makes. Each section can be used once | |
| Templates | General, Local and Tech digest. Picking one replaces the reader's pages | |
| Saving | Every slot must be filled before saving | |
