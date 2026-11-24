import english from "hyphen/en";
import { Fragment, type CSSProperties, type ReactNode } from "react";
import type { Paper, Story } from "../edition/editor.ts";
import { CrosswordPuzzle, Jumble, Sudoku, Trivia, Weather, WordOfTheDay, WordSearch } from "./features.tsx";
import type { Puzzles } from "../extras/puzzles.ts";
import {
  comicShape,
  LAYOUTS,
  PAPER_SIZES,
  TYPEFACES,
  type Feature,
  type Section,
  type Settings,
} from "../settings.ts";
import {
  filledAreas,
  gridAreas,
  illustratedSpot,
  isLead,
  measure,
  spotLetter,
  textColumns,
  type Size,
} from "../edition/space.ts";
import { todayLine } from "../extras/weather.ts";

// The newspaper, one <section> per printed page. The same components draw it on the Paper page and for print
// (render.ts prints them to a PDF), with the same stylesheet (css.ts, scoped to .paper), so the two always match.

// How the printed pages came out: the font size of each section that shrank to fit, by spot, the section each filler
// went into (or null if it fit nowhere), the comic's height, the timelines and pull quotes there was room for (e.g.
// "3f9a21c4-2:timeline"), and the empty height left in each section, in inches. render.ts measures it in Chromium.
// Older editions shrank whole pages: their font sizes are by page number ("0"). Editions laid out before `extras`
// showed every timeline and no pull quotes.
export type Fit = {
  fontSizes: Record<string, number>;
  fillers: (string | null)[];
  comicHeight: number | null;
  extras?: string[];
  space?: Record<string, number>;
};

// Draws a story's timeline or pull quote where there was room for it. While measuring, each is drawn hidden, for
// render.ts to try.
type Extra = (key: string, node: ReactNode) => ReactNode;

// Everything besides the text needed to draw an edition, saved with it so it can be drawn again.
export type Layout = {
  settings: Settings;
  date: string; // as printed on the masthead
  yesterday: Puzzles | null; // the puzzles whose answers this paper prints
  pictures: { illustration: string | null; comic: string | null }; // where to load them from (null: not drawn)
  fit: Fit | null; // null until it has been measured
};

// Draws a story's follow button. Only the Paper page passes it, so the PDF has none.
export type Follow = (story: Story, section: Section) => ReactNode;

export function Newspaper({ paper, layout, follow }: { paper: Paper; layout: Layout; follow?: Follow }) {
  const { settings, date, fit } = layout;
  const fonts = TYPEFACES[settings.typeface];
  const size = PAPER_SIZES[settings.paperSize];
  const style = {
    "--masthead": `"${fonts.masthead}"`,
    "--headline": `"${fonts.headline}"`,
    "--body": `"${fonts.body}"`,
    "--page-width": size.width,
    "--page-height": size.height,
  } as CSSProperties;

  // Small items for sections with space left: render.ts measures where each fits, or leaves it out.
  // "On this day" is left out when the paper has a section of that name.
  const { quote, funFact, onThisDay } = paper.fillers;
  const hasOnThisDay = settings.pages.some((p) => p.slots.some((s) => s?.title === "On This Day"));
  const fillers = [
    <aside className="filler" key="quote">
      <b>Quote of the day</b>
      <p>“{quote.text}”</p>
      <p className="by">{quote.by}</p>
    </aside>,
    <aside className="filler" key="fact">
      <b>Fun fact</b>
      <p>{funFact}</p>
    </aside>,
    !hasOnThisDay && (
      <aside className="filler" key="day">
        <b>On this day</b>
        <p>{onThisDay}</p>
      </aside>
    ),
  ].filter(Boolean);
  const fillersIn = (spot: string) => fit && fillers.filter((_, k) => fit.fillers[k] === spot);
  const extra: Extra = (key, node) => {
    if (!fit) return <div className="extra" data-extra={key} hidden>{node}</div>;
    const shown = fit.extras ? fit.extras.includes(key) : key.endsWith(":timeline");
    return shown && <div className="extra">{node}</div>;
  };

  return (
    <div className="paper" style={style}>
      {!fit && <div className="fillers">{fillers}</div>}
      {settings.pages.map((_, i) => (
        <section className="page" key={i}>
          <div className="content" style={{ fontSize: fontSize(fit, i) }}>
            {i === 0 && <Masthead paper={paper} settings={settings} date={date} />}
            <Spots paper={paper} layout={layout} page={i} fillersIn={fillersIn} extra={extra} follow={follow} />
          </div>
          <footer>
            <span>
              {settings.name} · {date}
            </span>
            <span>Written by an AI editor. News stories cite their sources.</span>
            <span>Page {i + 1}</span>
          </footer>
        </section>
      ))}
    </div>
  );
}

