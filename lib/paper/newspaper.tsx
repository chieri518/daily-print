import english from "hyphen/en";
import type { CSSProperties, ReactNode } from "react";
import type { Paper, Story } from "../edition/editor.ts";
import { CrosswordPuzzle, Jumble, Sudoku, Trivia, Weather, WordOfTheDay, WordSearch } from "./features.tsx";
import type { Puzzles } from "../extras/puzzles.ts";
import {
  comicShape,
  LAYOUTS,
  MAIN_STORY_WORDS,
  PAPER_SIZES,
  TYPEFACES,
  type Feature,
  type Section,
  type Settings,
} from "../settings.ts";
import { filledAreas, gridAreas, illustratedSpot, measure, spotLetter, textColumns, words, type Size } from "../edition/space.ts";
import { todayLine } from "../extras/weather.ts";

// The newspaper, one <section> per printed page. The same components draw it on the Paper page and for print
// (render.ts prints them to a PDF), with the same stylesheet (css.ts, scoped to .paper), so the two always match.

// How the printed pages came out: each page's font size after shrinking to fit, the section each filler went into
// (or null if it fit nowhere), and the comic's height. render.ts measures it in Chromium.
export type Fit = { fontSizes: number[]; fillers: (string | null)[]; comicHeight: number | null };

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

  return (
    <div className="paper" style={style}>
      {!fit && <div className="fillers">{fillers}</div>}
      {settings.pages.map((_, i) => (
        <section className="page" key={i}>
          <div className="content" style={fit ? { fontSize: `${fit.fontSizes[i]}pt` } : undefined}>
            {i === 0 && <Masthead paper={paper} settings={settings} date={date} />}
            <Spots paper={paper} layout={layout} page={i} fillersIn={fillersIn} follow={follow} />
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

// A page is its layout's grid. Empty spots are taken over by a section next to them (see filledAreas).
// Each section has a spot id, "page.slot", which the fit uses to place fillers.
function Spots(props: {
  paper: Paper;
  layout: Layout;
  page: number;
  fillersIn: (spot: string) => ReactNode;
  follow?: Follow;
}) {
  const { paper, layout, page: i, fillersIn, follow } = props;
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
        style={{ gridArea: spotLetter(j), "--columns": textColumns(size.width) } as CSSProperties}
      >
        <h3 className="section-title">{section.title}</h3>
        {section.kind ? (
          features[section.kind](size)
        ) : (
          <>
            {lead && (
              <Article
                story={lead}
                lead={words(size) >= MAIN_STORY_WORDS}
                figure={figureFor(lead, j)}
                button={follow?.(lead, section)}
              />
            )}
            {others.map((s, n) => (
              <Article key={n} story={s} figure={figureFor(s, j)} button={follow?.(s, section)} />
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
function Article(props: { story: Story; lead?: boolean; figure: ReactNode; button?: ReactNode }) {
  const { story: s, lead = false, figure, button } = props;
  return (
    <article className={lead ? "lead" : ""}>
      {button}
      {s.label && <p className="label">{s.label}</p>}
      <h2>{s.headline}</h2>
      <p className="deck">{s.deck}</p>
      {figure}
      <div className="body">
        {withTerms(s).map((p, n) => (
          <p key={n}>{p}</p>
        ))}
        {s.sources.length > 0 && <p className="sources">Sources: {hyphenate(s.sources.map((src) => src.name).join(", "))}</p>}
      </div>
      <StoryTimeline timeline={s.timeline} whyItMatters={s.whyItMatters} />
    </article>
  );
}

// Older editions have no timeline; their saved layout and PDF remain valid.
function StoryTimeline({ timeline, whyItMatters }: { timeline?: Story["timeline"]; whyItMatters?: string }) {
  if (!timeline || timeline.length < 3) return null;
  const milestones = timeline.slice(0, 3);
  return (
    <aside className="story-timeline" aria-label="Story progression">
      <p className="timeline-title">How it unfolded</p>
      <ol>
        {milestones.map((milestone, i) => (
          <li key={i}>
            <span className="timeline-date">{milestone.date}</span>
            <span className="timeline-stage">{i === 0 ? "Started" : i === milestones.length - 1 ? "Now" : "Changed"}</span>
            <span>{hyphenate(milestone.event)}</span>
          </li>
        ))}
      </ol>
      {whyItMatters?.trim() && <p className="timeline-impact"><b>Why it matters</b> {hyphenate(whyItMatters.trim())}</p>}
    </aside>
  );
}
