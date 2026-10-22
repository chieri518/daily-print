# To-do

## Milestone 1 (MVP)

- [x] Settings file ([paper.json](../paper.json))
- [x] 4-page newspaper template in HTML/CSS with print CSS
- [x] Agent pipeline: research with web search, then write the edition
- [x] Render the PDF with headless Chromium
- [x] Fit check: shrink text that is too long
- [x] Log the cost of each edition
- [ ] **Add your API key to `.env` and run the first real edition**
- [ ] Print a test edition on paper and review it
- [ ] Run the same settings at $0.10, $0.50 and $1.00 per edition and compare quality side by side

## Illustrations (next)

- [ ] Choose an image-generation provider and a black-and-white illustration style
- [ ] Get an API key for the image provider
- [ ] Replace the dashed box with the generated image

## Milestone 2: Web app

- [ ] Next.js app on Vercel, with Supabase for sign-in and data
- [ ] Settings page with the structured settings
- [ ] Archive of past editions, with PDFs to download
- [ ] Generate each user's edition at the time they set
- [ ] Database tables:
  - `users`
  - `paper_settings`: paper name, typeface, page count, topics, location, print time
  - `editions`: date, status, PDF link, cost, sources
  - `articles`: edition, section, headline, body, sources (kept so readers can give feedback later)
  - `devices`: printer boxes linked to each reader (for the printer box later)

## Milestone 3: More customization

- [ ] The user chooses page count and paper size
- [ ] Section order and layout of each page
- [ ] Sources to trust or block
- [ ] Language, tone and reading level
- [ ] A written "brief to the editor"
- [ ] Feedback on articles that shapes future editions

## Future features

- [ ] Crossword built from that day's stories
- [ ] Google Calendar: birthday reminders (and maybe the day's agenda)
- [ ] Google Photos: an "N years ago today" photo
- [ ] Page-turn viewer in the browser
- [ ] Printer box: prints each morning's edition automatically (see [ARCHITECTURE.md](ARCHITECTURE.md))
