# Decisions

How Daily Print is decided today, by topic, and why. When a decision changes, update its row, and say in **Why** what it replaced if that helps. How the parts fit together is in [ARCHITECTURE.md](ARCHITECTURE.md).

## Product

| Decision | Why |
|---|---|
| A personal **printed newspaper**, not a news feed: it ends, has layout, and is edited | The owner's starting idea |
| Built for the owner first, with settings stored per reader so it can grow into a product | |
| **Customization** is what sets it apart: the reader chooses their pages, sections and style | |
| Two things set it apart: a **news product** unlike others (AI and personalization) and a **media product** unlike others (it ends, and stops attention slop). Personalization serves finishing, never engagement | Feeds personalize to keep you reading; ad-funded competitors can't copy a product that wants you to stop |
| The goal for the reader: **caught up, and done**. When they finish the paper, they know what matters today and can stop | It decides what the knowledge graph is for: what to leave out, shorten or follow up |
| **The paper is finite**, and that's the core of the product. Personalization decides what to leave out and how to say more in fewer words, never adds more to read. No streaks, endless "more", or pulls back into the app | Finishing, and feeling caught up, is the point |
| Made for **one reader**, not a household | |
| The paper will keep a **knowledge graph per reader** (what they know, care about and have been told), not one shared across readers. It starts as recall: the editions are its history, and `continues` links stories into threads, with no table of its own. What else it stores is still open | Simpler and private, like the other per-reader tables |
| Black and white, US Letter or A4 | It's printed at home on a laser printer |
| Budget: about **$1 per edition** | Measure the real cost on the first deployed runs |
| English only | Chinese and Japanese need other fonts, other puzzles (the crossword and word search use A–Z), translated print labels and new word counts. Spanish alone would be easy; revisit later |

## Writing

