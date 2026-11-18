import Link from "next/link";
import { redirect } from "next/navigation";
import { GenerateButton, RefreshWhileWriting } from "../client";
import { stopEdition } from "../actions";
import { canGenerate } from "@/lib/allowed";
import { PRINT_WINDOW_MS } from "@/lib/printer";
import { getReader, loadSettings } from "@/lib/supabase/server";
import { fullDate } from "@/lib/today";

export default async function Editions() {
  const reader = await getReader();
  if (!reader) redirect("/");

  const { data: editions, error } = await reader.supabase
    .from("editions")
    .select("id, day, status, stage, error, print_at, printed_at, print_error")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const writing = editions.some((e) => e.status === "writing");
  const { timeZone } = await loadSettings(reader);
  const time = (at: string) => new Date(at).toLocaleTimeString("en-US", { timeZone, timeStyle: "short" });
  const stop = (id: string, label: string) => (
    <form action={stopEdition.bind(null, id)} className="inline">
      <button className="link">{label}</button>
    </form>
  );

  // What happened to a paper made for the printer box.
  const printStatus = (e: NonNullable<typeof editions>[number]) => {
    if (!e.print_at) return null;
    if (e.printed_at) return `Printed at ${time(e.printed_at)}`;
    if (e.print_error) return `Not printed: ${e.print_error}`;
    if (Date.parse(e.print_at) + PRINT_WINDOW_MS < Date.now()) return "Not printed (the printer box didn't take it)";
    return `Prints at ${time(e.print_at)}`;
  };

  return (
    <>
      <h1>Editions</h1>
      {!canGenerate(reader.email) ? (
        <p className="muted">
          Generating editions is limited to invited readers for now. See <Link href="/">sample papers</Link>.
        </p>
      ) : (
        !writing && <GenerateButton /> // one paper at a time
      )}
      <ul className="editions">
        {editions?.map((e) => (
          <li key={e.id}>
            {e.status === "ready" ? (
              <Link href={`/?edition=${e.id}`}>{fullDate(e.day)}</Link>
            ) : (
              <span>{fullDate(e.day)}</span>
            )}
            <span className="muted">
              {e.status === "scheduled" && (
                <>
                  Scheduled: written before {time(e.print_at!)} {stop(e.id, "Cancel")}
                </>
              )}
              {e.status === "writing" && <>{e.stage ?? "Starting"}… (a few minutes) {stop(e.id, "Stop")}</>}
              {e.status === "ready" && (
                <>
                  {printStatus(e)}{" "}
                  <a href={`/editions/${e.id}`} target="_blank">
                    PDF
                  </a>
                </>
              )}
              {e.status === "failed" && `Didn’t finish. ${e.error ?? "Please try again."}`}
              {e.status === "stopped" && "Stopped"}
            </span>
          </li>
        ))}
      </ul>
      {editions?.length === 0 && <p className="muted">No editions yet.</p>}
      {writing && <RefreshWhileWriting />}
    </>
  );
}
