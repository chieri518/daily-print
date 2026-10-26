# To-do

## Now: the paper prints by itself every morning

Everything is built; these steps get it running. Do them in order.

1. [x] **Apply the database changes:** `npx supabase db push` (asks for the database password). Adds Google connections, scheduled editions, Stop and printer keys.
2. [x] **Add `CRON_SECRET` to `.env`:** any long random value, for example from `openssl rand -hex 32`.
3. [ ] **Test on the Mac** (README: "Test automatic printing on your Mac"):
   - [ ] Set a print time about 25 minutes ahead; the Editions page shows it as Scheduled
   - [ ] It's written about 20 minutes before; Stop and Cancel work
   - [ ] Set up the printer box with the Mac's address (PRINTER_SETUP.md, step 6); it checks in, prints at the print time, and the Editions page says "Printed at …"
   - [ ] Turn the printer off and check that the paper is skipped after an hour
4. [ ] **Deploy to Vercel:**
   - [ ] Add every variable from `.env.example` on Vercel, with `ANTHROPIC_API_KEY` (and without `USE_CLAUDE_CODE`)
   - [ ] Deploy, then add the Vercel URL in Supabase (Authentication → URL Configuration) and in Google Cloud (OAuth origins and redirect URIs)
5. [ ] **Check the first deployed edition:** the PDF renders on Vercel (`@sparticuz/chromium` is untried there), the fonts are right, each step finishes within Vercel's time limit, and what it cost on the API
6. [ ] **Point the printer box at Vercel:** in the deployed app, make a new printer key and run its command on the Pi
7. [ ] **Turn off new sign-ups** in Supabase (Authentication → Sign In / Providers), so strangers can't sign in
8. [ ] Watch the first few mornings

## Next: ready-made layouts

Replaces free columns (see DECISIONS.md, Customize page).

- [x] Settings and print: 8 layouts on a 3-column grid; empty spots merge into a neighbour; word counts from each spot's size
- [x] Customize: side panel (section, empty spot, page), dragging that lights up where a section fits, choosing a layout when adding a page
- [x] New default pages
- [ ] Make a real edition and check on paper: gaps, word counts, fillers, the vertical comic

## Fixes from the code review (Oct 25)

Bugs:

- [ ] Customize crashes after Undo or "Default pages" when the selected page or spot no longer exists: clear the selection in both (`page-builder.tsx`)
- [ ] Fillers go into the comic's section, which shrinks the drawing and overlaps it: skip sections with a comic in `placeFillers` (`render.ts`)
- [ ] A feature's fit is only checked when it's dropped: changing the paper size afterwards can save a feature that no longer fits, and it prints cut off
- [ ] Undo after renaming a section restores the old title on the page but not in the list, so the section can be placed twice
- [ ] Renaming a section selected from the list leaves the side panel blank (the selection keeps the old title)

Cleanup:

- [ ] Build the grid-template-areas string in one helper (now in `page-builder.tsx`, `parts.tsx` and `layout.ts`)
- [ ] `measure()` repeats the cell lookup from `filledAreas`; the spot letter → index conversion is written out twice
- [ ] `illustratedSpot`: decide "two columns wide" by counting tracks (4 or more), not page-width arithmetic with a 0.1in fudge
- [ ] Dragging re-renders the whole builder on every `dragover`: only update when the spot under the cursor changes
- [ ] `illustrate.ts`: move the `openai()` comment back above its function (it now sits above `OPENAI_SIZES`)

## Soon: quality

- [ ] Print an edition and check it on paper: is 7.5pt readable, do the puzzles and icons print cleanly?
- [ ] Tune the estimates in `lib/space.ts` (words per square inch, puzzle heights) against real editions
- [ ] Set up Google Calendar (README, Supabase step 6) and check birthday names print correctly
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

## Ideas from traditional newspapers

- [ ] Horoscope (the reader picks their sign)
- [ ] Your sports teams: scores and schedule
- [ ] Markets snapshot, or your own watchlist
- [ ] Today's agenda from Google Calendar (the same connection as birthdays)
- [ ] Google Photos: an "N years ago today" photo
- [ ] Cryptoquote, recipe card, book or film pick, kids' corner
