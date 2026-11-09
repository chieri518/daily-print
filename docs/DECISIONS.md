# Decisions

How Daily Print is decided today, by topic, and why. When a decision changes, update its row, and say in **Why** what it replaced if that helps. How the parts fit together is in [ARCHITECTURE.md](ARCHITECTURE.md).

## Product

| Decision | Why |
|---|---|
| A personal **printed newspaper**, not a news feed: it ends, has layout, and is edited | The owner's starting idea |
| Built for the owner first, with settings stored per reader so it can grow into a product | |
| **Customization** is what sets it apart: the reader chooses their pages, sections and style | |
| Black and white, US Letter or A4 | It's printed at home on a laser printer |
| Budget: about **$1 per edition** | Measure the real cost on the first deployed runs |
| English only | Chinese and Japanese need other fonts, other puzzles (the crossword and word search use A–Z), translated print labels and new word counts. Spanish alone would be easy; revisit later |

## Writing

| Decision | Why |
|---|---|
| News is **summarized with sources**. Pieces the editor writes itself (editorial, analysis) say so in their label | |
| **Research:** one Claude call per section, all at once, with up to 6 web searches each | One long call took 3 minutes; this takes about 80 seconds |
| **Writing:** two calls at once: the stories (Claude Opus) and the extras (Claude Sonnet, faster): weather tip, puzzle words, quiz, word of the day, comic | About 80 seconds instead of 2 minutes. The extras come from the research notes |
| Each story's **word limit** comes from the size of its spot in the layout (estimated in `lib/space.ts`). Text that still doesn't fit shrinks, down to 7.5pt | The first real run wrote 40% too much and was cut off. Fixed boxes with fixed word counts left gaps whenever a story came in short |
| Tone (straight news, conversational, witty, **Gen Z**) and reading level are settings. Readers can add a **brief to the editor**, sources to trust or avoid, and preferred sources per section | Sources are instructions to Claude, not enforced |
| Claude calls retry at most once | They cost money |
| Locally, `USE_CLAUDE_CODE=1` runs Claude through Claude Code on the owner's subscription. Deployed, always the API key | A subscription login isn't allowed in a deployed or multi-user app |

## Pictures

| Decision | Why |
|---|---|
| **AI-drawn**, never photos taken from news sites | News photos are copyrighted. Openly licensed photos (Wikimedia Commons) remain an option |
| OpenAI (`gpt-image-2`) or Google, whichever has a key. Without a key, the paper prints a placeholder box | OpenAI is tested; Google isn't |
| **Illustration:** pen and ink, 3:1, on the front page only, in the first story spot at least two columns wide. The editor picks a **light or neutral** story for it, never violence, death, war, disasters, crime or grief, and skips it on a heavy news day | It used to illustrate the first story, whatever it was. In a narrow column a 3:1 picture is too small |
| **Comic strip:** four cute black-and-white panels with speech bubbles, starring a cast the reader describes (default: a skeptical gray cat and an over-excited pigeon). A gentle, non-partisan joke about a light story. a **strip** in a wide spot, four panels **stacked** in a tall narrow one, or **2 × 2** otherwise; the paper picks whichever suits the spot, and the drawing shrinks rather than being cut off | The same cast description keeps the characters alike. No real people. Strip-only left a lot of empty space under it, and a stacked comic in a short spot was cut off |

## The paper's sections

| Decision | Why |
|---|---|
| Ready-made sections (Top Stories, Local News, World, Business, Tech, Science, Sports, Culture, Opinion, On This Day) plus the reader's own. Each is used once. All can be edited; ready-made ones keep their name | |
| **Weather:** a 5-day forecast with icons (one row per day in a narrow spot), an almanac line (sunrise, sunset, daylight, moon, air quality) and a one-line umbrella or jacket tip. °F or °C is a setting | From Open-Meteo (free, no key) |
| **Puzzles:** Sudoku, Mini Crossword, Word Search, Jumble, News Quiz. Code makes the grids, so they're always valid; Claude picks the words and clues. Each prints yesterday's answers below it | Puzzles are saved with each edition, for the next day's answers |
| **Word of the Day**, and **Birthdays today** from Google Calendar: a slim line under the masthead, only on days with birthdays | Birthday names never go to Claude |
| Puzzles stay inside the paper; the weather, comic and word of the day can go on the front page | |
| **Fillers** fill space left at the bottom of a section: quote of the day, fun fact, on this day (one line). They're written with the extras and only printed where they fit | Real papers fill leftover space with small items instead of leaving it blank |

## Customize page

