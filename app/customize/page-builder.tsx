"use client";

import { useState } from "react";
import { FeaturePreview, LayoutThumb } from "./parts";
import defaults from "@/paper.json";
import {
  FEATURES,
  fits,
  LAYOUTS,
  MAX_PAGES,
  PAPER_SIZES,
  PRESET_SECTIONS,
  Settings,
  spotCount,
  TYPEFACES,
  type Layout,
  type Page,
  type Section,
} from "@/lib/settings";
import { filledAreas, measure, spotLetter, words } from "@/lib/space";

// The pages every new reader starts with.
const DEFAULT_PAGES = Settings.parse(defaults).pages;

type Spot = { page: number; slot: number };
// What the side panel shows: a spot on a page, a page, a section in the list, or a form for a new page or section.
type Selected =
  | ({ type: "spot" } & Spot)
  | { type: "page"; page: number }
  | { type: "listed"; title: string }
  | { type: "newPage" }
  | { type: "newSection" };

const same = (a?: Spot | null, b?: Spot | null) => !!a && !!b && a.page === b.page && a.slot === b.slot;
const isPreset = (title: string) => PRESET_SECTIONS.some((p) => p.title === title);

// The pages as small previews of their layouts. Sections are dragged from the list into spots (the spots where one
// fits light up), and everything about the selected spot, section or page is set in the side panel.
export function PageBuilder({
  settings,
  set,
  pages,
  setPages,
}: {
  settings: Settings;
  set: (change: Partial<Settings>) => void;
  pages: Page[];
  setPages: (pages: Page[]) => void;
}) {
  const [history, setHistory] = useState<Page[][]>([]);
  const [dragged, setDragged] = useState<{ section: Section; from?: Spot } | null>(null);
  const [over, setOver] = useState<Spot | "list" | null>(null);
  const [selected, setSelected] = useState<Selected | null>(null);

  // Every section the reader can use. The reader's own version of a ready-made section replaces it.
  const sections = [
    ...PRESET_SECTIONS.map((p) => settings.customSections.find((c) => c.title === p.title) ?? p),
    ...settings.customSections.filter((c) => !isPreset(c.title)),
  ];
  const placed = new Set(pages.flatMap((p) => p.slots.map((s) => s?.title)));
  const available = sections.filter((s) => !placed.has(s.title));
  const groups = [
    { name: "News", sections: available.filter((s) => !s.kind && isPreset(s.title)) },
    { name: "Puzzles & extras", sections: available.filter((s) => s.kind) },
    { name: "Your sections", sections: available.filter((s) => !isPreset(s.title)) },
  ];

  // Every change to the pages can be undone. Undo clears the selection, which may be a page or spot that's gone.
  const change = (next: Page[]) => {
    setHistory([...history, pages]);
    setPages(next);
  };
  const undo = () => {
    setPages(history.at(-1)!);
    setHistory(history.slice(0, -1));
    setSelected(null);
  };
  // The default pages, with the reader's own version of each ready-made section.
  const resetPages = () => {
    const own = (s: Section | null) => s && (sections.find((c) => c.title === s.title) ?? s);
    change(DEFAULT_PAGES.map((p) => ({ ...p, slots: p.slots.map(own) })));
    setSelected(null);
  };
  const withSlot = (pages: Page[], { page, slot }: Spot, section: Section | null) =>
    pages.map((p, i) => (i === page ? { ...p, slots: p.slots.map((s, j) => (j === slot ? section : s)) } : p));

  // A spot's own size, as if every spot were filled. Puzzles, the weather and the comic need room (see `fits`).
  const spotSize = ({ page, slot }: Spot, layout = pages[page].layout) =>
    measure({ layout, slots: Array(spotCount(layout)).fill(true) }, page === 0, settings.paperSize)[slot]!;
  const fitsAt = (section: Section | null, spot: Spot, layout?: Layout) =>
    !section || fits(section, spot.page, spotSize(spot, layout));
  // A section can go in a spot if it fits, and when swapping, if the section already there fits where it came from.
  const canDrop = (spot: Spot, section: Section, from?: Spot) =>
    fitsAt(section, spot) && (!from || fitsAt(pages[spot.page].slots[spot.slot], from));

  // Puts a section in a spot. If it came from another spot, the two swap.
  const place = (to: Spot, section: Section | null, from?: Spot) => {
    let next = withSlot(pages, to, section);
    if (from) next = withSlot(next, from, pages[to.page].slots[to.slot]);
    change(next);
  };
  const drop = (spot: Spot) => {
    if (dragged && !same(dragged.from, spot) && canDrop(spot, dragged.section, dragged.from)) {
      place(spot, dragged.section, dragged.from);
      setSelected({ type: "spot", ...spot });
    }
    endDrag();
  };
  const endDrag = () => {
    setDragged(null);
    setOver(null);
  };

  // Gives a page a new layout. Its sections fill the new spots in order, each in the first free spot where it fits;
  // any that fit nowhere go back to the list.
  const setLayout = (page: number, layout: Layout) => {
    const slots: (Section | null)[] = Array(spotCount(layout)).fill(null);
    for (const section of pages[page].slots) {
      const free = slots.findIndex((s, j) => !s && fitsAt(section, { page, slot: j }, layout));
      if (section && free >= 0) slots[free] = section;
    }
    change(pages.map((p, i) => (i === page ? { layout, slots } : p)));
  };
  const addPage = (layout: Layout) => {
    change([...pages, { layout, slots: Array(spotCount(layout)).fill(null) }]);
    setSelected({ type: "page", page: pages.length });
  };
  // Swaps a page with the one next to it. The front page stays first.
  const movePage = (page: number, by: -1 | 1) => {
    const next = [...pages];
    [next[page], next[page + by]] = [next[page + by], next[page]];
    change(next);
    setSelected({ type: "page", page: page + by });
  };

  // Saves a new or edited section, and updates it wherever it's placed. Only a name is needed: without a
  // description, the editor covers the news about that name. Returns false if the name is taken.
  // Like the list of sections, an edit can't be undone, so it's made in the undo history too: undoing a move after a
  // rename keeps the new name.
  const saveSection = (original: string, section: Section) => {
    const lower = section.title.toLowerCase();
    if (sections.some((s) => s.title.toLowerCase() === lower && s.title !== original)) return false;
    const saved = settings.customSections.some((c) => c.title === original);
    set({
      customSections: saved
        ? settings.customSections.map((c) => (c.title === original ? section : c))
        : [...settings.customSections, section],
    });
    if (original) {
      const edited = (pages: Page[]) =>
        pages.map((p) => ({ ...p, slots: p.slots.map((s) => (s?.title === original ? section : s)) }));
      setPages(edited(pages));
      setHistory(history.map(edited));
    }
    // A new section, or one renamed in the list, stays selected under its new name.
    if (!original || selected?.type === "listed") setSelected({ type: "listed", title: section.title });
    return true;
  };

  const fonts = TYPEFACES[settings.typeface];
  const size = PAPER_SIZES[settings.paperSize];

  // The side panel, for whatever is selected.
  const panel = () => {
    if (!selected) return <p className="muted">Click a section, an empty spot or a page to see its settings here.</p>;

    if (selected.type === "newPage" || selected.type === "page") {
      const page = selected.type === "page" ? selected.page : -1;
      return (
        <>
          <strong>{page < 0 ? "New page: choose a layout" : `Page ${page + 1}`}</strong>
          <div className="layout-choices">
            {Object.entries(LAYOUTS).map(([key, layout]) => (
              <button
                key={key}
                type="button"
                className="layout-choice"
                aria-pressed={page >= 0 && pages[page].layout === key}
                onClick={() => (page < 0 ? addPage(key as Layout) : setLayout(page, key as Layout))}
              >
                <LayoutThumb layout={key as Layout} />
                {layout.label}
              </button>
            ))}
          </div>
          {page > 0 && (
            <span className="panel-actions">
              <button type="button" className="link" onClick={() => movePage(page, -1)} disabled={page === 1}>
                ← Move left
              </button>
              <button
                type="button"
                className="link"
                onClick={() => movePage(page, 1)}
                disabled={page === pages.length - 1}
              >
                Move right →
              </button>
              <button
                type="button"
                className="link"
                onClick={() => {
                  change(pages.filter((_, i) => i !== page));
                  setSelected(null);
                }}
              >
                Remove page
              </button>
            </span>
          )}
        </>
      );
    }

    if (selected.type === "newSection")
      return (
        <>
          <strong>New section</strong>
          <SectionForm key="new" section={null} onSave={(section) => saveSection("", section)} />
        </>
      );

    if (selected.type === "spot" && !pages[selected.page].slots[selected.slot]) {
      const fitting = available.filter((s) => fitsAt(s, selected));
      const grower = takenBy(pages[selected.page], selected.slot);
      return (
        <>
          <strong>Empty spot on page {selected.page + 1}</strong>
          <span className="muted">
            {grower ? `${grower} grows into it in print. Or add a section:` : "Add a section here:"}
          </span>
          {fitting.map((s) => (
            <button key={s.title} type="button" className="panel-choice" onClick={() => place(selected, s)}>
              {s.title} <span className="muted">{s.about}</span>
            </button>
          ))}
          {fitting.length < available.length && (
            <span className="muted">Puzzles and extras that need a bigger spot aren't listed.</span>
          )}
        </>
      );
    }

    // A section: in a spot, or in the list.
    const spot = selected.type === "spot" ? selected : null;
    const section = spot
      ? pages[spot.page].slots[spot.slot]
      : sections.find((s) => selected.type === "listed" && s.title === selected.title);
    if (!section) return null;
    const room = spot && measure(pages[spot.page], spot.page === 0, settings.paperSize)[spot.slot]!;
    return (
      <>
        <strong>{section.title}</strong>
        <span className="muted">
          {spot ? `Page ${spot.page + 1}` : "In the list"}
          {room && !section.kind && ` · about ${words(room)} words`}
          {section.kind && ` · ${FEATURES[section.kind].about}`}
        </span>
        {!section.kind && (
          <SectionForm key={section.title} section={section} onSave={(s) => saveSection(section.title, s)} />
        )}
        {spot ? (
          <button type="button" className="link" onClick={() => place(spot, null)}>
            Remove from the page
          </button>
        ) : (
          <>
            <span className="muted">Drag it onto a page, or click an empty spot.</span>
            {!isPreset(section.title) && (
              <button
                type="button"
                className="link"
                onClick={() => {
                  set({ customSections: settings.customSections.filter((c) => c.title !== section.title) });
                  setSelected(null);
                }}
              >
                Delete this section
              </button>
            )}
          </>
        )}
      </>
    );
  };

  return (
    <>
      <div className="builder-bar">
        <span>
          Go back to:{" "}
          <button type="button" className="link" onClick={resetPages}>
            Default pages
          </button>
        </span>
        <button type="button" className="link" onClick={undo} disabled={!history.length}>
          ↶ Undo
        </button>
      </div>
      <p className="muted">
        Drag sections onto the pages: the spots where one fits light up. Click anything to change it.
      </p>

      <div className={`workspace${dragged ? " dragging" : ""}`}>
        <aside
          className={`palette${dragged?.from ? " drop-target" : ""}${over === "list" ? " over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver("list");
          }}
          onDragLeave={() => setOver(null)}
          onDrop={() => {
            if (dragged?.from) place(dragged.from, null);
            endDrag();
          }}
        >
          {dragged?.from && <p className="drop-hint">Drop here to remove</p>}
          {groups
            .filter((group) => group.sections.length || group.name === "Your sections")
            .map((group) => (
              <div key={group.name} className="palette-group">
                <span className="palette-heading">{group.name}</span>
                {group.sections.map((s) => (
                  <button
                    key={s.title}
                    type="button"
                    className={`chip${dragged?.section === s ? " lifted" : ""}`}
                    aria-pressed={selected?.type === "listed" && selected.title === s.title}
                    title={s.about}
                    draggable
                    onDragStart={() => setDragged({ section: s })}
                    onDragEnd={endDrag}
                    onClick={() => setSelected({ type: "listed", title: s.title })}
                  >
                    <span className="handle" aria-hidden>
                      ⠿
                    </span>{" "}
                    {s.title}
                  </button>
                ))}
                {group.name === "Your sections" && (
                  <button type="button" className="link" onClick={() => setSelected({ type: "newSection" })}>
                    + New section
                  </button>
                )}
              </div>
            ))}
        </aside>

        <div className="sheets">
          {pages.map((page, i) => {
            const { rows, areas } = LAYOUTS[page.layout];
            const space = measure(page, i === 0, settings.paperSize);
            return (
              <div key={i} className="sheet-wrap">
                <div
                  className={`sheet${selected?.type === "page" && selected.page === i ? " selected" : ""}`}
                  style={{
                    aspectRatio: `${parseFloat(size.width)} / ${parseFloat(size.height)}`,
                    fontFamily: fonts.body,
                  }}
                  onClick={() => setSelected({ type: "page", page: i })}
                >
                  {i === 0 && (
                    <div className="sheet-masthead" style={{ fontFamily: fonts.masthead }}>
                      {settings.name}
                    </div>
                  )}
                  <div
                    className="sheet-spots"
                    style={{
                      gridTemplateAreas: areas.map((row) => `"${row}"`).join(" "),
                      gridTemplateRows: rows.map((r) => `${r}fr`).join(" "),
                    }}
                  >
                    {page.slots.map((section, j) => {
                      const spot = { page: i, slot: j };
                      // While dragging, the spots where the section fits light up and the others dim.
                      const fit =
                        dragged && !same(dragged.from, spot) ? canDrop(spot, dragged.section, dragged.from) : null;
                      const grower = !section && takenBy(page, j);
                      return (
                        <div
                          key={j}
                          role="button"
                          tabIndex={0}
                          aria-label={`Page ${i + 1}: ${section?.title ?? "empty spot"}`}
                          className={[
                            "sheet-spot",
                            !section && "empty",
                            fit === true && "fits",
                            fit === false && "no-fit",
                            fit && same(over as Spot, spot) && "over",
                            selected?.type === "spot" && same(selected, spot) && "selected",
                            same(dragged?.from, spot) && "lifted",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          style={{ gridArea: spotLetter(j) }}
                          draggable={!!section}
                          onDragStart={() => section && setDragged({ section, from: spot })}
                          onDragEnd={endDrag}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setOver(spot);
                          }}
                          onDragLeave={() => setOver(null)}
                          onDrop={() => drop(spot)}
                          onClick={(e) => {
                            e.stopPropagation(); // not the page
                            setSelected({ type: "spot", ...spot });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelected({ type: "spot", ...spot });
                            }
                          }}
                        >
                          {!section ? (
                            <span>{grower ? `${grower} grows here` : "+ Add"}</span>
                          ) : (
                            <>
                              <span className="sheet-section">{section.title}</span>
                              {section.kind ? (
                                <FeaturePreview kind={section.kind} />
                              ) : (
                                <>
                                  <span className="sheet-size">~{words(space[j]!)} words</span>
                                  <span className="sheet-lines" />
                                </>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  className="link sheet-label"
                  onClick={() => setSelected({ type: "page", page: i })}
                >
                  Page {i + 1} · {LAYOUTS[page.layout].label}
                </button>
              </div>
            );
          })}
          {pages.length < MAX_PAGES && (
            <button type="button" className="add-page" onClick={() => setSelected({ type: "newPage" })}>
              + Add a page
            </button>
          )}
        </div>

        <aside className="panel" aria-live="polite">
          {panel()}
        </aside>
      </div>
    </>
  );
}

// The section that grows into an empty spot in print, if any (see filledAreas).
function takenBy(page: Page, slot: number) {
  const cell = LAYOUTS[page.layout].areas.join(" ").split(" ").indexOf(spotLetter(slot));
  const letter = filledAreas(page).flat()[cell];
  return letter === spotLetter(slot) ? null : page.slots[letter.charCodeAt(0) - 97]?.title;
}

// The settings of a section of stories: its name (only for the reader's own sections), what it covers and its
// preferred sources. `section` is null for a new one. `onSave` returns false if the name is taken.
function SectionForm({ section, onSave }: { section: Section | null; onSave: (section: Section) => boolean }) {
  const [title, setTitle] = useState(section?.title ?? "");
  const [about, setAbout] = useState(section?.about ?? "");
  const [sources, setSources] = useState(section?.sources?.join(", ") ?? "");
  const [nameTaken, setNameTaken] = useState(false);
  const preset = !!section && isPreset(section.title);
  const changed =
    title !== (section?.title ?? "") ||
    about !== (section?.about ?? "") ||
    sources !== (section?.sources?.join(", ") ?? "");

  const save = () => {
    const name = title.trim();
    if (!name) return;
    const sourceList = sources
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setNameTaken(!onSave({ title: name, about: about.trim() || `news about ${name}`, sources: sourceList }));
  };

  return (
    <div
      className="section-form"
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
          e.preventDefault(); // don't submit the whole form
          save();
        }
      }}
    >
      <label>
        Name
        <input
          autoFocus={!section}
          placeholder="e.g. Gardening"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={preset}
          maxLength={40}
        />
        {nameTaken && <span className="muted">That name is taken.</span>}
        {preset && <span className="muted">Ready-made sections keep their name.</span>}
      </label>
      <label>
        <span>
          What it covers <span className="muted">(optional)</span>
        </span>
        <textarea
          rows={3}
          placeholder="e.g. home gardening tips and local plant sales"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          maxLength={300}
        />
      </label>
      <label>
        <span>
          Preferred sources <span className="muted">(optional, separate with commas)</span>
        </span>
        <input
          placeholder="e.g. Gardenista, The Guardian"
          value={sources}
          onChange={(e) => setSources(e.target.value)}
        />
      </label>
      <button type="button" className="button" onClick={save} disabled={!title.trim() || (!!section && !changed)}>
        {section ? "Save changes" : "Add section"}
      </button>
    </div>
  );
}
