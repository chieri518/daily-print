// Each edition costs real money (Claude and pictures), so only emails in ALLOWED_EMAILS get editions:
// by pressing Generate, or every morning for the printer box. Anyone else can sign in and customize, but not more.
export function canGenerate(email: string | undefined) {
  const allowed = (process.env.ALLOWED_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  return !!email && allowed.includes(email.toLowerCase());
}
