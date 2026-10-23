"use client";

import { useEffect, useState } from "react";
import { saveSettings } from "../actions";
import { PageBuilder, type Draft } from "./page-builder";
import { fontsUrl, PAPER_SIZES, READING_LEVELS, TONES, TYPEFACES, type Settings } from "@/lib/settings";

const lines = (text: string) => text.split("\n").map((line) => line.trim()).filter(Boolean);

export function Customizer({ initial }: { initial: Settings }) {
  const [settings, setSettings] = useState(initial);
  const [pages, setPages] = useState<Draft[]>(initial.pages);
  const [trusted, setTrusted] = useState(initial.trustedSources.join("\n"));
  const [blocked, setBlocked] = useState(initial.blockedSources.join("\n"));

  const set = (change: Partial<Settings>) => setSettings({ ...settings, ...change });
  const saved = JSON.stringify({ ...settings, pages, trustedSources: lines(trusted), blockedSources: lines(blocked) });
  const [initialSaved] = useState(saved);
  const unsaved = saved !== initialSaved;
  const complete = pages.every((p) => p.slots.every(Boolean));

  // Warn before closing or reloading the page with unsaved changes.
  useEffect(() => {
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  return (
    <form action={saveSettings} className="customize">
      <link rel="stylesheet" href={fontsUrl(TYPEFACES[settings.typeface])} precedence="default" />
      <input type="hidden" name="settings" value={saved} />

      <PageBuilder settings={settings} set={set} pages={pages} setPages={setPages} />

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
          Trust these, one per line (optional)
          <textarea value={trusted} onChange={(e) => setTrusted(e.target.value)} rows={3} />
        </label>
        <label>
          Never use these, one per line (optional)
          <textarea value={blocked} onChange={(e) => setBlocked(e.target.value)} rows={3} />
        </label>
      </fieldset>

      <label>
        Brief to the editor (optional)
        <textarea
          value={settings.brief}
          onChange={(e) => set({ brief: e.target.value })}
          rows={5}
          maxLength={2000}
          placeholder="Anything the editor should know: what you care about, what to skip, how you like stories told."
        />
      </label>

      <div className="save-bar">
        <button className="button" disabled={!complete || !unsaved}>
          Save
        </button>
        {!complete ? (
          <span className="muted">Fill the dashed slots to save.</span>
        ) : (
          unsaved && <span className="muted">You have unsaved changes.</span>
        )}
      </div>
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
