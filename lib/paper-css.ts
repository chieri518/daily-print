// Printed newspaper, black and white. layout.ts sets the paper size. Sizes are in em so the fit step can shrink a whole page at once.
export const css = `
@page { margin: 0; }
* { box-sizing: border-box; margin: 0; }
body { font-family: var(--body), serif; color: #000; background: #fff; }

.page { padding: 0.5in; display: flex; flex-direction: column; break-after: page; }
.content { flex: 1; display: flex; flex-direction: column; overflow: hidden; font-size: 10pt; line-height: 1.35; }
footer { display: flex; justify-content: space-between; border-top: 1px solid #000; padding-top: 4pt; font-size: 7pt; }

/* Front page */
.masthead { text-align: center; border-bottom: 3px double #000; margin-bottom: 1em; }
.masthead h1 { font-family: var(--masthead), serif; font-size: 5em; font-weight: normal; line-height: 1.15; }
.masthead .meta { display: flex; justify-content: space-between; border-top: 1px solid #000; padding: 3pt 0; font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.05em; }
.illustration { height: 2in; display: flex; align-items: flex-end; border: 1px dashed #000; padding: 0.5em; margin-bottom: 0.7em; }
.illustration figcaption { font-size: 0.8em; font-style: italic; }

/* Slots: each page is a grid of sections (see LAYOUTS in settings.ts) */
.slots { flex: 1; min-height: 0; display: grid; gap: 1em 1.5em; }
.slot { min-height: 0; overflow: hidden; }
.section-title { font-family: var(--headline), serif; font-size: 1.2em; text-transform: uppercase; letter-spacing: 0.08em; border-bottom: 3px double #000; padding-bottom: 2pt; margin-bottom: 0.6em; }

/* Stories */
article { border-bottom: 1px solid #000; padding-bottom: 0.8em; margin-bottom: 0.8em; }
article:last-child { border-bottom: none; }
h2 { font-family: var(--headline), serif; font-size: 1.6em; line-height: 1.1; margin-bottom: 0.2em; }
.lead h2 { font-size: 2.4em; }
.label { font-size: 0.75em; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; }
.deck { font-style: italic; margin-bottom: 0.5em; }
.body { columns: var(--columns); column-gap: 1.5em; column-rule: 1px solid #999; text-align: justify; hyphens: auto; }
.body p + p { text-indent: 1em; }
.body .sources { text-indent: 0; font-size: 0.8em; font-style: italic; margin-top: 0.3em; }
`;
