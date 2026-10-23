# Open questions

Questions marked **[Next]** need an answer before adding illustrations.

## Product

- **Date and edition:** on-demand editions use the browser's time zone. Scheduled editions will need a time zone setting.
- **Duplicates:** what happens when a big story fits several of the user's topics?
- **Content safety:** are any topics excluded by default (for example graphic violence)? How should paywalled sources be handled?
- **[Next] Image style:** the paper is black and white, so the house style must work in grayscale. Choose between woodcut, pen and ink, or stippled engraving. It should look the same across editions.

## Technical

- **[Next] Image provider:** Claude doesn't generate images, so which provider? Candidates: OpenAI gpt-image, Google Imagen or Gemini, Flux via Replicate or fal. Compare on cost per image, how well it holds a style, and how it looks in black and white.
- **Fitting text:** text that is too long now shrinks to fit, but a short page still leaves empty space at the bottom. If real editions show this, ask Claude to lengthen or cut stories based on the measured space.
- **Smallest readable size:** is text shrunk to 7.5pt still readable when printed? Check on paper and raise the minimum if not.
- **Which Claude model for which step:** a strong model for editing and writing, and maybe a cheaper one for sorting through research. Settle this once costs are measured.
- **Step length on Vercel:** each workflow step runs in one function call. Will the research step (web search) finish within the plan's function time limit? Measure it on the first deployed run.
- **Fonts on Vercel:** the PDF loads Google Fonts over the network while rendering. Check the deployed PDFs use the right typefaces.

## Customization

- **Enforcing sources:** blocked sources are only an instruction to Claude. The API's web search can block domains for real, but readers may type names ("The Daily Mail") rather than domains. Is the instruction enough?
- **Other languages:** the masthead date, footer and hyphenation are still in English. Translate them when someone uses another language.
- **More layouts:** are four enough? Should readers be able to resize slots?
- **Word counts per slot:** the word budgets in `LAYOUTS` are estimates. Check them against real editions.

## Legal

- Rules for quoting and summarizing news: how long a summary can be, how to attribute it, and whether to show links or QR codes in print.
- Terms of use for AI-generated images used in a product.

## Printing

- **Hardware:** a Raspberry Pi, or something else? Which printer? Duplex (two-sided) printing matters for a 4-page paper.
- **Print setup:** use CUPS on the Pi, or a printer with its own network or cloud printing?
- **Pairing:** how does a reader link a printer box to their account? For example, with a code shown in the web app.
- **Missed mornings:** what if the box is offline or the printer is out of paper? Print late, skip that day, or notify the reader?
