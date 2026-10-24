# Open questions

## Product

- **Date and edition:** on-demand editions use the browser's time zone. Scheduled editions will need a time zone setting.
- **Duplicates:** what happens when a big story fits several of the user's topics?
- **Content safety:** are any topics excluded by default (for example graphic violence)? How should paywalled sources be handled?
- **Answers when there's no edition yesterday:** yesterday's answers come from the reader's most recent earlier edition, which may be several days old, or from earlier the same day. Is that OK?

## Technical

- **Image provider:** OpenAI and Google are both supported. Compare them on paper: how well they hold the pen-and-ink style, how they print in grayscale, and cost. The model names were taken from docs that couldn't all be checked; confirm them on the first run.
- **Fitting text:** text that is too long now shrinks to fit, but a short page still leaves empty space at the bottom. If real editions show this, ask Claude to lengthen or cut stories based on the measured space.
- **Smallest readable size:** is text shrunk to 7.5pt still readable when printed? Check on paper and raise the minimum if not.
- **Which Claude model for which step:** a strong model for editing and writing, and maybe a cheaper one for sorting through research. Settle this once costs are measured.
- **Step length on Vercel:** each workflow step runs in one function call. Will the research step (web search) finish within the plan's function time limit? Measure it on the first deployed run.
- **Fonts on Vercel:** the PDF loads Google Fonts over the network while rendering. Check the deployed PDFs use the right typefaces.

## Customization

- **Enforcing sources:** blocked sources are only an instruction to Claude. The API's web search can block domains for real, but readers may type names ("The Daily Mail") rather than domains. Is the instruction enough?
- **Other languages:** the paper is English only for now. Spanish would be easy to add. Chinese and Japanese need fonts with their characters, different puzzles, translated print labels and new word counts.
- **More layouts:** are four enough? Should readers be able to resize slots?
- **Word counts per slot:** measured with sample text in the Classic typeface at 10pt. Other typefaces and real headlines may fit more or less. Check against real editions.

## Google

- **Verification:** reading Google Calendar is a sensitive permission. Before opening the app to the public, Google must verify it; until then, users see an "unverified app" warning, and only up to 100 users can connect.
- **Birthday names:** Google Calendar names birthday events after the contact, sometimes with "'s birthday" added, which we remove. Check real names print correctly.

## Legal

- Rules for quoting and summarizing news: how long a summary can be, how to attribute it, and whether to show links or QR codes in print.
- Terms of use for AI-generated images used in a product.

## Printing

- **Paper use:** the P1102w only prints one side at a time, so a 4-page edition uses 4 sheets. Is that OK, or should the paper fit on fewer pages?
- **Pairing:** how does a reader link a printer box to their account? For example, with a code shown in the web app.
- **Missed mornings:** what if the box is offline or the printer is out of paper? Print late, skip that day, or notify the reader?
