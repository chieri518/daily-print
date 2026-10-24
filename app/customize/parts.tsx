"use client";

// Small pieces of the Customize page.
import { useEffect } from "react";
import { area, LAYOUTS, type Feature } from "@/lib/settings";

// A small centered dialog. Clicking outside it or pressing Escape closes it.
export function Dialog({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
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

// A tiny drawing of a page layout's slots.
export function LayoutIcon({ layout }: { layout: keyof typeof LAYOUTS }) {
  return (
    <span className="layout-icon" style={{ gridTemplate: LAYOUTS[layout].grid }} aria-hidden>
      {LAYOUTS[layout].slots.map((_, j) => (
        <span key={j} style={{ gridArea: area(j) }} />
      ))}
    </span>
  );
}

// A sketch of how the weather or a puzzle looks in print, shown in its slot.
const CROSSWORD = "0010000100000001010000100"; // 1 = black square

export function FeaturePreview({ kind }: { kind: Feature }) {
  switch (kind) {
    case "weather":
      return (
        <span className="mini-weather">
          {["☀", "☁", "☂", "☁", "☀"].map((icon, i) => (
            <span key={i}>{icon}</span>
          ))}
        </span>
      );
    case "sudoku":
      return <span className="mini-sudoku" />;
    case "crossword":
      return (
        <span className="mini-crossword">
          {[...CROSSWORD].map((c, i) => (
            <span key={i} className={c === "1" ? "black" : ""} />
          ))}
        </span>
      );
    case "wordSearch":
      return <span className="mini-letters">QWHARVESTZBALLOTKMNTRAINOPLUSDXFOGEYRV</span>;
    case "jumble":
      return (
        <span className="mini-jumble">
          {["TEALBL", "VASHRE", "NIRTA"].map((w) => (
            <span key={w}>{w}</span>
          ))}
        </span>
      );
    case "wordOfTheDay":
      return (
        <span className="mini-word">
          <b>serendipity</b> <i>noun</i>
        </span>
      );
    case "trivia":
      return (
        <span className="mini-quiz">
          {[1, 2, 3, 4].map((n) => (
            <span key={n}>{n}.</span>
          ))}
        </span>
      );
  }
}