| Decision | Why |
|---|---|
| News is **summarized with sources**. Pieces the editor writes itself (editorial, analysis) say so in their label | |
| **Research:** one Claude call per section, all at once, on **Claude Sonnet**, with up to 3 web searches each (Your Desk: one per followed story, at least 3). Through Claude Code (`USE_CLAUDE_CODE`), the limit is only asked for in the prompt | One long call took 3 minutes; this takes about 80 seconds. Research was most of an edition's cost: on Opus with 6 searches, one section cost $0.47 through Claude Code (11 turns, 91k tokens of search results), so five sections were about $2.40 of a $3.24 edition. Research collects facts, so Sonnet at half the price does it; Opus is kept for the writing. Search results are the biggest part of the cost, and the prompt already asked for "a few searches" but used all 6 |
| A section whose research fails twice is **skipped**: the editor writes a one-line "no news today" piece for it. The paper fails only when every section fails | One failed section used to fail the whole paper, and retrying the research step paid again for every section that had worked |
| **No repeats:** before research, **recall** lists what the reader read in their last 14 days of editions, as threads of stories joined by `continues`. Each section's research gets its own section's threads and looks for other news; the editor gets all of them, and on real news writes only what's new, with a line of background. An important development is never left out to avoid a repeat. Only the newest edition of each day counts as read; Your Desk is left out | Papers had no memory, so a big story was retold in full every day. "Caught up, and done" means not reading the same thing twice. Small memory goes in the prompt whole: research on agent memory ranks or searches only once it outgrows the prompt. Per-section lists keep each research call short. Testing Generate several times a day would otherwise hide stories the reader never saw |
| **Writing:** two calls at once: the stories (Claude Opus, or Sonnet if the reader chooses it in Customize) and the extras (Claude Sonnet, faster): weather tip, puzzle words, quiz, word of the day, comic | About 80 seconds instead of 2 minutes. The extras come from the research notes. The writing is where the paper's quality comes from, so readers choose its model: Opus writes best, Sonnet costs about half as much. Haiku isn't offered: it's not as good a writer, and has neither the newer web search nor refusal fallbacks |
| Each section gets a **character budget** from the size of its spot (`lib/edition/space.ts`): one for a single story and, in big sections, one each for two or three stories. A section is offered more stories only when the main story keeps at least half and every shorter one gets at least 400 characters, about two paragraphs (`SHORT_STORY_CHARACTERS`). The editor picks how many stories, preferring fewer, fuller ones, then writes 85% to 100% of that budget, never padding when news is thin. A section whose text is still too long shrinks on its own, down to 7.5pt | Characters predict space better than words, which vary in length. The estimate is **measured** by drawing every layout, on both paper sizes, at 10pt with stories of typical length and finding the most text each section holds as one, two or three stories: 68 characters per square inch, and each story's headline, deck and sources take 0.7 inches of height plus 3 square inches (they wrap onto more lines in a narrow spot), with 0.7 inches more for a lead story's big headline. It's within 4% on average across the 132 sizes. An earlier estimate took 15% of a section per extra story: it promised a wide, short section 850 characters as three stories when it holds about 60, so thin stories overflowed. Shrinking used to be per page, so one long section shrank every section on its page and opened gaps under the ones written to size. Thin stories (a 370-character lead, one-paragraph briefs) also read badly. Models can't count exactly, so the fitting pass and the layout step handle what's left |
| Tone (straight news, conversational, witty, **Gen Z**) and reading level are settings. Readers can add a **brief to the editor**, sources to trust or avoid, and preferred sources per section | Sources are instructions to Claude, not enforced |
| Claude calls retry at most once | They cost money. The exception: when every section's research fails, the research step is retried, so each section is tried up to 4 times. That's most likely an outage, when nothing is paid for |
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
| **Your Desk:** a ready-made section of updates on the stories the reader follows, one short update per story, with a line for stories with no news. It's placed like any other section; the default pages put it last, in page 3's last box. Its research looks up the followed stories instead of a topic. With nothing followed, it says how to follow a story | The reader chooses where it goes, like every section. Readers who saved pages before it was added drag it in themselves, or use Default pages |
| The page plan says how many stories each section holds ("one story, up to 1,050 characters"), a follow-up of an earlier story counts as one of them, and the code keeps at most that many after writing, in the editor's order (`withRoom` in `lib/edition/editor.ts`). Your Desk keeps all its updates | Told "the others hold one story" in a separate rule, the editor wrote two or three stories in one-story sections, often adding follow-ups as extras: Space got 1,317 characters for 1,050 and was cut off even at 7.5pt. Leaving a story out leaves a gap, which is better than text cut off mid-sentence, and a left-out story isn't counted as read, so it can come back |
| Space left after the stories is filled **most useful first**, each kept only where its section still fits: (1) each story's **timeline** ("How it unfolded"), lead stories first; (2) a **pull quote**, at most one per section; (3) **fillers** (quote of the day, fun fact, on this day), each in the section of stories with the most room, or else a puzzle's or the weather's. The layout step tries each and measures, rather than using size thresholds | Real papers fill leftover space instead of leaving it blank. A timeline helps understand the story; a pull quote works for any story; fillers are unrelated to the news. How much space an item takes depends on the column width and font size, so measuring beats guessing. Timelines used to be reserved up front, which shortened stories and shrank text. Puzzle sections always have room by design, so fillers went there and left the gaps under stories |
| A **pull quote** is a striking sentence or phrase, word for word from a story's third paragraph or later, printed after its first paragraph. The code checks it's in the story | It's an excerpt, so it must be exact. Quoting a later paragraph means the reader never meets the same words twice in a row |
| The empty height left in each section of stories is saved with the edition's fit | To see how well papers fill their pages, and how often the fitting pass (below) is needed |
| **Fitting pass** after the first layout: sections whose text shrank below 9.5pt are cut to what their spot holds, and by at least 10%, and sections at full size with 0.4 inches or more of white space get about 90% of what that space holds added from the research notes, never padding. One call for all of them, in the reader's writing model, returning only paragraphs and pull quotes by story id; then the paper is laid out for real. Once only. Your Desk is left out. If the rewrite fails, the paper prints as written | A model can't judge its own length, but it's good at hitting a number it's given (the render-measure-revise loop of PaperFit and the poster-layout papers). The layout step measures exactly what's wrong, so the check is free and the call happens only when needed. Text the layout shrank and a filled gap are both fixed at the source, instead of shrinking type or leaving white space. Sections that shrank only a little are left: a section that shrank can still show a gap, from its columns balancing, and lengthening it would shrink it more. Looking at the rendered pages with a model would cost more and measure less exactly |

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
| A **workflow** makes each edition in steps that save as they finish, so a restart carries on instead of starting over | An edition takes 3 to 4 minutes, too long for a web request |
| The edition's **status** in the database is the only control. **Stop** sets it; the workflow checks it before each step | First built by saving each workflow's ID, which tied the shared database to a process on one machine |
| A paper **writing for over 10 minutes**, or still **scheduled** at its print time, is marked failed by the sweep (daily scheduler, printer box checks, Generate) | A lost workflow left its paper stuck forever, and a stuck scheduled paper stopped the reader's next one being scheduled. An edition takes about 3 to 4 minutes, so 10 is still generous, and a stuck paper fails while there's time to notice. (It was 30.) The 10 minutes count from when the paper started writing: when it was made, or 20 minutes before its print time, whichever is later, so a paper scheduled at the last minute still gets its 10. Without a printer box, a stuck paper waits for the daily scheduler or the next Generate |
| **One paper at a time:** Generate refuses while a paper is being written, and the database allows one paper per print time | A double-click, a second tab, or the scheduler running while settings are saved, could each pay for two papers |
| A paper the reader **cancels** stays cancelled: scheduling skips a print time with a stopped paper. A paper waiting for a print time the reader changed is **deleted** instead, so changing back schedules it again | The daily scheduler re-created cancelled papers, so they printed anyway |
| The daily scheduler schedules each reader **on their own**: one reader's error is logged and the rest carry on | One bad setting (say, a time zone) stopped every later reader's paper |
| The printer box **waits for and cancels only its own print job**, and retries its report | With the default printer it watched, and on a timeout cancelled, every job on the machine. A report lost to a Wi-Fi blip reprinted the paper every 2 minutes for an hour |
| Only emails in `ALLOWED_EMAILS` get editions, by Generate or automatically | Each edition costs money |
| Every finished edition keeps its PDF online, printed or not | |

