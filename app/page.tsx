import { FollowButton, GenerateButton, PageTurner, RefreshWhileWriting } from "./client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Landing } from "./landing";
import { canGenerate } from "@/lib/allowed";
import { followedHeadline, type Paper as Edition } from "@/lib/editor";
import { Newspaper, type Follow, type Layout } from "@/lib/paper";
import { css } from "@/lib/paper-css";
import { fontsUrl, hasDesk, isDesk, knownWordsFor, TYPEFACES } from "@/lib/settings";
import { getReader, loadSettings } from "@/lib/supabase/server";
import { fullDate } from "@/lib/today";

// A reader's paper, drawn by the same components as its PDF, page for page: the latest, or the one chosen on the
// Editions page (?edition=<id>). Signed out, the landing page.
export default async function Paper({ searchParams }: { searchParams: Promise<{ edition?: string }> }) {
  const reader = await getReader();
  if (!reader) return <Landing />;
  const { edition: chosen } = await searchParams;

  const ready = reader.supabase.from("editions").select("id, day, content, layout").eq("status", "ready");
  const { data: shown, error } = await (
    chosen ? ready.eq("id", chosen) : ready.order("created_at", { ascending: false }).limit(1)
  ).maybeSingle();
  if (error) throw error;
  const { data: being, error: beingError } = await reader.supabase
    .from("editions")
    .select("stage")
    .eq("status", "writing")
    .limit(1)
    .maybeSingle();
  if (beingError) throw beingError;
  const writing = being && (
    <>
      <p className="muted">
        A new paper is being written ({being.stage?.toLowerCase() ?? "starting"}). It appears here when it&apos;s ready.
      </p>
      <RefreshWhileWriting />
    </>
  );
  // A paper chosen on the Editions page says which day it's from, with the way back to the latest.
  const older = chosen && shown && (
    <p className="muted">
      The paper for {fullDate(shown.day)}.{" "}
      <Link href="/">Latest paper</Link>
    </p>
  );

  if (chosen && !shown) notFound();
  if (!shown)
    return (
      <>
        <h1>Your paper</h1>
        {writing || <p className="muted">No paper yet.</p>}
        {!writing && canGenerate(reader.email) && <GenerateButton />}
      </>
    );

  const pdf = `/editions/${shown.id}`;
  const layout = shown.layout as Layout | null;
  if (!layout)
    return (
      <>
        {writing}
        {older}
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
  const known = new Set(await knownWordsFor(reader.supabase, reader.id));

  // A + next to each story, to follow it into Your Desk. Not on Your Desk's note on how to follow a story.
  const { data: followed, error: followedError } = await reader.supabase.from("followed_stories").select("headline");
  if (followedError) throw followedError;
  const following = new Set(followed.map((f) => f.headline));
  const desk = hasDesk(await loadSettings(reader));
  const follow: Follow = (story, section) =>
    (!isDesk(section) || story.follows) && (
      <FollowButton
        edition={shown.id}
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
      {older}
      <PageTurner pdf={pdf} pages={layout.settings.pages.length}>
        <Newspaper
          paper={withoutKnown(shown.content as Edition, known)}
          layout={{ ...layout, pictures }}
          follow={follow}
        />
      </PageTurner>
    </>
  );
}

// The paper without the hard terms the reader already knows, so they aren't explained.
function withoutKnown(paper: Edition, known: Set<string>): Edition {
  const pages = paper.pages.map(({ sections }) => ({
    sections: sections.map(({ stories }) => ({
      stories: stories.map((s) => ({ ...s, terms: (s.terms ?? []).filter((t) => !known.has(t.term.toLowerCase())) })),
    })),
  }));
  return { ...paper, pages };
}
