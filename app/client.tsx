"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