function Masthead({ paper, settings, date }: { paper: Paper; settings: Settings; date: string }) {
  return (
    <>
      <header className="masthead">
        <h1>{settings.name}</h1>
        <div className="meta">
          <span>{date}</span>
          <span>{settings.location}</span>
          <span>{paper.forecast ? todayLine(paper.forecast) : ""}</span>
        </div>
      </header>
      {paper.birthdays.length > 0 && <p className="birthdays">Birthdays today: {paper.birthdays.join(", ")}</p>}
    </>
  );
}

// A page's or a section's font size, if it shrank to fit.
const fontSize = (fit: Fit | null, key: string | number) => 
  fit?.fontSizes[key] ? `${fit.fontSizes[key]}pt` : undefined;

// A page is its layout's grid. Empty spots are taken over by a section next to them (see filledAreas).
// Each section has a spot id, "page.slot", which the fit uses to place fillers.
function Spots(props: {
  paper: Paper;
  layout: Layout;
  page: number;
  fillersIn: (spot: string) => ReactNode;
  extra: Extra;
  follow?: Follow;
}) {
  const { paper, layout, page: i, fillersIn, extra, follow } = props;
  const { settings, yesterday, pictures, fit } = layout;
  const page = settings.pages[i];
  const space = measure(page, i === 0, settings.paperSize);
  const stories = paper.pages[i]?.sections ?? [];

  // The illustration goes with the story the editor chose for it, or nowhere if it chose none.
  const { headline, scene } = paper.illustration;
  const illustration = pictures.illustration ? (
    <figure className="illustration">
      <img src={pictures.illustration} alt="" />
    </figure>
  ) : (
    <figure className="illustration empty">
      <figcaption>Illustration: {scene}</figcaption>
    </figure>
  );
  const illustrated = illustratedSpot(settings);
  const figureFor = (s: Story, slot: number) =>
    scene && i === 0 && slot === illustrated && s.headline === headline ? illustration : null;

  const features: Record<Feature, (size: Size) => ReactNode> = {
    weather: () => <Weather forecast={paper.forecast} tip={paper.weatherTip} />,
    crossword: () => <CrosswordPuzzle puzzle={paper.puzzles.crossword} yesterday={yesterday?.crossword} />,
    sudoku: () => <Sudoku puzzle={paper.puzzles.sudoku} yesterday={yesterday?.sudoku} />,
    wordSearch: () => <WordSearch puzzle={paper.puzzles.wordSearch} />,
    trivia: () => <Trivia puzzle={paper.puzzles.trivia} yesterday={yesterday?.trivia} />,
    jumble: () => <Jumble puzzle={paper.puzzles.jumble!} yesterday={yesterday?.jumble} />,
    // Without an image key, the comic prints as its four panels in words. Its measured height keeps a filler from
    // squeezing it.
    comic: (size) =>
      pictures.comic ? (
        <figure className="comic" style={fit?.comicHeight ? { flex: `0 0 ${fit.comicHeight}px` } : undefined}>
          <img src={pictures.comic} alt="" />
        </figure>
      ) : (
        <div className={`comic-text ${comicShape(size)}`}>
          {paper.comic.panels.map((p, n) => (
            <p key={n}>
              {p.scene}
              {p.dialogue && (
                <>
                  {" "}
                  <b>“{p.dialogue}”</b>
                </>
              )}
            </p>
          ))}
        </div>
      ),
    wordOfTheDay: () => <WordOfTheDay word={paper.wordOfTheDay} />,
  };

  let k = 0; // the editor writes stories for the filled spots, in order
  const sections = page.slots.map((section, j) => {
    if (!section) return null;
    const size = space[j]!;
    const [lead, ...others] = stories[k++]?.stories ?? [];
    const spot = `${i}.${j}`;
    return (
      <div
        className="section"
        key={j}
        data-spot={spot}
        style={{ gridArea: spotLetter(j), "--columns": textColumns(size.width), fontSize: fontSize(fit, spot) } as CSSProperties}
      >
        <h3 className="section-title">{section.title}</h3>
        {section.kind ? (
          features[section.kind](size)
        ) : (
          <>
            {lead && (
              <Article
                story={lead}
                lead={isLead(size)}
                figure={figureFor(lead, j)}
                button={follow?.(lead, section)}
                extra={extra}
              />
            )}
            {others.map((s, n) => (
              <Article key={n} story={s} figure={figureFor(s, j)} button={follow?.(s, section)} extra={extra} />
            ))}
          </>
        )}
        {fillersIn(spot)}
      </div>
    );
  });

  const areas = gridAreas(filledAreas(page));
  const rows = LAYOUTS[page.layout].rows.map((r) => `minmax(0, ${r}fr)`).join(" ");
  return (
    <div className="spots" style={{ gridTemplateAreas: areas, gridTemplateRows: rows }}>
      {sections}
    </div>
  );
}

