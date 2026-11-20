# To-do

## Now: the paper prints by itself every morning

0. [ ] **Apply the database migration:** `npx supabase db push` (followed stories known by id). It drops follows saved by headline, so follow those stories again. Following fails until it's applied
1. [ ] **Deploy to Vercel:**
   - [ ] Add every variable from `.env.example` on Vercel, with `ANTHROPIC_API_KEY` (and without `USE_CLAUDE_CODE`). None are set there yet (2026-11-18)
   - [ ] Set monthly spending limits with Anthropic and the picture provider (OpenAI or Google)
   - [ ] Deploy, then add the Vercel URL in Supabase (Authentication → URL Configuration) and in Google Cloud (OAuth origins and redirect URIs)
2. [ ] **Check the first deployed edition:** the PDF renders on Vercel (`@sparticuz/chromium` is untried there), the fonts are right, each step finishes within Vercel's time limit, and what it cost on the API
3. [ ] **Point the printer box at Vercel:** in the deployed app, make a new printer key and run its command on the Pi
4. [ ] Watch the first few mornings
   - [ ] Repeats: does a story from an earlier paper come back only with real news, shorter, with `continues` set? Is anything important missing?

## Quality

- [ ] Check the character estimates in `lib/edition/space.ts` against new editions (measured by drawing every layout with stories of typical length; see DECISIONS), using the empty space saved in each edition's fit, and the puzzle heights
- [ ] After a week of editions: how often the fitting pass runs ("Rewriting to fit" in the log), whether its rewrites hit their lengths, how much space is still empty, and how often timelines and pull quotes fit
- [ ] Measure an edition's real cost on the API (not `USE_CLAUDE_CODE`, whose cost is Claude Code's own estimate) with research on Sonnet, and with each writing model
- [ ] Add the pictures' cost to each edition's cost
- [ ] Compare editions at different costs ($0.10, $0.50, $1) to see how quality changes

## Later

- [ ] Editions page: a front-page thumbnail for each edition
- [ ] Email the reader when a paper fails or is skipped (needs an email provider)
- [ ] Tell readers in Customize when automatic papers aren't available to them (not in `ALLOWED_EMAILS`)
- [ ] Printer box: pairing with a code instead of a key; printing a paper made with Generate; telling the reader when a paper was skipped
- [ ] Try the Mac printer box and `DOUBLE_SIDED` on real printers (written, untested)
- [ ] Sudoku difficulty as a setting
- [ ] Feedback on stories that shapes future editions
- [ ] Paper page on phones: scale the pages down to the screen width (they are print-sized, so a phone scrolls sideways)
- [ ] Make a real edition with followed stories and check Your Desk: are the updates right, do they fit its spot, and does the "no news" line read well?
- [ ] Saved pages from before Your Desk don't have it: the owner and testers drag it in, or use Default pages

## Ideas from traditional newspapers

- [ ] Horoscope (the reader picks their sign)
- [ ] Your sports teams: scores and schedule
- [ ] Markets snapshot, or your own watchlist
- [ ] Today's agenda from Google Calendar (the same connection as birthdays)
- [ ] Google Photos: an "N years ago today" photo
- [ ] Cryptoquote, recipe card, book or film pick, kids' corner
