"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { disconnectGoogle, saveSettings } from "../actions";
import { PageBuilder } from "./page-builder";
import { Printing } from "./printing";
import {
  DEFAULT_CAST,
  fontsUrl,
  PAPER_SIZES,
  READING_LEVELS,
  TEMPERATURES,
  TONES,
  TYPEFACES,
  type Draft,
  type Settings,
} from "@/lib/settings";

const TABS = ["Pages", "Paper & style", "Writing & sources"];

const lines = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export function Customizer({
  initial,
  googleConnected,
  printer,
}: {
  initial: Settings;
  googleConnected: boolean;
  printer: { lastSeenAt: string | null } | null;
}) {
  const router = useRouter();
  const [settings, setSettings] = useState(initial);
  const [pages, setPages] = useState<Draft[]>(initial.pages);
  const [trusted, setTrusted] = useState(initial.trustedSources.join("\n"));
  const [blocked, setBlocked] = useState(initial.blockedSources.join("\n"));
  const [tab, setTab] = useState(TABS[0]);

  const set = (change: Partial<Settings>) => setSettings({ ...settings, ...change });
  const json = JSON.stringify({ ...settings, pages, trustedSources: lines(trusted), blockedSources: lines(blocked) });
  const [savedJson, setSavedJson] = useState(json); // what was last saved, to tell if there are unsaved changes
  const [savedOnce, setSavedOnce] = useState(false);
  const unsaved = json !== savedJson;

  // Why the paper can't be saved yet, if anything is missing.
  const problem = !pages.every((p) => p.stacks.every((s) => s.length) && (!p.band || p.band.item))
    ? "Every column and band needs a section."
    : !settings.name.trim()
    ? "Add a paper name in Paper & style."
    : !settings.location.trim()
    ? "Add a location in Paper & style."
    : !settings.comicCast.trim()
    ? "Describe your comic cast in Paper & style."
    : null;

  // Warn before closing or reloading the page with unsaved changes.
  useEffect(() => {
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  const save = async () => {
    // Save the browser's time zone too, so the print time means the reader's morning.
    await saveSettings(
      JSON.stringify({ ...JSON.parse(json), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
    );
    setSavedJson(json);
    setSavedOnce(true);
  };

  return (
    <form action={save} className="customize">
      {/* All typefaces, so their cards can show them */}
      {Object.values(TYPEFACES).map((t) => (
        <link key={t.label} rel="stylesheet" href={fontsUrl(t)} precedence="default" />
      ))}

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div hidden={tab !== "Pages"}>
        <PageBuilder settings={settings} set={set} pages={pages} setPages={setPages} />
      </div>

      <div className="fields" hidden={tab !== "Paper & style"}>
        <label>
          Paper name
          <input value={settings.name} onChange={(e) => set({ name: e.target.value })} maxLength={60} />
        </label>
        <label>
          <span>
            Location <span className="muted">(for local news and the weather)</span>
          </span>
          <input value={settings.location} onChange={(e) => set({ location: e.target.value })} maxLength={100} />
        </label>
        <label>
          Paper size
          <select
            value={settings.paperSize}
            onChange={(e) => set({ paperSize: e.target.value as Settings["paperSize"] })}
          >
            <Options options={PAPER_SIZES} />
          </select>
        </label>
        <label>
          Temperature
          <select
            value={settings.temperature}
            onChange={(e) => set({ temperature: e.target.value as Settings["temperature"] })}
          >
            <Options options={TEMPERATURES} />
          </select>
        </label>
        <fieldset className="typefaces wide">
          <legend>Typeface</legend>
          {Object.entries(TYPEFACES).map(([key, t]) => (
            <label key={key} className="typeface">
              <input
                type="radio"
                name="typeface"
                checked={settings.typeface === key}
                onChange={() => set({ typeface: key as Settings["typeface"] })}
              />
              <span className="typeface-masthead" style={{ fontFamily: t.masthead }}>
                {settings.name || "Your paper"}
              </span>
              <span className="typeface-headline" style={{ fontFamily: t.headline }}>
                City opens new park by the bay
              </span>
              <span style={{ fontFamily: t.body }}>Story text looks like this, in columns across the page.</span>
              <span className="muted">{t.label}</span>
            </label>
          ))}
        </fieldset>
        <label className="wide">
          <span>
            Comic strip cast <span className="muted">(who stars in your Comic Strip section, every day)</span>
          </span>
          <input
            value={settings.comicCast}
            onChange={(e) => set({ comicCast: e.target.value })}
            placeholder={DEFAULT_CAST}
            maxLength={200}
          />
        </label>
        <div className="wide">
          <b>Birthdays</b>
          <p className="muted">
            On days when someone in your Google Contacts has a birthday, the front page lists them: “Birthdays today:
            Alex Kim, Sam Ortiz”.
          </p>
          {googleConnected ? (
            <p>
              Google Calendar is connected.{" "}
              <button
                type="button"
                className="link"
                onClick={async () => {
                  await disconnectGoogle();
                  router.refresh();
                }}
              >
                Disconnect
              </button>
            </p>
          ) : (
            <a className="button" href="/api/google/connect">
              Connect Google Calendar
            </a>
          )}
        </div>
        <Printing printTime={settings.printTime} setPrintTime={(printTime) => set({ printTime })} printer={printer} />
      </div>

      <div className="fields" hidden={tab !== "Writing & sources"}>
        <label>
          Tone
          <select value={settings.tone} onChange={(e) => set({ tone: e.target.value as Settings["tone"] })}>
            <Options options={TONES} />
          </select>
        </label>
        <label>
          Reading level
          <select
            value={settings.readingLevel}
            onChange={(e) => set({ readingLevel: e.target.value as Settings["readingLevel"] })}
          >
            <Options options={READING_LEVELS} />
          </select>
        </label>
        <label className="wide">
          <span>
            Brief to the editor <span className="muted">(optional)</span>
          </span>
          <textarea
            value={settings.brief}
            onChange={(e) => set({ brief: e.target.value })}
            rows={4}
            maxLength={2000}
            placeholder="Anything the editor should know: what you care about, what to skip, how you like stories told."
          />
        </label>
        <label>
          <span>
            Sources to trust <span className="muted">(optional, one per line)</span>
          </span>
          <textarea value={trusted} onChange={(e) => setTrusted(e.target.value)} rows={3} />
        </label>
        <label>
          <span>
            Sources to never use <span className="muted">(optional, one per line)</span>
          </span>
          <textarea value={blocked} onChange={(e) => setBlocked(e.target.value)} rows={3} />
        </label>
      </div>

      <SaveBar problem={problem} unsaved={unsaved} savedOnce={savedOnce} />
    </form>
  );
}

// Stays at the bottom of the screen, so Save and whether it worked are always in view.
function SaveBar({ problem, unsaved, savedOnce }: { problem: string | null; unsaved: boolean; savedOnce: boolean }) {
  const { pending } = useFormStatus();
  const status = pending
    ? "Saving…"
    : problem ??
      (unsaved ? "You have unsaved changes." : savedOnce ? "Saved. Your next edition will use this paper." : "");
  return (
    <div className="save-bar">
      <button className="button" disabled={pending || !!problem || !unsaved}>
        Save
      </button>
      <span className="muted" role="status">
        {status}
      </span>
    </div>
  );
}

function Options({ options }: { options: Record<string, string | { label: string }> }) {
  return Object.entries(options).map(([value, option]) => (
    <option key={value} value={value}>
      {typeof option === "string" ? option : option.label}
    </option>
  ));
}
