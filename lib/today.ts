// The date at a moment (now by default) in a time zone: as printed on the masthead ("Thursday, October 22, 2026"),
// and as YYYY-MM-DD.
export function today(timeZone?: string, at = new Date()) {
  return {
    date: at.toLocaleDateString("en-US", { timeZone, weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    day: at.toLocaleDateString("en-CA", { timeZone }), // en-CA formats as YYYY-MM-DD
  };
}
