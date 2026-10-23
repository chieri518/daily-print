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

## Illustrations (next)

- [ ] Choose an image-generation provider and a black-and-white illustration style
- [ ] Get an API key for the image provider
- [ ] Replace the dashed box with the generated image

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
- [x] Language, tone and reading level
- [x] A written "brief to the editor"
- [ ] Generate a test edition with each layout and check that the text fits
- [ ] Drag and drop on phones (it doesn't work with touch)
- [ ] Reorder whole pages (today you rebuild them by moving sections)
- [ ] Feedback on articles that shapes future editions

## Future features

- [ ] Crossword built from that day's stories
- [ ] Google Calendar: birthday reminders (and maybe the day's agenda)
- [ ] Google Photos: an "N years ago today" photo
- [ ] Page-turn viewer in the browser
- [ ] Printer box: prints each morning's edition automatically (see [ARCHITECTURE.md](ARCHITECTURE.md))
