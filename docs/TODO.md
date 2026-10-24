# To-do

## Milestone 1 (MVP)

- [x] Settings file ([paper.json](../paper.json))
- [x] 4-page newspaper template in HTML/CSS with print CSS
- [x] Agent pipeline: research with web search, then write the edition
- [x] Render the PDF with headless Chromium
- [x] Fit check: shrink text that is too long
- [x] Log the cost of each edition
- [x] Test mode on the Claude subscription (`USE_CLAUDE_CODE=1`)
- [ ] **Run the first real edition** (`USE_CLAUDE_CODE=1 npm run paper`)
- [ ] Print a test edition on paper and review it
- [ ] Run the same settings at $0.10, $0.50 and $1.00 per edition and compare quality side by side

## Illustrations, weather and puzzles

- [x] Choose an image provider (swappable: OpenAI or Google) and style (pen and ink)
- [x] Add an OpenAI key and check the first illustrations (works with `gpt-image-2`)
- [ ] Measure the cost of an illustration and add it to the edition's cost
- [x] Weather forecast with icons and an umbrella or jacket tip
- [x] Sudoku, mini crossword, word search and news quiz, each with yesterday's answers below it
- [ ] Sudoku difficulty as a setting
- [x] Jumble, Word of the Day, and an almanac with air quality in the weather
- [x] Birthdays today from Google Calendar
- [ ] **Push the new database changes** (`npx supabase db push`): the `google_connections` table and stopping editions. Then set up Google Calendar (README, Supabase step 6)

## Milestone 2: Web app

- [x] Next.js app on Vercel, with Supabase for sign-in and data
- [x] Settings page with the structured settings
- [x] Archive of past editions, with PDFs to download
- [x] "Generate today's paper" button, running as a Vercel Workflow
- [x] Database tables `papers` and `editions`, and a private storage bucket for PDFs
- [ ] **Create the Supabase project, set up Google sign-in and add the environment variables** (see the README)
- [ ] Generate a first edition on Vercel and check how long each step takes
- [ ] Generate each user's edition at the time they set (needs a print time and time zone in settings)
- [ ] Show an edition's error and cost in the archive
- [ ] Later tables: `articles` (for feedback) and `devices` (for the printer box)

## Milestone 3: More customization

- [x] The user chooses page count and paper size
- [x] Section order and layout of each page: a Customize page where sections are dragged into slots on page previews
- [x] Sources to trust or block (as instructions to Claude)
- [x] Tone and reading level (English only for now)
- [x] A written "brief to the editor"
- [ ] Generate a test edition with each layout and check that the text fits
- [x] Click a slot to choose a section (works on phones and with a keyboard)
- [x] Reorder whole pages
- [ ] Editions page: front-page thumbnails, failure reason and Try again, progress while writing
- [x] Landing page: sample front page, how it works, printer box
- [ ] Feedback on articles that shapes future editions

## Future features

Ideas from traditional newspapers, for later:

- [ ] Horoscope (the reader picks their sign)
- [x] Comic strip, starring a cast the reader chooses
- [ ] Your sports teams: scores and schedule
- [ ] Markets snapshot, or your own watchlist
- [ ] Others from the research: Cryptoquote, recipe card, book or film pick, kids' corner
- [ ] Today's agenda from Google Calendar (the same connection as birthdays)

- [ ] Google Photos: an "N years ago today" photo
- [ ] Page-turn viewer in the browser
- [ ] Printer box: prints each morning's edition automatically (see [ARCHITECTURE.md](ARCHITECTURE.md))
  - [x] Hardware test: the Pi Zero W prints an edition on the P1102w ([PRINTER_SETUP.md](PRINTER_SETUP.md))
  - [ ] Make the Wi-Fi power-saving fix permanent
  - [ ] Scheduled editions, made before the reader's print time
  - [ ] Pairing a printer box with a code from the web app
  - [ ] Script on the Pi: fetch today's PDF, print it, report the result
