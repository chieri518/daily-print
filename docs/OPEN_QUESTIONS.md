# Open questions

Unknowns still to resolve. When one is answered, move the answer to [DECISIONS.md](DECISIONS.md).

## Product

- **Duplicates:** what happens when a big story fits several of the reader's sections?
- **Content safety:** are any topics excluded by default (for example graphic violence)? How should paywalled sources be handled?
- **Yesterday's answers:** they come from the reader's most recent earlier edition, which may be several days old, or from earlier the same day. Is that OK?
- **Paper use:** a 4-page edition uses 4 sheets (2 with `DOUBLE_SIDED`). Should papers fit on fewer pages?
- **Followed stories:** they're kept until the reader stops following them. Should a story with no news for a week or two be dropped, or the reader asked? Is 5 the right limit?
- **Knowledge graph storage:** recall uses the editions as the history, with threads from `continues`. When the graph needs more (people and companies, what the reader was told, open questions), does it grow with more story fields, a short memory document per reader that the editor rewrites each day, or tables?
- **Recall's reach:** is 14 days right? When the list outgrows the prompt, rank threads (recent, often continued, followed) rather than cutting by date?
- **Followed stories in the graph:** become threads the reader pinned? The likely time is when Your Desk starts closing loose ends, unless the followed stories migration isn't in production yet
- **Your Desk without a spot:** a reader who follows stories but has no Your Desk on their pages gets no updates (the Paper page tells them to add it). Should following a story add Your Desk at the end of the paper instead?

## Writing and layout

- **Layouts:** do the puzzles read well in one of three columns? Are 8 layouts enough, and which do readers actually use?
- **Small gaps:** the fitting pass lengthens stories only under gaps of 0.4 inches or more, measured after the fillers. Is a smaller gap fine?
- **Smallest readable size:** is text shrunk to 7.5pt readable on paper?
- **Web view in other browsers:** the fit is measured in Chromium. Firefox and Safari measure text slightly differently, so a line could wrap differently there and the end of a section be cut off. Is that rare enough, or should the Paper page check for it?
- **Your Desk's room:** in the default pages it holds about 450 characters as one story (500 on A4), and by the space model only two updates' headlines fit at all, so with 3 to 5 followed stories its text shrinks a lot. Should it get a bigger spot by default, or its updates a smaller headline?
- **Character estimates:** measured in one typeface, with typical headlines (see DECISIONS). Other typefaces may fit more or less.
- **Faster or cheaper:** research now runs on Sonnet with 3 searches per section. Are its notes as good as Opus's? Lower effort for writing would be faster and cheaper still. Compare editions side by side. Is the Opinion section's research worth its time, when its editorial is about other stories?
- **Sources:** blocked sources are only an instruction to Claude. Web search can block domains for real, but readers type names ("The Daily Mail") rather than domains. Is the instruction enough?

## Technical

- **Vercel:** do the PDF (Chromium) and its fonts work there, and does each step finish within the time limit? Check on the first deployed edition.
- **Google pictures:** supported but untested; the model name needs checking.

## Google

- **Verification:** reading Google Calendar is a sensitive permission. Before opening the app to the public, Google must verify it. Until then, users see an "unverified app" warning, and at most 100 can connect.

## Legal

- Rules for quoting and summarizing news: how long a summary can be, how to attribute it, and whether to show links or QR codes in print.
- Terms of use for AI-generated images used in a product.
