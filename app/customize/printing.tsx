"use client";

import { useState } from "react";
import { createPrinterKey } from "../actions";

// Automatic printing: when the printer box prints each morning, and the key that links the box to this account.
export function Printing({
  printTime,
  setPrintTime,
  printer,
}: {
  printTime: string;
  setPrintTime: (time: string) => void;
  printer: { lastSeenAt: string | null } | null; // null until a key is made
}) {
  const [key, setKey] = useState<string | null>(null); // shown once, right after it's made

  return (
    <div className="wide printing">
      <b>Printing</b>
      <p className="muted">
        Your printer box prints a fresh paper every morning at this time. Leave it empty for no automatic paper. A paper
        that can&apos;t print within an hour of this time is skipped.
      </p>
      <label className="print-time">
        Print time
        <input type="time" value={printTime} onChange={(e) => setPrintTime(e.target.value)} />
      </label>

      <p>
        <b>Printer box: </b>
        {!printer
          ? "not set up yet."
          : printer.lastSeenAt
          ? `last checked in ${new Date(printer.lastSeenAt).toLocaleString()}.`
          : "waiting for it to check in."}
      </p>
      {key ? (
        <div className="printer-key">
          <p>On your Raspberry Pi, run this once. It sets the box up with your new key, which is shown only now:</p>
          <code>
            curl -fsSL {location.origin}/printer/install.sh | sudo bash -s -- {location.origin} {key}
          </code>
        </div>
      ) : (
        <button
          type="button"
          className="link"
          onClick={async () => {
            if (!printer || confirm("A new key replaces the old one: the box will need to be set up again.")) {
              setKey(await createPrinterKey());
            }
          }}
        >
          {printer ? "Make a new printer key" : "Set up a printer box"}
        </button>
      )}
    </div>
  );
}