// Story text is hyphenated here (soft hyphens) rather than by the browser, whose hyphenation differs from one browser to
// the next: this way the Paper page breaks every line where the PDF does.
const hyphenate = english.hyphenateSync;

// The story's paragraphs, with the first use of each hard term marked for the Paper page to explain (see Definition in
// app/client.tsx). The mark has no style in print, so it doesn't change the PDF. Older editions have no terms.
function withTerms(story: Story) {
  const terms = new Map((story.terms ?? []).map((t) => [t.term.toLowerCase(), t.definition]));
  if (!terms.size) return story.paragraphs.map((p) => hyphenate(p));
  const longestFirst = [...terms.keys()].sort((a, b) => b.length - a.length);
  const escaped = longestFirst.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(?<!\\w)(${escaped.join("|")})(?!\\w)`, "gi"); // split() puts the matches at odd places
  return story.paragraphs.map((p) =>
    p.split(pattern).map((part, n) => {
      const definition = n % 2 ? terms.get(part.toLowerCase()) : undefined;
      if (!definition) return hyphenate(part);
      terms.delete(part.toLowerCase());
      return (
        <span key={n} className="term" data-term={part.toLowerCase()} data-definition={definition} tabIndex={0}>
          {hyphenate(part)}
        </span>
      );
    }),
  );
}

// `button` is the follow button, on the Paper page. It sits on the rule above the story, so it moves no text.
// The timeline goes below the story, and the pull quote after its first paragraph, where there's room for them.
function Article(props: { story: Story; lead?: boolean; figure: ReactNode; button?: ReactNode; extra: Extra }) {
  const { story: s, lead = false, figure, button, extra } = props;
  const quote = pullQuote(s);
  return (
    <article className={lead ? "lead" : ""}>
      {button}
      {s.label && <p className="label">{s.label}</p>}
      <h2>{s.headline}</h2>
      <p className="deck">{s.deck}</p>
      {figure}
      <div className="body">
        {withTerms(s).map((p, n) => (
          <Fragment key={n}>
            <p>{p}</p>
            {n === 0 && quote && extra(`${s.id}:quote`, <blockquote className="pull-quote">{hyphenate(quote)}</blockquote>)}
          </Fragment>
        ))}
        {s.sources.length > 0 && <p className="sources">Sources: {hyphenate(s.sources.map((src) => src.name).join(", "))}</p>}
      </div>
      {s.timeline?.length >= 3 &&
        extra(`${s.id}:timeline`, <StoryTimeline timeline={s.timeline} whyItMatters={s.whyItMatters} />)}
    </article>
  );
}

// A story's pull quote, if it has one. It's printed after the first paragraph as an excerpt, so it must be word for word
// from the third paragraph or later (ignoring surrounding quote marks and end punctuation): the reader doesn't meet
// the same words twice in a row. Older editions have none.
function pullQuote(s: Story) {
  const quote = s.pullQuote?.trim().replace(/^["“]+|["”.,;:!?]+$/g, "");
  if (!quote || !s.paragraphs.slice(2).join(" ").includes(quote)) return "";
  // Stripping the opening mark of a quote that ends midway ("Not here," she said) leaves its closing one alone.
  return (quote.match(/["“”]/g) ?? []).length % 2 ? `“${quote}` : quote;
}

// Older editions may have no timeline; it's only drawn with 3 milestones.
function StoryTimeline({ timeline, whyItMatters }: { timeline: Story["timeline"]; whyItMatters?: string }) {
  const milestones = timeline.slice(0, 3);
  return (
    <aside className="story-timeline" aria-label="Story progression">
      <p className="timeline-title">How it unfolded</p>
      <ol>
        {milestones.map((milestone, i) => (
          <li key={i}>
            <span className="timeline-date">{milestone.date}</span>
            <span>{hyphenate(milestone.event)}</span>
          </li>
        ))}
      </ol>
      {whyItMatters?.trim() && <p className="timeline-impact"><b>Why it matters</b> {hyphenate(whyItMatters.trim())}</p>}
    </aside>
  );
}
