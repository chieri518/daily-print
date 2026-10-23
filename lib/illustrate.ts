// Draws the front-page illustration with an image model. Uses OpenAI or Google, whichever has a key in the environment
// (IMAGE_PROVIDER=openai or google picks one when both do). IMAGE_MODEL overrides the default model.
// Returns null without a key or if drawing fails, so the paper still prints.

// The house style, the same every day.
const STYLE =
  "Black-and-white pen-and-ink newspaper illustration with fine cross-hatching, on a plain white background. " +
  "Wide, panoramic composition with the subject in the middle. No color, no gray wash, no text or lettering.";

export async function illustrate(description: string): Promise<string | null> {
  const prompt = `${STYLE}\n\nScene: ${description}`;
  const provider =
    process.env.IMAGE_PROVIDER ?? (process.env.OPENAI_API_KEY ? "openai" : process.env.GEMINI_API_KEY && "google");
  try {
    if (provider === "openai") return await openai(prompt);
    if (provider === "google") return await google(prompt);
  } catch (error) {
    console.warn(`The illustration couldn't be drawn: ${error}`);
  }
  return null;
}

// Returns the image as a data URL, ready for an <img>.
async function openai(prompt: string) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.IMAGE_MODEL ?? "gpt-image-2",
      prompt,
      size: "1536x1024",
      quality: "medium",
      output_format: "jpeg",
    }),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error?.message ?? response.statusText);
  return `data:image/jpeg;base64,${json.data[0].b64_json}`;
}

async function google(prompt: string) {
  const model = process.env.IMAGE_MODEL ?? "gemini-3.1-flash-image";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "21:9" } },
    }),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error?.message ?? response.statusText);
  const image = json.candidates[0].content.parts.find((p: { inlineData?: unknown }) => p.inlineData).inlineData;
  return `data:${image.mimeType};base64,${image.data}`;
}
