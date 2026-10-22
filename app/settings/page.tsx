import { redirect } from "next/navigation";
import { saveSettings } from "../actions";
import { getReader, loadSettings } from "@/lib/supabase/server";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const reader = await getReader();
  if (!reader) redirect("/");
  const settings = await loadSettings(reader);
  const { saved } = await searchParams;

  return (
    <>
      <h1>Settings</h1>
      {saved && <p className="muted">Saved. Your next edition will use these settings.</p>}
      <form action={saveSettings} className="settings">
        <label>
          Paper name
          <input name="name" defaultValue={settings.name} required maxLength={60} />
        </label>
        <label>
          Typeface
          <select name="typeface" defaultValue={settings.typeface}>
            <option value="classic">Classic (blackletter name, Playfair Display)</option>
            <option value="caslon">Caslon</option>
            <option value="bodoni">Bodoni</option>
          </select>
        </label>
        <label>
          Location
          <input name="location" defaultValue={settings.location} required maxLength={100} />
        </label>
        {settings.sections.map((section, i) => (
          <fieldset key={i}>
            <legend>Page {i + 2}</legend>
            <label>
              Section title
              <input name={`title${i}`} defaultValue={section.title} required maxLength={40} />
            </label>
            <label>
              What it covers
              <input name={`about${i}`} defaultValue={section.about} required maxLength={200} />
            </label>
          </fieldset>
        ))}
        <p className="muted">Page 1 is the front page and page 4 is Opinion & Features. Both are chosen by the editor.</p>
        <button className="button">Save</button>
      </form>
    </>
  );
}
