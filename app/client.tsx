"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { generate } from "./actions";

// Sends the browser's time zone so "today" means the reader's today.
export function GenerateButton() {
  return (
    <form
      action={(form) => {
        form.set("timeZone", Intl.DateTimeFormat().resolvedOptions().timeZone);
        return generate(form);
      }}
    >
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="button" disabled={pending}>
      {pending ? "Starting…" : "Generate today's paper"}
    </button>
  );
}

// Reloads the archive every 15 seconds until no edition is still being written.
export function RefreshWhileWriting() {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 15_000);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}

// The Paper page's pages, side by side: the arrows, or the ← and → keys, turn to the previous or next page.
// The bar with the arrows stays at the top of the window while the reader scrolls down a page.
export function PageTurner({ pdf, pages: count, children }: { pdf: string; pages: number; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const [page, setPage] = useState(0);

  // The strip of pages, how far each page is from its middle, and the page nearest the middle.
  const view = () => {
    const strip = root.current!.querySelector<HTMLElement>(".paper")!;
    const pages = [...strip.querySelectorAll<HTMLElement>(".page")];
    const middle = (r: DOMRect) => r.left + r.width / 2;
    const offset = (p: HTMLElement) => middle(p.getBoundingClientRect()) - middle(strip.getBoundingClientRect());
    const current = pages.reduce((best, p, i) => (Math.abs(offset(p)) < Math.abs(offset(pages[best])) ? i : best), 0);
    return { strip, pages, offset, current };
  };

  const turn = (step: number) => {
    const { strip, pages, offset, current } = view();
    const next = pages[current + step];
    if (!next) return;
    strip.scrollBy({ left: offset(next), behavior: "smooth" });
    // Back to the top of the page, if the reader had scrolled down.
    const top = strip.getBoundingClientRect().top - bar.current!.offsetHeight;
    if (top < 0) window.scrollBy({ top, behavior: "smooth" });
  };

  useEffect(() => {
    const { strip } = view();
    const onScroll = () => setPage(view().current);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") turn(e.key === "ArrowLeft" ? -1 : 1);
    };
    strip.addEventListener("scroll", onScroll, { passive: true });
    addEventListener("keydown", onKey);
    return () => {
      strip.removeEventListener("scroll", onScroll);
      removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={root}>
      <nav className="paper-bar" ref={bar}>
        <button className="link" onClick={() => turn(-1)} disabled={page === 0} aria-label="Previous page">
          ‹
        </button>
        <span>
          Page {page + 1} of {count}
        </span>
        <button className="link" onClick={() => turn(1)} disabled={page === count - 1} aria-label="Next page">
          ›
        </button>
        <a href={pdf} target="_blank">
          PDF
        </a>
      </nav>
      {children}
      <Definition />
    </div>
  );
}

// A hard term's definition, shown while the reader hovers over the term or taps it (terms are marked in lib/paper.tsx).
// It's drawn outside the pages, since they cut off anything that sticks out of a section.
function Definition() {
  const [tip, setTip] = useState<{ text: string; left: number; top: number } | null>(null);
  useEffect(() => {
    const show = (e: Event) => {
      const term = (e.target as Element).closest<HTMLElement>(".term");
      if (!term) return;
      const r = term.getBoundingClientRect();
      setTip({ text: term.dataset.definition!, left: Math.min(r.left, innerWidth - 300), top: r.bottom });
    };
    const hide = () => setTip(null);
    const events = { mouseover: show, focusin: show, mouseout: hide, focusout: hide, scroll: hide };
    for (const [name, handler] of Object.entries(events)) addEventListener(name, handler, true);
    return () => {
      for (const [name, handler] of Object.entries(events)) removeEventListener(name, handler, true);
    };
  }, []);
  return tip && <div className="definition" style={{ left: Math.max(tip.left, 8), top: tip.top }}>{tip.text}</div>;
}

// The landing page's masthead: cycles through example paper names, unless the reader prefers less motion.
const NAMES = ["The Morning Edition", "The Breakfast Gazette", "The Kitchen Table Times", "The Sunday Fog"];

export function CyclingName() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % NAMES.length), 3000);
    return () => clearInterval(timer);
  }, []);
  return <span key={index}>{NAMES[index]}</span>;
}