## Printing every morning

| Decision | Why |
|---|---|
| Papers are made on **Vercel** with the API key | The Pi is too weak, and the owner's computer sleeps |
| One **print time**, every day, in the reader's time zone | |
| Each reader's next paper is **scheduled** when they save, and by a Vercel cron job once a day. It sleeps until 20 minutes before the print time | Vercel's free plan runs a cron job only once a day, within an hour |
| The **printer box** is any always-on Mac or Linux computer (usually a Raspberry Pi) that prints through CUPS. It asks every 2 minutes, prints, and reports back. The owner's is a Pi Zero W + HP P1102w over USB with the foo2zjs driver | Nothing at home has to accept connections. Each reader has their own printer, and CUPS drives nearly all of them. HP's own driver doesn't run on the Pi Zero |
| **Printer settings** (which printer, double-sided, any other `lp` options) live in `/etc/daily-print.conf` on the box, not in the app. Setting the box up again keeps them | Every printer differs, and owners can change them where the printer is. No app or database changes |
| To print **whenever you like**, open the PDF and print from the browser. The box only prints the morning paper | Works with any printer, with nothing to set up |
| The box proves who it belongs to with a **printer key**, shown once in a setup command. Only a hash is stored | Simple for the owner and a few testers |
| A paper not printed within an hour is **skipped**; a printing error isn't retried | The owner's choice |
| One side per sheet by default; `DOUBLE_SIDED` in the printer settings turns on both sides | The owner's P1102w can't print both sides on its own; other printers can |

## Web app and data

