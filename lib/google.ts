// Today's birthdays from the reader's Google Calendar. Readers connect it once from the Customize page, and we keep
// Google's refresh token so each morning's edition can read the day's birthdays on its own.
// Uses the same Google OAuth client as sign-in (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET).

const SCOPE = "https://www.googleapis.com/auth/calendar.events.readonly";

// Where to send the reader to allow access. `state` is checked when Google sends them back.
export function connectUrl(redirectUri: string, state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline", // gives a refresh token, for reading birthdays while the reader is away
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// Calls Google's token endpoint, for a new connection or for a fresh access token.
async function token(params: Record<string, string>) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      ...params,
    }),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error_description ?? json.error);
  return json;
}

// Turns the code Google sends back into a refresh token.
export async function connect(code: string, redirectUri: string): Promise<string> {
  const { refresh_token } = await token({ code, redirect_uri: redirectUri, grant_type: "authorization_code" });
  return refresh_token;
}

export async function disconnect(refreshToken: string) {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${refreshToken}`, { method: "POST" });
}

// The names of people whose birthday is on `day` (YYYY-MM-DD), from the birthdays Google keeps for your contacts.
export async function birthdays(refreshToken: string, day: string): Promise<string[]> {
  const { access_token } = await token({ refresh_token: refreshToken, grant_type: "refresh_token" });
  // Birthdays are all-day events, so ask for a few days around `day` and keep the ones dated that day.
  const around = (days: number) => new Date(Date.parse(`${day}T00:00:00Z`) + days * 86400000).toISOString();
  const params = new URLSearchParams({
    eventTypes: "birthday",
    singleEvents: "true",
    timeMin: around(-1),
    timeMax: around(2),
  });
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error?.message ?? response.statusText);
  return (json.items as { summary: string; start: { date?: string }; birthdayProperties?: { type: string } }[])
    .filter((e) => e.start.date === day && e.birthdayProperties?.type === "birthday")
    .map((e) => e.summary.replace(/['’]s birthday$/i, ""));
}
