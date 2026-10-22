// Today's date in a time zone, as printed on the masthead ("Thursday, October 22, 2026") and as YYYY-MM-DD.
export function today(timeZone?: string) {
  const now = new Date();
  return {
    date: now.toLocaleDateString("en-US", { timeZone, weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    day: now.toLocaleDateString("en-CA", { timeZone }), // en-CA formats as YYYY-MM-DD
  };
}
