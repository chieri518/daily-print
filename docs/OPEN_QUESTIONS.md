# Open questions

Unknowns still to resolve. When one is answered, move the answer to [DECISIONS.md](DECISIONS.md).

## Product

- **Duplicates:** what happens when a big story fits several of the reader's sections?
- **Content safety:** are any topics excluded by default (for example graphic violence)? How should paywalled sources be handled?
- **Yesterday's answers:** they come from the reader's most recent earlier edition, which may be several days old, or from earlier the same day. Is that OK?
- **Missed papers:** a paper not printed within an hour is skipped. Should the reader be told?
- **Paper use:** a 4-page edition uses 4 sheets. Should papers fit on fewer pages?

## Writing and layout

- **Short pages:** text that's too long shrinks to fit, but a short page leaves empty space. If real editions show this, ask Claude to lengthen or cut stories based on the measured space.
- **Smallest readable size:** is text shrunk to 7.5pt readable on paper?
- **Word counts:** measured with sample text in the Classic typeface. Other typefaces and real headlines may fit more or less.
- **Faster or cheaper:** Sonnet for research, or lower effort for writing, would be faster still. Compare editions side by side before switching. Is the Opinion section's research worth its time, when its editorial is about other stories?
- **Sources:** blocked sources are only an instruction to Claude. Web search can block domains for real, but readers type names ("The Daily Mail") rather than domains. Is the instruction enough?
- **More layouts:** are six enough? Should readers be able to resize slots?

## Technical

- **Vercel:** do the PDF (Chromium) and its fonts work there, and does each step finish within the time limit? Check on the first deployed edition.
- **Google pictures:** supported but untested; the model name needs checking.

## Google

- **Verification:** reading Google Calendar is a sensitive permission. Before opening the app to the public, Google must verify it. Until then, users see an "unverified app" warning, and at most 100 can connect.

## Legal

- Rules for quoting and summarizing news: how long a summary can be, how to attribute it, and whether to show links or QR codes in print.
- Terms of use for AI-generated images used in a product.
