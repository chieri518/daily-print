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

## 2026-10-23: Making the Customize page easier to use

Based on common drag-and-drop guidance: show what can be dragged and where it can go, give feedback during the drag, and always offer a way that doesn't need dragging. The owner asked to follow best practice without cluttering the page.

| Topic | Decision | Notes |
|---|---|---|
| Drag feedback | Sections have a drag handle. The dragged item fades. The slot under it is outlined, with a label saying what will happen (Place, Swap or Replace). While a placed section is dragged, the section list shows "Drop here to remove" | |
| Without dragging | Click a slot (or focus it and press Enter) to choose a section from a list, or to clear the slot | Works on phones and with a keyboard |
| Layouts | Small layout icons under each page instead of a dropdown | |
| Slot size | Each slot shows about how many words it holds | |
| Safety | An Undo button for every page change, so templates no longer ask for confirmation. A warning before leaving with unsaved changes. Save shows why it's off | |
| New sections | Made in a small inline form, not browser pop-ups | |
| Not added, to avoid clutter | A "how it works" strip, template preview cards | Revisit if testers still struggle |
| Word counts | Each slot's word count is now **measured** from the print layout (90% of what fits), not estimated. The front-page illustration is 1.5 inches tall instead of 2 | Big front-page slots were much smaller than estimated |

## 2026-10-23: Customize page feedback

| Topic | Decision | Notes |
|---|---|---|
| Templates | The three templates are replaced by one **"Go back to: Default template"** link, which restores the pages from paper.json | Undo still works after it |
| New sections | Only a name is needed. Without a description, the section covers "news about {name}". A name already in use shows a message | |
| Pop-ups | The page uses no browser pop-ups (`prompt`, `confirm`) | The owner's browser blocks them, which is why making a section failed |
| Optional fields | The brief and both source lists are marked "(optional)" | They were never required; the labels make that clear |

## 2026-10-23: Preferred sources per section

| Topic | Decision | Notes |
|---|---|---|
| New sections | Made in a small dialog with three fields: name, what it covers (optional) and preferred sources (optional, comma-separated) | The narrow sections list was too cramped for a form |
| Section sources | Each section can list preferred sources. The research step is asked to prefer them for that section | Like the paper-wide trusted sources, an instruction to Claude, not enforced. Ready-made sections have none for now |

## 2026-10-23: Editing sections

| Topic | Decision | Notes |
|---|---|---|
| Editing | Every section can be edited: what it covers and its preferred sources. Open it with ✎ in the sections list, or by clicking a slot that holds it | For example, Local News from chosen local publishers |
| Ready-made sections | Editing one saves the reader's own version under the same name, which replaces it in the list. Their names can't be changed | Keeps them recognizable |
| Renaming | Readers can rename their own sections, but not to a name already in use | |
| Placed sections | Saving an edit updates every slot that holds the section | |

## 2026-10-23: Weather, puzzles and illustrations

