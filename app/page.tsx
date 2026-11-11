import { FollowButton, GenerateButton, PageTurner, RefreshWhileWriting } from "./client";
import { Landing } from "./landing";
import { canGenerate } from "@/lib/allowed";
import { followedHeadline, type Paper as Edition } from "@/lib/editor";
import { Newspaper, type Follow, type Layout } from "@/lib/paper";
import { css } from "@/lib/paper-css";
import { fontsUrl, hasDesk, isDesk, TYPEFACES } from "@/lib/settings";
import { getReader, loadSettings } from "@/lib/supabase/server";

// The reader's latest paper, drawn by the same components as its PDF, page for page. Signed out, the landing page.
export default async function Paper() {
  const reader = await getReader();
  if (!reader) return <Landing />;

  const { data: editions, error } = await reader.supabase
    .from("editions")
    .select("id, status, content, layout")
    .in("status", ["ready", "writing"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  const latest = editions.find((e) => e.status === "ready");
  const writing = editions.some((e) => e.status === "writing") && (
    <>
      <p className="muted">A new paper is being written. It appears here when it's ready.</p>
      <RefreshWhileWriting />
    </>
  );

  if (!latest)
    return (
      <>
        <h1>Your paper</h1>
        {writing || <p className="muted">No paper yet.</p>}
        {!writing && canGenerate(reader.email) && <GenerateButton />}
      </>
    );

  const pdf = `/editions/${latest.id}`;
  const layout = latest.layout as Layout | null;
  if (!layout)
    return (
      <>
        {writing}
        <p className="muted">
          This paper was made before the web view. <a href={pdf}>Read the PDF</a>, or generate a new paper on the
          Editions page.
        </p>
      </>
    );

  // The pictures are in storage; links to them last an hour.
  const sign = async (path: string | null) =>
    path && (await reader.supabase.storage.from("editions").createSignedUrl(path, 3600)).data?.signedUrl;
  const pictures = {
    illustration: (await sign(layout.pictures.illustration)) ?? null,
    comic: (await sign(layout.pictures.comic)) ?? null,
  };

  // A + next to each story, to follow it into Your Desk. Not on Your Desk's note on how to follow a story.
  const { data: followed, error: followedError } = await reader.supabase.from("followed_stories").select("headline");
  if (followedError) throw followedError;
  const following = new Set(followed.map((f) => f.headline));
  const desk = hasDesk(await loadSettings(reader));
  const follow: Follow = (story, section) =>
    (!isDesk(section) || story.follows) && (
      <FollowButton
        edition={latest.id}
        headline={story.headline}
        following={following.has(followedHeadline(story))}
        desk={desk}
      />
    );
  return (
    <>
      <link rel="stylesheet" href={fontsUrl(TYPEFACES[layout.settings.typeface])} precedence="default" />
      <style href="paper-css" precedence="default">
        {css}
      </style>
      {writing}
      <PageTurner pdf={pdf} pages={layout.settings.pages.length}>
        <Newspaper paper={latest.content as Edition} layout={{ ...layout, pictures }} follow={follow} />
      </PageTurner>
    </>
  );
}
