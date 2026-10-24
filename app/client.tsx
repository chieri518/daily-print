"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
