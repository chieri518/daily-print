import { GenerateButton, RefreshWhileWriting } from "./client";
import { Landing } from "./landing";
import { canGenerate, getReader } from "@/lib/supabase/server";

export default async function Home() {
  const reader = await getReader();
  if (!reader) return <Landing />;

  const { data: editions } = await reader.supabase
    .from("editions")
    .select("id, day, status, cost_usd")
    .order("created_at", { ascending: false });

  return (
    <>
      <h1>Editions</h1>
      {canGenerate(reader) ? (
        <GenerateButton />
      ) : (
        <p className="muted">Generating editions is limited to invited readers for now.</p>
      )}
      <ul className="editions">
        {editions?.map((e) => (
          <li key={e.id}>
            <span>{new Date(`${e.day}T12:00`).toLocaleDateString("en-US", { dateStyle: "full" })}</span>
            {e.status === "ready" && <a href={`/editions/${e.id}`} target="_blank">Read PDF</a>}
            {e.status === "writing" && <span className="muted">Writing… (a few minutes)</span>}
            {e.status === "failed" && <span className="muted">Failed</span>}
          </li>
        ))}
      </ul>
      {editions?.length === 0 && <p className="muted">No editions yet.</p>}
      {editions?.some((e) => e.status === "writing") && <RefreshWhileWriting />}
    </>
  );
}
