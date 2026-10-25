"use client";

import { useState } from "react";
import { Dialog, FeaturePreview } from "./parts";
import defaults from "@/paper.json";
import {
  fits,
  LENGTHS,
  MAX_COLUMNS,
  MAX_PAGES,
  MAX_STACK,
  pageItems,
  PAPER_SIZES,
  PRESET_SECTIONS,
  Settings,
  TYPEFACES,
  type Draft,
  type Item,
  type Page,
  type Section,
} from "@/lib/settings";
import { columnHeight, gridPlaces, measure, widths, words } from "@/lib/space";

// The pages every new reader starts with.
const DEFAULT_PAGES = Settings.parse(defaults).pages;

// Below this, a story is little more than a headline: the preview warns about it.
const MIN_WORDS = 60;

// A place for a section: a position in a column (index = the column's length adds it at the end), or the band
// (column -1).
type Spot = { page: number; column: number; index: number };

const same = (a?: Spot | null, b?: Spot | null) =>
  !!a && !!b && a.page === b.page && a.column === b.column && a.index === b.index;

type Rail = NonNullable<Page["band"]>["rail"];

// Takes the section at a spot out of the pages. `pages` is a copy being changed.
function take(pages: Draft[], { page, column, index }: Spot) {
  if (column >= 0) pages[page].stacks[column].splice(index, 1);
  else pages[page].band!.item = null;
}

function put(pages: Draft[], { page, column, index }: Spot, item: Item) {
  if (column >= 0) pages[page].stacks[column].splice(index, 0, item);
  else pages[page].band!.item = item;
}