| Decision | Why |
|---|---|
| Each page uses one of **8 ready-made layouts** on a 3-column grid: Lead + 3 columns, Lead + rail, Three columns, Lead + two halves, Columns + strip, Six small boxes, Feature + rail + strip, Two columns stacked. The layout is chosen when adding a page, and can be changed later | Free columns with Short / Medium / Long hid their rules: a column could look full but still offer +, and sizes changed behind the reader's back. Ready-made layouts always look designed |
| Each spot in a layout has a **fixed size**, shown as about how many words fit. A longer story means a bigger spot | Simpler than lengths, and the word count matches the box exactly |
| A spot can be **left empty**: the section next to it grows into the space | Never blocks saving, and never prints a gap |
| A **side panel** shows the settings of whatever is selected: a section (words, what it covers, sources, Remove) or a page (layout, move, remove). No pop-ups. Sections are added by dragging them from the list; empty spots have no panel | Settings were scattered across pop-ups and controls under the page. A list of what fits in an empty spot repeated the list on the left |
| While a section is dragged, the spots it fits **light up** and the others dim. The weather, puzzles and comic need spots of a minimum size | Readers couldn't tell what goes where |
| Switching to the new pages **starts everyone on new default pages**; other settings are kept | Only the owner and a few testers use it |
| Three tabs (Pages, Paper & style, Writing & sources), Undo, and a save bar that always says what's going on | |
| **Undo covers where sections go**, not what a section says. Renaming or editing a section also changes it in the undo history, and "Default pages" uses the reader's own version of each section | Each spot keeps a copy of its section, so undoing past an edit brought back the old name and the same section could be placed twice. Storing only section names in spots would avoid copies, but changes the saved settings |
| Typeface chosen from three cards showing the paper in that typeface | |
| No browser pop-ups | The owner's browser blocks them |

## Making editions

| Decision | Why |
|---|---|
| A **workflow** makes each edition in steps that save as they finish, so a restart carries on instead of starting over | An edition takes about 3 minutes, too long for a web request |
| The edition's **status** in the database is the only control. **Stop** sets it; the workflow checks it before each step | First built by saving each workflow's ID, which tied the shared database to a process on one machine |
| Only emails in `ALLOWED_EMAILS` get editions, by Generate or automatically | Each edition costs money |
| Every finished edition keeps its PDF online, printed or not | |

## Printing every morning

| Decision | Why |
|---|---|
| Papers are made on **Vercel** with the API key | The Pi is too weak, and the owner's computer sleeps |
| One **print time**, every day, in the reader's time zone | |
| Each reader's next paper is **scheduled** when they save, and by a Vercel cron job once a day. It sleeps until 20 minutes before the print time | Vercel's free plan runs a cron job only once a day, within an hour |
| The **printer box** (Raspberry Pi Zero W + HP P1102w over USB, CUPS with the foo2zjs driver) asks every 2 minutes, prints, and reports back | Nothing at home has to accept connections. HP's own driver doesn't run on the Pi Zero |
| The box proves who it belongs to with a **printer key**, shown once in a setup command. Only a hash is stored | Simple for the owner and a few testers |
| A paper not printed within an hour is **skipped**; a printing error isn't retried | The owner's choice |
| One side per sheet, so 4 sheets for 4 pages | The P1102w can't print both sides on its own |

## Web app and data

| Decision | Why |
|---|---|
| Next.js on Vercel. Supabase for sign-in (Google only), the database and the PDFs | |
| Tables: `papers` (settings as JSON, checked by code), `editions`, `printers`, `google_connections`. Readers only see their own rows | No tables until a feature needs them |
| A calm, minimal landing page with a sketch of a front page | |
| The **Paper** page (the home page once signed in) shows the latest paper in the browser, page for page as it prints. It is the main way to read the paper; printing is a bonus | New features will be built on the web view. Replaced the Editions list as the home page |
| The web view and the PDF are drawn by the **same React components and stylesheet**. Printing measures the fit (font sizes, filler spots, comic height) and saves it with the edition, and the Paper page draws with that fit | The two match exactly, and the web view is a real page that features like following a story or explaining terms can build on. Saving a finished-HTML snapshot was tried first, but it can't grow into those features. Papers made before this have only a PDF |
| Story text is hyphenated in code (soft hyphens, the `hyphen` package), not with the browser's `hyphens: auto` | Each browser hyphenates differently (some not at all), which moved line breaks between the PDF and the web view |
| **Hard terms** (uncommon words and acronyms) are explained on the Paper page: the first use in each story has a dotted underline, and hovering or tapping it shows a short definition. The editor picks them for the reader's reading level while writing the stories, and nothing changes in print | No extra Claude call. The underline is styled only in the site's stylesheet, so the PDF and its line breaks stay the same. Readers can't mark words as known yet. Papers made before this have no terms |
| Code is short and easy to read, without repetition | Also in [CLAUDE.md](../CLAUDE.md) |