| Topic | Decision | Notes |
|---|---|---|
| Weather | A five-day forecast from **Open-Meteo** (free, no key): icons, highs and lows, chance of rain, wind. Claude writes a one-line tip, such as bringing an umbrella or a jacket. The masthead shows today's forecast | Shown in °F and mph in the US, °C and km/h elsewhere. If the location isn't found, shorter versions of it are tried ("San Francisco Bay Area" → "San Francisco") |
| Weather icons | Simple black-and-white line drawings (SVG) written in code | |
| Puzzles | **Sudoku** (made by code, exactly one solution), **Mini Crossword** (Claude picks 12 answers and clues from the day's stories; code lays out the grid), **Word Search** (Claude picks the words; code hides them), **News Quiz** (5 questions by Claude) | Puzzles are seeded by the edition, so making the same edition again gives the same puzzles |
| Answers | A **Yesterday's Answers** section prints the previous edition's solutions | Puzzles are saved with each edition for this |
| Sections that aren't stories | Weather and puzzles have a fixed design, so each fits only some slot shapes (full, wide, tall, quarter, strip). The builder says "Doesn't fit" and leaves them out of the list where they don't fit. Puzzles can't go on the front page | Owner chose this over a free-form grid, which would be much more work and harder to keep printable |
| New layouts | **Four quarters** (for a puzzle page) and **Weather strip + main** (front page) | Word counts measured like the others |
| New default paper | Front: weather strip + Top Stories. Page 2: Tech, Opinion, On This Day. Page 3: Bay Area + Mini Crossword. Page 4: Sudoku, Word Search, News Quiz, Yesterday's Answers | |
| Illustration source | **AI-generated** pen-and-ink illustration of the lead story. **Not** photos taken from news sites | News photos are copyrighted, and fetching them through MCP doesn't change that. Open-licensed photos (Wikimedia Commons, Openverse) remain an option for later |
| Image provider | Swappable: OpenAI (`gpt-image-2`) or Google (`gemini-3.1-flash-image`), whichever has a key. `IMAGE_PROVIDER` and `IMAGE_MODEL` override | Without a key, or if drawing fails, the paper prints the dashed placeholder box |
| Illustration style | Pen and ink with cross-hatching, wide composition, no text. Printed in grayscale, 1.5 inches tall, front page only | |

## 2026-10-23: Answers attached to each puzzle

| Topic | Decision | Notes |
|---|---|---|
| Yesterday's answers | No longer a section of its own. Each puzzle prints yesterday's answers below it: the News Quiz answers, the Sudoku solution (small grid) and the Crossword answers. Left out when there was no puzzle yesterday | The Word Search has no answers, because its words are already listed |
| Default paper | Page 2 is now Tech, Opinion and Business. Page 4 is Sudoku, Word Search, News Quiz and On This Day | Replaces the old answers slot |
| Sudoku size | Squares are 2em again so the puzzle and yesterday's solution fit in a quarter page | |

## 2026-10-23: Printer box hardware works

| Topic | Decision | Notes |
|---|---|---|
| Hardware | **Raspberry Pi Zero W** connected by USB to an **HP LaserJet Pro P1102w** | Tested: it printed a full edition. Setup in [PRINTER_SETUP.md](PRINTER_SETUP.md) |
| Driver | CUPS with the open-source **foo2zjs** driver | HP's own driver needs a plugin that doesn't run on the Pi Zero |
| Paper | One side per sheet, so 4 sheets for a 4-page edition | The P1102w can't print both sides on its own |
| Where editions are made | On Vercel, with the Anthropic API key | The Pi Zero is too weak to make editions, and the owner's computer sleeps. The Pi will only download and print |
| Next | Paused. The owner is going back to the web app's look and feel first | Next steps for the box are in [TODO.md](TODO.md) |

## 2026-10-23: Customize page, round 3

From a review of the whole app. The owner chose to improve the Customize page first.

| Topic | Decision | Notes |
|---|---|---|
| Tabs | **Pages**, **Paper & style**, and **Writing & sources**, with settings in a compact grid | The page was one long form |
| Saving | A save bar stays at the bottom of the screen. It says why Save is off, "You have unsaved changes", or "Saved". Saving no longer reloads the page | The "Saved" message used to appear at the top, out of view |
| Layouts | Each page shows its layout's name. Clicking it opens a list of layouts with small drawings | Replaces six unlabeled icons |
| Sections list | Grouped into News, Puzzles & extras, and Your sections | |
| Slot previews | Weather and puzzle slots show a small sketch (forecast row, sudoku grid, crossword, letters, quiz lines) instead of "Made automatically" | |
| Page order | ← and → move a page. The front page stays first | |

## 2026-10-23: Typeface cards, Gen Z tone, English only

| Topic | Decision | Notes |
|---|---|---|
| Typeface | Chosen from three cards that show the paper's name, a headline and body text in each typeface | Replaces a dropdown of names |
| Tone | Added **Gen Z**: casual and playful, with some current slang, but facts stay accurate. Each tone now carries a short guide for the editor | |
| Language | **English only.** The language setting is removed | The owner asked for English, Chinese, Spanish and Japanese, or English only if that was hard. Chinese and Japanese need different fonts, new puzzles (the crossword and word search use A–Z), translated print labels and new word counts. Spanish alone would be easy; revisit later |