// The pages as small previews: columns of sections, and maybe a band. Sections go in by dragging them, or by clicking
// "+" and choosing one. Clicking a section sets its length, moves it or removes it.
export function PageBuilder({
  settings,
  set,
  pages,
  setPages,
}: {
  settings: Settings;
  set: (change: Partial<Settings>) => void;
  pages: Draft[];
  setPages: (pages: Draft[]) => void;
}) {
  const [history, setHistory] = useState<Draft[][]>([]);
  const [dragged, setDragged] = useState<{ item: Item; from?: Spot } | null>(null);
  const [over, setOver] = useState<Spot | "list" | null>(null);
  const [adding, setAdding] = useState<Spot | null>(null); // where a section chosen from the list goes
  const [editing, setEditing] = useState<Spot | null>(null); // the placed section whose options are open
  // The section being added or edited. `original` is its name before editing; empty for a new section.
  const [form, setForm] = useState<{ original: string; title: string; about: string; sources: string } | null>(null);
  const [nameTaken, setNameTaken] = useState(false);

  // Every section the reader can use. The reader's own version of a ready-made section replaces it.
  const sections = [
    ...PRESET_SECTIONS.map((p) => settings.customSections.find((c) => c.title === p.title) ?? p),
    ...settings.customSections.filter((c) => !isPreset(c.title)),
  ];
  const placed = new Set(pages.flatMap((p) => pageItems(p).map((item) => item.section.title)));
  const available = sections.filter((s) => !placed.has(s.title));
  const groups = [
    { name: "News", sections: available.filter((s) => !s.kind && isPreset(s.title)) },
    { name: "Puzzles & extras", sections: available.filter((s) => s.kind) },
    { name: "Your sections", sections: available.filter((s) => !isPreset(s.title)) },
  ];

  // Every change to the pages can be undone. `edit` changes a copy of the pages.
  const change = (next: Draft[]) => {
    setHistory([...history, pages]);
    setPages(next);
  };
  const edit = (update: (next: Draft[]) => void) => {
    const next = structuredClone(pages);
    update(next);
    change(next);
  };
  const undo = () => {
    setPages(history.at(-1)!);
    setHistory(history.slice(0, -1));
  };

  // Puzzles and the weather need a minimum width (see `fits`).
  const fitsAt = (section: Section, spot: Spot, inPages = pages) => {
    const width = widths(inPages[spot.page], settings.paperSize);
    return fits(section, spot.page, spot.column < 0 ? width.band : width.column);
  };
  // A section can go to a spot if it fits there, and the column has room (or it's moving within that column).
  const room = (to: Spot, from?: Spot) =>
    to.column < 0 ||
    pages[to.page].stacks[to.column].length < MAX_STACK ||
    (from?.page === to.page && from.column === to.column);
  const canPut = (section: Section, to: Spot, from?: Spot) => fitsAt(section, to) && room(to, from);

  // After the columns or band change, sections that no longer fit go back to the list.
  const prune = (page: Draft, i: number, inPages: Draft[]) => {
    page.stacks = page.stacks.map((stack, k) =>
      stack.filter((item, n) => fitsAt(item.section, { page: i, column: k, index: n }, inPages)),
    );
    if (page.band?.item && !fitsAt(page.band.item.section, { page: i, column: -1, index: 0 }, inPages))
      page.band.item = null;
  };

  // Moves a section to a spot (from another spot, or from the list). The band holds one section: the one already
  // there goes back to where the new one came from, if it fits, or to the list.
  const move = (to: Spot, item: Item, from?: Spot) =>
    edit((next) => {
      const replaced = to.column < 0 ? next[to.page].band!.item : null;
      if (from) take(next, from);
      const shifted = from && from.page === to.page && from.column === to.column && from.index < to.index;
      put(next, shifted ? { ...to, index: to.index - 1 } : to, item);
      if (replaced && from && fitsAt(replaced.section, from)) put(next, from, replaced);
    });

  // What dropping the dragged section here would do, shown while dragging over it.
  const dropLabel = (spot: Spot) => {
    if (!dragged || same(dragged.from, spot)) return null;
    if (!fitsAt(dragged.item.section, spot)) return "Doesn't fit";
    if (!room(spot, dragged.from)) return "Column is full";
    if (spot.column < 0) return pages[spot.page].band!.item ? (dragged.from ? "Swap" : "Replace") : "Place";
    return "Put here";
  };
  const drop = (spot: Spot) => {
    if (dragged && !same(dragged.from, spot) && canPut(dragged.item.section, spot, dragged.from))
      move(spot, dragged.item, dragged.from);
    endDrag();
  };
  const endDrag = () => {
    setDragged(null);
    setOver(null);
  };
  // Drag-and-drop handlers for a drop spot.
  const dropTarget = (spot: Spot) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setOver(spot);
    },
    onDragLeave: () => setOver(null),
    onDrop: () => drop(spot),
  });
  const labelAt = (spot: Spot) => (same(over as Spot, spot) ? dropLabel(spot) : null);
  const dropClass = (label: string | null) =>
    !label ? "" : label === "Doesn't fit" || label === "Column is full" ? " blocked" : " over";

  // Adds an empty column on the right; columns get narrower, so puzzles that no longer fit go back to the list.
  const addColumn = (i: number) =>
    edit((next) => {
      next[i].stacks.push([]);
      next[i].columns++;
      prune(next[i], i, next);
    });
  // Removes an empty column. With one column left, the band covers it.
  const removeColumn = (i: number, k: number) =>
    edit((next) => {
      const page = next[i];
      page.stacks.splice(k, 1);
      page.columns--;
      if (page.columns === 1 && page.band) page.band.rail = "none";
    });
  const setBand = (i: number, at: "none" | "top" | "bottom") =>
    edit((next) => {
      const page = next[i];
      page.band = at === "none" ? null : { item: null, rail: "none", ...page.band, at };
      prune(page, i, next);
    });
  const setRail = (i: number, rail: Rail) =>
    edit((next) => {
      next[i].band!.rail = rail;
      prune(next[i], i, next);
    });

  // Swaps a page with the one next to it. The front page stays first.
  const movePage = (page: number, by: -1 | 1) => {
    const next = [...pages];
    [next[page], next[page + by]] = [next[page + by], next[page]];
    change(next);
  };

  const openForm = (section?: Section) => {
    setForm({
      original: section?.title ?? "",
      title: section?.title ?? "",
      about: section?.about ?? "",
      sources: section?.sources?.join(", ") ?? "",
    });
    setNameTaken(false);
  };

  // Saves a new or edited section, and updates it wherever it's placed.
  // Only a name is needed: without a description, the editor covers the news about that name.
  const saveSection = () => {
    const { original } = form!;
    const title = form!.title.trim();
    if (!title) return;
    const taken = sections.some((s) => s.title.toLowerCase() === title.toLowerCase() && s.title !== original);
    setNameTaken(taken);
    if (taken) return;
    const section = {
      title,
      about: form!.about.trim() || `news about ${title}`,
      sources: form!.sources
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    const saved = settings.customSections.some((c) => c.title === original);
    set({
      customSections: saved
        ? settings.customSections.map((c) => (c.title === original ? section : c))
        : [...settings.customSections, section],
    });
    if (original)
      edit((next) =>
        next.forEach((p) =>
          pageItems(p).forEach((item) => item.section.title === original && (item.section = section)),
        ),
      );
    setForm(null);
  };

  const fonts = TYPEFACES[settings.typeface];
  const size = PAPER_SIZES[settings.paperSize];
  const removing = over === "list" && dragged?.from;
  const editingItem = editing && itemAt(pages, editing);

  // A placed section in a preview, sized like it prints.
  const block = (item: Item, spot: Spot, height: number, inches: { width: number; height: number }) => {
    const label = labelAt(spot);
    return (
      <div
        key={`${spot.column}-${spot.index}`}
        role="button"
        tabIndex={0}
        aria-label={`Page ${spot.page + 1}: ${item.section.title}. Options.`}
        className={`sheet-item${dropClass(label)}${same(dragged?.from, spot) ? " lifted" : ""}`}
        style={{ flex: `${height} 1 0` }}
        draggable
        onDragStart={() => setDragged({ item, from: spot })}
        onDragEnd={endDrag}
        {...dropTarget(spot)}
        onClick={() => setEditing(spot)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setEditing(spot);
          }
        }}
      >
        {label && <span className="drop-label">{label}</span>}
        <span className="sheet-section">{item.section.title}</span>
        {item.section.kind ? (
          <FeaturePreview kind={item.section.kind} />
        ) : (
          <>
            <span className="sheet-size">
              {LENGTHS[item.length]} · ~{words(inches)} words
            </span>
            {words(inches) < MIN_WORDS && <span className="sheet-warning">Too small to read well</span>}
            <span className="sheet-lines" />
          </>
        )}
      </div>
    );
  };

  // An empty place to add a section: the band, or the end of a column.
  const addButton = (spot: Spot, text: string, grow: boolean) => {
    const label = labelAt(spot);
    return (
      <button
        type="button"
        className={`sheet-add${grow ? " grow" : ""}${dropClass(label)}`}
        aria-label={`Page ${spot.page + 1}: ${text}`}
        onClick={() => setAdding(spot)}
        {...dropTarget(spot)}
      >
        {label ? <span className="drop-label">{label}</span> : text}
      </button>
    );
  };

  return (
    <>
      <div className="builder-bar">
        <span>
          Go back to:{" "}
          <button type="button" className="link" onClick={() => change(DEFAULT_PAGES)}>
            Default pages
          </button>
        </span>
        <button type="button" className="link" onClick={undo} disabled={!history.length}>
          ↶ Undo
        </button>
      </div>
      <p className="muted">
        Drag sections into the columns, or click + to add a section or a column (up to {MAX_COLUMNS} columns, with up to{" "}
        {MAX_STACK} sections each). Click a section to set its length or move it.
      </p>

      <div className={`workspace${dragged ? " dragging" : ""}`}>
        <aside
          className={`palette${dragged?.from ? " drop-target" : ""}${removing ? " over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver("list");
          }}
          onDragLeave={() => setOver(null)}
          onDrop={() => {
            const from = dragged?.from;
            if (from) edit((next) => take(next, from));
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
                  <div
                    key={s.title}
                    className={`chip${dragged?.item.section === s ? " lifted" : ""}`}
                    title={s.about}
                    draggable
                    onDragStart={() => setDragged({ item: { section: s, length: "medium" } })}
                    onDragEnd={endDrag}
                  >
                    <span>
                      <span className="handle" aria-hidden>
                        ⠿
                      </span>{" "}
                      {s.title}
                    </span>
                    <span className="chip-actions">
                      {!s.kind && (
                        <button
                          type="button"
                          className="link"
                          onClick={() => openForm(s)}
                          aria-label={`Edit ${s.title}`}
                        >
                          ✎
                        </button>
                      )}
                      {!isPreset(s.title) && (
                        <button
                          type="button"
                          className="link"
                          onClick={() => set({ customSections: settings.customSections.filter((c) => c !== s) })}
                          aria-label={`Delete ${s.title}`}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  </div>
                ))}
                {group.name === "Your sections" && (
                  <button type="button" className="link" onClick={() => openForm()}>
                    + New section
                  </button>
                )}
              </div>
            ))}
        </aside>

        <div className="sheets">
          {pages.map((page, i) => {
            const space = measure(page, i === 0, settings.paperSize);
            const places = gridPlaces(page);
            const bandSpot = { page: i, column: -1, index: 0 };
            // The preview's grid matches the printed page (see layout.ts).
            const bandHeight = page.band ? space[0].height : 0;
            const restHeight = columnHeight(i === 0, settings.paperSize) - bandHeight;
            const rows = !page.band
              ? "1fr"
              : page.band.at === "top"
              ? `${bandHeight}fr ${restHeight}fr`
              : `${restHeight}fr ${bandHeight}fr`;
            let j = page.band ? 1 : 0;
            return (
              <div key={i} className="sheet-wrap">
                <div
                  className="sheet"
                  style={{
                    aspectRatio: `${parseFloat(size.width)} / ${parseFloat(size.height)}`,
                    fontFamily: fonts.body,
                  }}
                >
                  {i === 0 && (
                    <div className="sheet-masthead" style={{ fontFamily: fonts.masthead }}>
                      {settings.name}
                    </div>
                  )}
                  <div
                    className="sheet-columns"
                    style={{
                      gridTemplate: `${rows} / repeat(${page.columns}, 1fr)${
                        page.columns < MAX_COLUMNS ? " auto" : ""
                      }`,
                    }}
                  >
                    {page.band && (
                      <div className="sheet-stack" style={{ gridColumn: places.band.column, gridRow: places.band.row }}>
                        {page.band.item
                          ? block(page.band.item, bandSpot, 1, space[0])
                          : addButton(bandSpot, "+ Band section", true)}
                      </div>
                    )}
                    {page.stacks.map((stack, k) => (
                      <div
                        key={k}
                        className="sheet-stack"
                        style={{ gridColumn: places.column(k).column, gridRow: places.column(k).row }}
                      >
                        {stack.map((item, n) => {
                          const inches = space[j++];
                          return block(item, { page: i, column: k, index: n }, inches.height, inches);
                        })}
                        {stack.length < MAX_STACK &&
                          addButton(
                            { page: i, column: k, index: stack.length },
                            stack.length ? "+" : "+ Add section",
                            !stack.length,
                          )}
                        {!stack.length && page.columns > 1 && (
                          <button type="button" className="sheet-add" onClick={() => removeColumn(i, k)}>
                            Remove column
                          </button>
                        )}
                      </div>
                    ))}
                    {page.columns < MAX_COLUMNS && (
                      <button
                        type="button"
                        className="sheet-add add-column"
                        style={{ gridRow: "1 / -1" }}
                        onClick={() => addColumn(i)}
                        aria-label={`Page ${i + 1}: add a column`}
                      >
                        + Add column
                      </button>
                    )}
                  </div>
                </div>
                <div className="sheet-controls">
                  <span>Page {i + 1}</span>
                  <label>
                    Band{" "}
                    <select value={page.band?.at ?? "none"} onChange={(e) => setBand(i, e.target.value as "none")}>
                      <option value="none">None</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </label>
                  {page.band && page.columns > 1 && (
                    <label>
                      Width{" "}
                      <select value={page.band.rail} onChange={(e) => setRail(i, e.target.value as Rail)}>
                        <option value="none">All columns</option>
                        <option value="left">Leave a column on the left</option>
                        <option value="right">Leave a column on the right</option>
                      </select>
                    </label>
                  )}
                  {i > 0 && (
                    <span className="page-actions">
                      <button
                        type="button"
                        className="link"
                        onClick={() => movePage(i, -1)}
                        disabled={i === 1}
                        aria-label={`Move page ${i + 1} left`}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        className="link"
                        onClick={() => movePage(i, 1)}
                        disabled={i === pages.length - 1}
                        aria-label={`Move page ${i + 1} right`}
                      >
                        →
                      </button>
                      <button type="button" className="link" onClick={() => change(pages.filter((_, n) => n !== i))}>
                        Remove
                      </button>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {pages.length < MAX_PAGES && (
            <button
              type="button"
              className="add-page"
              onClick={() => change([...pages, { columns: 1, band: null, stacks: [[]] }])}
            >
              + Add a page
            </button>
          )}
        </div>
      </div>

      {form && (
        <Dialog label={form.original ? `Edit ${form.original}` : "New section"} onClose={() => setForm(null)}>
          <div
            className="new-section"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault(); // don't submit the whole form
                saveSection();
              }
            }}
          >
            <strong>{form.original ? `Edit ${form.original}` : "New section"}</strong>
            <label>
              Name
              <input
                autoFocus
                placeholder="e.g. Gardening"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                disabled={isPreset(form.original)}
                maxLength={40}
              />
              {nameTaken && <span className="muted">That name is taken.</span>}
              {isPreset(form.original) && <span className="muted">Ready-made sections keep their name.</span>}
            </label>
            <label>
              <span>
                What it covers <span className="muted">(optional)</span>
              </span>
              <input
                autoFocus={isPreset(form.original)}
                placeholder="e.g. home gardening tips and local plant sales"
                value={form.about}
                onChange={(e) => setForm({ ...form, about: e.target.value })}
                maxLength={300}
              />
            </label>
            <label>
              <span>
                Preferred sources <span className="muted">(optional, separate with commas)</span>
              </span>
              <input
                placeholder="e.g. Gardenista, The Guardian"
                value={form.sources}
                onChange={(e) => setForm({ ...form, sources: e.target.value })}
              />
            </label>
            <span className="dialog-actions">
              <button type="button" className="button" onClick={saveSection}>
                {form.original ? "Save section" : "Add section"}
              </button>
              <button type="button" className="link" onClick={() => setForm(null)}>
                Cancel
              </button>
            </span>
          </div>
        </Dialog>
      )}

      {adding && (
        <Dialog label={`Add a section to page ${adding.page + 1}`} onClose={() => setAdding(null)}>
          <strong>
            Page {adding.page + 1}, {adding.column < 0 ? "band" : `column ${adding.column + 1}`}
          </strong>
          {!available.some((s) => fitsAt(s, adding)) && <p className="muted">No other section fits here.</p>}
          {available
            .filter((s) => fitsAt(s, adding))
            .map((s, k) => (
              <button
                key={s.title}
                type="button"
                autoFocus={k === 0}
                onClick={() => {
                  move(adding, { section: s, length: "medium" });
                  setAdding(null);
                }}
              >
                {s.title}{" "}
                <span className="muted">
                  {s.about}
                  {s.sources?.length ? ` · prefers ${s.sources.join(", ")}` : ""}
                </span>
              </button>
            ))}
          <button type="button" className="link" onClick={() => setAdding(null)}>
            Cancel
          </button>
        </Dialog>
      )}

      {editing && editingItem && (
        <Dialog label={editingItem.section.title} onClose={() => setEditing(null)}>
          <strong>{editingItem.section.title}</strong>
          {!editingItem.section.kind && (
            <span className="lengths" role="group" aria-label="Length">
              {Object.entries(LENGTHS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className="button"
                  aria-pressed={editingItem.length === key}
                  onClick={() => edit((next) => (itemAt(next, editing)!.length = key as Item["length"]))}
                >
                  {label}
                </button>
              ))}
            </span>
          )}
          {editing.column >= 0 &&
            moves(pages[editing.page], editing).map(({ label, to }) => (
              <button
                key={label}
                type="button"
                disabled={!canPut(editingItem.section, to, editing)}
                onClick={() => {
                  move(to, editingItem, editing);
                  setEditing(null);
                }}
              >
                {label}
              </button>
            ))}
          {!editingItem.section.kind && (
            <button
              type="button"
              onClick={() => {
                openForm(editingItem.section);
                setEditing(null);
              }}
            >
              Edit {editingItem.section.title}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              edit((next) => take(next, editing));
              setEditing(null);
            }}
          >
            Remove from the page
          </button>
          <button type="button" className="link" onClick={() => setEditing(null)}>
            Done
          </button>
        </Dialog>
      )}
    </>
  );
}

const isPreset = (title: string) => PRESET_SECTIONS.some((p) => p.title === title);

const itemAt = (pages: Draft[], { page, column, index }: Spot) =>
  column < 0 ? pages[page].band?.item : pages[page].stacks[column][index];

// Where a section in a column can move with one click: up, down, or to the end of the next column.
function moves(page: Draft, { page: i, column, index }: Spot) {
  const options = [
    index > 0 && { label: "Move up", to: { page: i, column, index: index - 1 } },
    index < page.stacks[column].length - 1 && { label: "Move down", to: { page: i, column, index: index + 2 } },
    column > 0 && {
      label: "Move to the column on the left",
      to: { page: i, column: column - 1, index: page.stacks[column - 1].length },
    },
    column < page.columns - 1 && {
      label: "Move to the column on the right",
      to: { page: i, column: column + 1, index: page.stacks[column + 1].length },
    },
  ];
  return options.filter((o) => !!o);
}
