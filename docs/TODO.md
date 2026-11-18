# To-do

## Now: the paper prints by itself every morning

0. [ ] **Apply the database migrations:** `npx supabase db push` (followed stories, the edition stage, and one paper per print time). The Paper and Editions pages fail until the stage is applied
   - [ ] Email the reader when a paper fails or is skipped (needs an email provider)
1. [ ] **Deploy to Vercel:**
   - [ ] Add every variable from `.env.example` on Vercel, with `ANTHROPIC_API_KEY` (and without `USE_CLAUDE_CODE`)
   - [ ] Deploy, then add the Vercel URL in Supabase (Authentication → URL Configuration) and in Google Cloud (OAuth origins and redirect URIs)
2. [ ] **Check the first deployed edition:** the PDF renders on Vercel (`@sparticuz/chromium` is untried there), the fonts are right, each step finishes within Vercel's time limit, and what it cost on the API
3. [ ] **Point the printer box at Vercel:** in the deployed app, make a new printer key and run its command on the Pi
4. [ ] Watch the first few mornings

## Quality

- [ ] Tune the estimates in `lib/space.ts` (words per square inch, puzzle heights) against real editions
- [ ] Add the pictures' cost to each edition's cost
- [ ] Compare editions at different costs ($0.10, $0.50, $1) to see how quality changes

## Later

- [ ] Editions page: a front-page thumbnail for each edition
- [ ] Turn failure reasons into plain words: they are the raw error messages for now (fine for the owner and testers)
- [ ] Tell readers in Customize when automatic papers aren't available to them (not in `ALLOWED_EMAILS`)
- [ ] Printer box: pairing with a code instead of a key; printing a paper made with Generate; telling the reader when a paper was skipped
- [ ] Try the Mac printer box and `DOUBLE_SIDED` on real printers (written, untested)
- [ ] Sudoku difficulty as a setting
- [ ] Feedback on stories that shapes future editions
- [ ] Page-turn viewer in the browser
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