| Decision | Why |
|---|---|
| Next.js on Vercel. Supabase for sign-in (Google only), the database and the PDFs | |
| `lib/` is grouped **by area**: `edition/` (research and writing), `paper/` (drawing it and the PDF), `extras/` (forecast, puzzles, pictures, birthdays), `printing/` (morning papers, printer box). What everything shares stays at its top | 20 flat files were hard to find your way around, for people new to the repo |
| The README is for **curious visitors and self-hosters**, with screenshots in `docs/images/` | The repo is public so others can run their own copy |
| `vercel.json` says the framework is **Next.js** | The project was set to "Other", so Vercel served only `public/` and every page was a 404. In the repo, it's right for anyone who deploys their own copy |
| **One public deployment**, not a separate demo. Anyone can sign in and customize; only `ALLOWED_EMAILS` can make papers. Everyone else sees the five **sample papers** (`public/samples`) on the Paper page | Only invited readers cost money, and one deployment is one thing to keep working. Samples show visitors what they'd get, for free |
| Tables: `papers` (settings as JSON, checked by code), `editions`, `printers`, `google_connections`, `known_words`, `followed_stories`. Readers only see their own rows | No tables until a feature needs them |
| A calm, minimal landing page with a sketch of a front page | |
| The **Paper** page (the home page once signed in) shows the latest paper in the browser, page for page as it prints. It is the main way to read the paper; printing is a bonus | New features will be built on the web view. Replaced the Editions list as the home page |
| Each paper on the **Editions** page opens on the Paper page (`/?edition=<id>`), with its PDF as a second link | Older papers could only be read as PDFs, without definitions or follow buttons |
| While a paper is written, the Paper and Editions pages show its **stage** (Researching the news, Writing the stories, Drawing the pictures, Fitting the stories and printing). A failed paper shows its error | The workflow saves the stage in the query that already checks for Stop, so it costs no extra step or query. Waiting several minutes with no news, and "Failed" with no reason, left the reader guessing |
| A failed paper shows a **plain sentence** naming the stage that went wrong ("Something went wrong while researching the news. Please try again."). The technical error goes to the logs, not the page | Raw errors (workflow step names, SDK auth messages) meant nothing to readers |
| No **Try again** button: Generate, at the top of the Editions page, is the way to try again | Each try costs about $1. One button to spend it is enough |
| The web view and the PDF are drawn by the **same React components and stylesheet**. Printing measures the fit (font sizes, which timelines, pull quotes and fillers fit and where, the comic's height, the empty space) and saves it with the edition, and the Paper page draws with that fit | The two match exactly, and the web view is a real page that features like following a story or explaining terms can build on. Saving a finished-HTML snapshot was tried first, but it can't grow into those features. Papers made before this have only a PDF |
| Story text is hyphenated in code (soft hyphens, the `hyphen` package), not with the browser's `hyphens: auto` | Each browser hyphenates differently (some not at all), which moved line breaks between the PDF and the web view |
| **Hard terms** (uncommon words and acronyms) are explained on the Paper page: the first use in each story has a dotted underline, and hovering or tapping it shows a short definition. The editor picks them for the reader's reading level while writing the stories, and nothing changes in print | No extra Claude call. The underline is styled only in the site's stylesheet, so the PDF and its line breaks stay the same. Papers made before this have no terms |
| A **✓** in a term's definition marks the word as known, in one click: it's unmarked at once, never explained on the Paper page again (older papers too), and the editor is told not to pick it | A symbol rather than a label keeps the definition small. Known words are in their own table, not in the settings, so saving the Customize page can't overwrite them |
| **Following a story:** a + on the rule above each story on the Paper page (✓ while following; press again to stop). A story is known by its **id**: the first part of its edition's id and its place in the paper (`3f9a21c4-2`), given by code when the paper is assembled. An update in Your Desk names the id of the story it `updates`, and stands for that story, so it can be unfollowed there. At most **5** followed stories. Never in print: the PDF is drawn without the buttons | No extra Claude call to follow. The limit keeps Your Desk's research to one call and its updates short. Followed stories are kept until the reader stops following them. Ids replaced headlines, which the editor had to copy exactly; a reworded headline broke the link, and the knowledge graph will link stories the same way. Follows saved by headline were dropped |
| Code is short and easy to read, without repetition | Also in [CLAUDE.md](../CLAUDE.md) |
