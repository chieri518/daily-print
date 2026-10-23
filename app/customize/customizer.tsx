"use client";

import { useState } from "react";
import { saveSettings } from "../actions";
import {
  fontsUrl,
  LAYOUTS,
  MAX_PAGES,
  PAPER_SIZES,
  PRESET_SECTIONS,
  READING_LEVELS,
  TEMPLATES,
  TONES,
  TYPEFACES,
  type Page,
  type Section,
  type Settings,
} from "@/lib/settings";

// While editing, a slot can be empty. Every slot must be filled before saving.
type Draft = { layout: Page["layout"]; slots: (Section | null)[] };
// What is being dragged: a section from the list, or the section in a slot.
type Dragged = { section: Section; from?: { page: number; slot: number } };

const lines = (text: string) => text.split("\n").map((line) => line.trim()).filter(Boolean);

export function Customizer({ initial }: { initial: Settings }) {
  const [settings, setSettings] = useState(initial);
  const [pages, setPages] = useState<Draft[]>(initial.pages);
  const [trusted, setTrusted] = useState(initial.trustedSources.join("\n"));
  const [blocked, setBlocked] = useState(initial.blockedSources.join("\n"));
  const [dragged, setDragged] = useState<Dragged | null>(null);

  const set = (change: Partial<Settings>) => setSettings({ ...settings, ...change });
  const placed = new Set(pages.flatMap((p) => p.slots.map((s) => s?.title)));
  const available = [...PRESET_SECTIONS, ...settings.customSections].filter((s) => !placed.has(s.title));
  const complete = pages.every((p) => p.slots.every(Boolean));

  const setSlot = (pages: Draft[], page: number, slot: number, section: Section | null) =>
    pages.map((p, i) => (i === page ? { ...p, slots: p.slots.map((s, j) => (j === slot ? section : s)) } : p));

  // Dropping on a slot places the section there. Moving from another slot swaps the two.
  const dropOnSlot = (page: number, slot: number) => {
    if (!dragged) return;
    let next = setSlot(pages, page, slot, dragged.section);
    if (dragged.from) next = setSlot(next, dragged.from.page, dragged.from.slot, pages[page].slots[slot]);
    setPages(next);
  };

  // Dropping a placed section back on the list takes it off the page.
  const dropOnList = () => {
    if (dragged?.from) setPages(setSlot(pages, dragged.from.page, dragged.from.slot, null));
  };

  const setLayout = (page: number, layout: Page["layout"]) => {
    const count = LAYOUTS[layout].slots.length;
    const slots = Array.from({ length: count }, (_, j) => pages[page].slots[j] ?? null);
    setPages(pages.map((p, i) => (i === page ? { layout, slots } : p)));
  };

  const applyTemplate = (key: keyof typeof TEMPLATES) => {
    if (confirm(`Replace your pages with the ${TEMPLATES[key].label} template?`)) setPages(TEMPLATES[key].pages);
  };

  const addSection = () => {
    const title = prompt("Section name (e.g. Gardening)")?.trim();
    if (!title || [...PRESET_SECTIONS, ...settings.customSections].some((s) => s.title === title)) return;
    const about = prompt(`What should "${title}" cover?`)?.trim();
    if (about) set({ customSections: [...settings.customSections, { title, about }] });
  };

  const removeSection = (title: string) => {
    set({ customSections: settings.customSections.filter((s) => s.title !== title) });
    setPages(pages.map((p) => ({ ...p, slots: p.slots.map((s) => (s?.title === title ? null : s)) })));
  };

  const fonts = TYPEFACES[settings.typeface];
  const size = PAPER_SIZES[settings.paperSize];
  const saved = { ...settings, pages, trustedSources: lines(trusted), blockedSources: lines(blocked) };

  return (
    <form action={saveSettings} className="customize">
      <link rel="stylesheet" href={fontsUrl(fonts)} precedence="default" />
      <input type="hidden" name="settings" value={JSON.stringify(saved)} />

      <div className="templates">
        Start from a template:
        {Object.entries(TEMPLATES).map(([key, t]) => (
          <button key={key} type="button" className="link" onClick={() => applyTemplate(key as keyof typeof TEMPLATES)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="workspace">
        <aside className="palette" onDragOver={(e) => e.preventDefault()} onDrop={dropOnList}>
          <strong>Sections</strong>
          <p className="muted">Drag onto a page. Drag back here to remove.</p>
          {available.map((s) => (
            <div key={s.title} className="chip" title={s.about} draggable onDragStart={() => setDragged({ section: s })}>
              {s.title}
              {settings.customSections.includes(s) && (
                <button type="button" className="link" onClick={() => removeSection(s.title)} aria-label={`Delete ${s.title}`}>
                  ×
                </button>
              )}
            </div>
          ))}
          <button type="button" className="link" onClick={addSection}>
            + New section
          </button>
        </aside>

        <div className="sheets">
          {pages.map((page, i) => (
            <div key={i} className="sheet-wrap">
              <div
                className="sheet"
                style={{ aspectRatio: `${parseFloat(size.width)} / ${parseFloat(size.height)}`, fontFamily: fonts.body }}
              >
                {i === 0 && (
                  <div className="sheet-masthead" style={{ fontFamily: fonts.masthead }}>
                    {settings.name}
                  </div>
                )}
                <div className="sheet-slots" style={{ gridTemplate: LAYOUTS[page.layout].grid }}>
                  {page.slots.map((section, j) => (
                    <div
                      key={j}
                      className={`sheet-slot${section ? "" : " empty"}`}
                      style={{ gridArea: "abc"[j] }}
                      draggable={!!section}
                      onDragStart={() => section && setDragged({ section, from: { page: i, slot: j } })}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => dropOnSlot(i, j)}
                    >
                      {section ? (
                        <>
                          <span className="sheet-section">{section.title}</span>
                          <span className="sheet-headline" style={{ fontFamily: fonts.headline }}>
                            {section.about}
                          </span>
                          <span className="sheet-lines" />
                        </>
                      ) : (
                        "Drop a section here"
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="sheet-controls">
                Page {i + 1}
                <select value={page.layout} onChange={(e) => setLayout(i, e.target.value as Page["layout"])}>
                  <Options options={LAYOUTS} />
                </select>
                {i > 0 && (
                  <button type="button" className="link" onClick={() => setPages(pages.filter((_, j) => j !== i))}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          {pages.length < MAX_PAGES && (
            <button type="button" className="add-page" onClick={() => setPages([...pages, { layout: "single", slots: [null] }])}>
              + Add a page
            </button>
          )}
        </div>
      </div>

      <fieldset>
        <legend>Paper</legend>
        <label>
          Paper name
          <input value={settings.name} onChange={(e) => set({ name: e.target.value })} required maxLength={60} />
        </label>
        <label>
          Typeface
          <select value={settings.typeface} onChange={(e) => set({ typeface: e.target.value as Settings["typeface"] })}>
            <Options options={TYPEFACES} />
          </select>
        </label>
        <label>
          Paper size
          <select value={settings.paperSize} onChange={(e) => set({ paperSize: e.target.value as Settings["paperSize"] })}>
            <Options options={PAPER_SIZES} />
          </select>
        </label>
        <label>
          Location
          <input value={settings.location} onChange={(e) => set({ location: e.target.value })} required maxLength={100} />
        </label>
      </fieldset>

      <fieldset>
        <legend>Writing</legend>
        <label>
          Language
          <input value={settings.language} onChange={(e) => set({ language: e.target.value })} required maxLength={40} />
        </label>
        <label>
          Tone
          <select value={settings.tone} onChange={(e) => set({ tone: e.target.value as Settings["tone"] })}>
            <Options options={TONES} />
          </select>
        </label>
        <label>
          Reading level
          <select value={settings.readingLevel} onChange={(e) => set({ readingLevel: e.target.value as Settings["readingLevel"] })}>
            <Options options={READING_LEVELS} />
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>Sources</legend>
        <label>
          Trust these (one per line)
          <textarea value={trusted} onChange={(e) => setTrusted(e.target.value)} rows={3} />
        </label>
        <label>
          Never use these (one per line)
          <textarea value={blocked} onChange={(e) => setBlocked(e.target.value)} rows={3} />
        </label>
      </fieldset>

      <label>
        Brief to the editor
        <textarea
          value={settings.brief}
          onChange={(e) => set({ brief: e.target.value })}
          rows={5}
          maxLength={2000}
          placeholder="Anything the editor should know: what you care about, what to skip, how you like stories told."
        />
      </label>

      <button className="button" disabled={!complete}>
        Save
      </button>
      {!complete && <span className="muted"> Fill every slot to save.</span>}
    </form>
  );
}

function Options({ options }: { options: Record<string, string | { label: string }> }) {
  return Object.entries(options).map(([value, option]) => (
    <option key={value} value={value}>
      {typeof option === "string" ? option : option.label}
    </option>
  ));
}
