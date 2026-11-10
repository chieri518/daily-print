# To-do

## Now: the paper prints by itself every morning

0. [ ] **Apply the database migrations:** `npx supabase db push` (the edition layout and known words)
1. [ ] **Deploy to Vercel:**
   - [ ] Add every variable from `.env.example` on Vercel, with `ANTHROPIC_API_KEY` (and without `USE_CLAUDE_CODE`)
   - [ ] Deploy, then add the Vercel URL in Supabase (Authentication → URL Configuration) and in Google Cloud (OAuth origins and redirect URIs)
2. [ ] **Check the first deployed edition:** the PDF renders on Vercel (`@sparticuz/chromium` is untried there), the fonts are right, each step finishes within Vercel's time limit, and what it cost on the API
3. [ ] **Point the printer box at Vercel:** in the deployed app, make a new printer key and run its command on the Pi
4. [ ] Watch the first few mornings

## Next: ready-made layouts

Replaces free columns (see DECISIONS.md, Customize page).

- [ ] Make a real edition and check on paper: gaps, word counts, fillers, the vertical comic

## From the code review

- [ ] Not a bug today: a feature's fit is only checked when it's placed, but no feature fits on one paper size and not the other. Check again after tuning the sizes in `FEATURES` (see Soon), since saved pages could then hold a feature that no longer fits

## Soon: quality

- [ ] Tune the estimates in `lib/space.ts` (words per square inch, puzzle heights) against real editions
- [ ] Add the pictures' cost to each edition's cost
- [ ] Compare editions at different costs ($0.10, $0.50, $1) to see how quality changes

## Later

- [ ] Editions page: a front-page thumbnail for each edition, the reason a paper failed, and Try again
- [ ] Tell readers in Customize when automatic papers aren't available to them (not in `ALLOWED_EMAILS`)
- [ ] Printer box: pairing with a code instead of a key; printing a paper made with Generate; telling the reader when a paper was skipped
- [ ] Sudoku difficulty as a setting
- [ ] Feedback on stories that shapes future editions
- [ ] Spanish
- [ ] Page-turn viewer in the browser
- [ ] Paper page on phones: scale the pages down to the screen width (they are print-sized, so a phone scrolls sideways)
- [ ] Follow a story: a button on a story to follow it into later editions
- [ ] Make a real edition and check the hard terms on the Paper page: are the right words picked at each reading level, and do the definitions read well? Does the ✓ work on a phone?
- [ ] Explain any term: highlight any word on the Paper page to get a short explanation, like a Kindle (hard terms the editor picks are already explained)

## Ideas from traditional newspapers

- [ ] Horoscope (the reader picks their sign)
- [ ] Your sports teams: scores and schedule
- [ ] Markets snapshot, or your own watchlist
- [ ] Today's agenda from Google Calendar (the same connection as birthdays)
- [ ] Google Photos: an "N years ago today" photo
- [ ] Cryptoquote, recipe card, book or film pick, kids' corner
