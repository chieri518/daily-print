"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <h1>Something went wrong</h1>
      <p className="muted">{error.message}</p>
      <button className="button" onClick={reset}>Try again</button>
    </>
  );
}
