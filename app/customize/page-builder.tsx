"use client";

import { useEffect, useState } from "react";
import defaults from "@/paper.json";
import {
  area,
  fits,
  LAYOUTS,
  MAX_PAGES,
  PAPER_SIZES,
  PRESET_SECTIONS,
  Settings,
  slotWords,
  TYPEFACES,
  type Page,
  type Section,
} from "@/lib/settings";

// The pages every new reader starts with.
const DEFAULT_PAGES = Settings.parse(defaults).pages;

// While editing, a slot can be empty. Every slot must be filled before saving.
export type Draft = { layout: Page["layout"]; slots: (Section | null)[] };
type Spot = { page: number; slot: number };

const same = (a?: Spot | null, b?: Spot | null) => !!a && !!b && a.page === b.page && a.slot === b.slot;

// The pages as small previews. Sections go into slots by dragging them, or by clicking a slot and choosing one.
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
  const [dragged, setDragged] = useState<{ section: Section; from?: Spot } | null>(null);
  const [over, setOver] = useState<Spot | "list" | null>(null);
  const [picking, setPicking] = useState<Spot | null>(null);
  // The section being added or edited. `original` is its name before editing; empty for a new section.
  const [form, setForm] = useState<{ original: string; title: string; about: string; sources: string } | null>(null);
  const [nameTaken, setNameTaken] = useState(false);

  // Every section the reader can use. The reader's own version of a ready-made section replaces it.
  const sections = [
    ...PRESET_SECTIONS.map((p) => settings.customSections.find((c) => c.title === p.title) ?? p),
    ...settings.customSections.filter((c) => !isPreset(c.title)),
  ];
  const placed = new Set(pages.flatMap((p) => p.slots.map((s) => s?.title)));
  const available = sections.filter((s) => !placed.has(s.title));

  // Every change to the pages can be undone.
  const change = (next: Draft[]) => {
    setHistory([...history, pages]);
    setPages(next);
  };
  const undo = () => {
    setPages(history.at(-1)!);
    setHistory(history.slice(0, -1));
  };

  const withSlot = (pages: Draft[], { page, slot }: Spot, section: Section | null) =>
    pages.map((p, i) => (i === page ? { ...p, slots: p.slots.map((s, j) => (j === slot ? section : s)) } : p));

  // Puts a section in a slot. If it came from another slot, the two swap.
  const place = (to: Spot, section: Section | null, from?: Spot) => {
    let next = withSlot(pages, to, section);
    if (from) next = withSlot(next, from, pages[to.page].slots[to.slot]);
    change(next);
  };

  // What dropping the dragged section here would do, shown on the slot while dragging over it.
  const dropLabel = (spot: Spot) => {
    if (!dragged || same(dragged.from, spot)) return null;
    if (!canDrop(spot, dragged.section, dragged.from)) return "Doesn't fit";
    if (!pages[spot.page].slots[spot.slot]) return "Place";
    return dragged.from ? "Swap" : "Replace";
  };

  // Puzzles and the weather need slots of certain shapes (see `fits`).
  const fitsAt = (section: Section | null, { page, slot }: Spot) =>
    !section || fits(section, page, LAYOUTS[pages[page].layout].slots[slot].shape);
  // A section can go here if it fits, and when swapping, if the section already here fits where it came from.
  const canDrop = (spot: Spot, section: Section, from?: Spot) =>
    fitsAt(section, spot) && (!from || fitsAt(pages[spot.page].slots[spot.slot], from));

  const endDrag = () => {
    setDragged(null);
    setOver(null);
  };

  const setLayout = (page: number, layout: Page["layout"]) => {
    const slots = LAYOUTS[layout].slots.map((slot, j) => {
      const section = pages[page].slots[j];
      return section && fits(section, page, slot.shape) ? section : null;
    });
    change(pages.map((p, i) => (i === page ? { layout, slots } : p)));
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

  // Saves a new or edited section, and updates it in every slot where it's placed.
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
      change(pages.map((p) => ({ ...p, slots: p.slots.map((s) => (s?.title === original ? section : s)) })));
    setForm(null);
  };

  const fonts = TYPEFACES[settings.typeface];
  const size = PAPER_SIZES[settings.paperSize];
  const removing = over === "list" && dragged?.from;

  return (
    <>
      <div className="builder-bar">
        <span>
          Go back to:{" "}
          <button type="button" className="link" onClick={() => change(DEFAULT_PAGES)}>
            Default template
          </button>
        </span>
        <button type="button" className="link" onClick={undo} disabled={!history.length}>
          ↶ Undo
        </button>
      </div>
      <p className="muted">Drag sections onto the pages, or click a slot to choose one.</p>

      <div className={`workspace${dragged ? " dragging" : ""}`}>
        <aside
          className={`palette${dragged?.from ? " drop-target" : ""}${removing ? " over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver("list");
          }}
          onDragLeave={() => setOver(null)}
          onDrop={() => {
            if (dragged?.from) change(withSlot(pages, dragged.from, null));
            endDrag();
          }}
        >
          <strong>Sections</strong>
          {dragged?.from && <p className="drop-hint">Drop here to remove</p>}
          {available.map((s) => (
            <div
              key={s.title}
              className={`chip${dragged?.section === s ? " lifted" : ""}`}
              title={s.about}
              draggable
              onDragStart={() => setDragged({ section: s })}
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
                  <button type="button" className="link" onClick={() => openForm(s)} aria-label={`Edit ${s.title}`}>
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
          <button type="button" className="link" onClick={() => openForm()}>
            + New section
          </button>
        </aside>

        <div className="sheets">
          {pages.map((page, i) => (
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
                <div className="sheet-slots" style={{ gridTemplate: LAYOUTS[page.layout].grid }}>
                  {page.slots.map((section, j) => {
                    const spot = { page: i, slot: j };
                    const label = same(over as Spot, spot) ? dropLabel(spot) : null;
                    return (
                      <div
                        key={j}
                        role="button"
                        tabIndex={0}
                        aria-label={`Page ${i + 1}, slot ${j + 1}: ${section?.title ?? "empty"}. Choose a section.`}
                        className={`sheet-slot${section ? "" : " empty"}${
                          label ? (label === "Doesn't fit" ? " blocked" : " over") : ""
                        }${same(dragged?.from, spot) ? " lifted" : ""}`}
                        style={{ gridArea: area(j) }}
                        draggable={!!section}
                        onDragStart={() => section && setDragged({ section, from: spot })}
                        onDragEnd={endDrag}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setOver(spot);
                        }}
                        onDragLeave={() => setOver(null)}
                        onDrop={() => {
                          if (dragged && !same(dragged.from, spot) && canDrop(spot, dragged.section, dragged.from)) {
                            place(spot, dragged.section, dragged.from);
                          }
                          endDrag();
                        }}
                        onClick={() => setPicking(spot)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setPicking(spot);
                          }
                        }}
                      >
                        {label && <span className="drop-label">{label}</span>}
                        {section ? (
                          <>
                            <span className="sheet-section">{section.title}</span>
                            <span className="sheet-size">
                              {section.kind ? "Made automatically" : `~${slotWords(i, page.layout, j)} words`}
                            </span>
                            <span className="sheet-lines" />
                          </>
                        ) : (
                          <span>+ Add section</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="sheet-controls">
                <span>Page {i + 1}</span>
                <span className="layouts">
                  {Object.entries(LAYOUTS).map(([key, layout]) => (
                    <button
                      key={key}
                      type="button"
                      className="layout-icon"
                      title={layout.label}
                      aria-label={layout.label}
                      aria-pressed={page.layout === key}
                      style={{ gridTemplate: layout.grid }}
                      onClick={() => setLayout(i, key as Page["layout"])}
                    >
                      {layout.slots.map((_, j) => (
                        <span key={j} style={{ gridArea: area(j) }} />
                      ))}
                    </button>
                  ))}
                </span>
                {i > 0 && (
                  <button type="button" className="link" onClick={() => change(pages.filter((_, j) => j !== i))}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          {pages.length < MAX_PAGES && (
            <button
              type="button"
              className="add-page"
              onClick={() => change([...pages, { layout: "single", slots: [null] }])}
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
              What it covers <span className="muted">(optional)</span>
              <input
                autoFocus={isPreset(form.original)}
                placeholder="e.g. home gardening tips and local plant sales"
                value={form.about}
                onChange={(e) => setForm({ ...form, about: e.target.value })}
                maxLength={300}
              />
            </label>
            <label>
              Preferred sources <span className="muted">(optional, separate with commas)</span>
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

      {picking && (
        <Dialog label={`Choose a section for page ${picking.page + 1}`} onClose={() => setPicking(null)}>
          <strong>
            Page {picking.page + 1}, slot {picking.slot + 1}
          </strong>
          {!available.some((s) => fitsAt(s, picking)) && <p className="muted">No other section fits this slot.</p>}
          {available
            .filter((s) => fitsAt(s, picking))
            .map((s, k) => (
              <button
                key={s.title}
                type="button"
                autoFocus={k === 0}
                onClick={() => {
                  place(picking, s);
                  setPicking(null);
                }}
              >
                {s.title}{" "}
                <span className="muted">
                  {s.about}
                  {s.sources?.length ? ` · prefers ${s.sources.join(", ")}` : ""}
                </span>
              </button>
            ))}
          {pages[picking.page].slots[picking.slot] && (
            <>
              {!pages[picking.page].slots[picking.slot]!.kind && (
                <button
                  type="button"
                  onClick={() => {
                    openForm(pages[picking.page].slots[picking.slot]!);
                    setPicking(null);
                  }}
                >
                  Edit {pages[picking.page].slots[picking.slot]!.title}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  place(picking, null);
                  setPicking(null);
                }}
              >
                Clear this slot
              </button>
            </>
          )}
          <button type="button" className="link" onClick={() => setPicking(null)}>
            Cancel
          </button>
        </Dialog>
      )}
    </>
  );
}

const isPreset = (title: string) => PRESET_SECTIONS.some((p) => p.title === title);

// A small centered dialog. Clicking outside it or pressing Escape closes it.
function Dialog({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const close = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);
  return (
    <div className="picker-backdrop" onClick={onClose}>
      <div className="picker" role="dialog" aria-label={label} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
