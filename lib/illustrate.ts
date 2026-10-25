// Draws the front-page illustration and the comic strip with an image model. Uses OpenAI or Google, whichever has a key in
// the environment (IMAGE_PROVIDER=openai or google picks one when both do). IMAGE_MODEL overrides the default model.
// The illustration prints 3:1 (OpenAI draws it that shape; Google's widest is 21:9, trimmed slightly to fit). The comic
// is a 3:1 strip in a wide space, or four panels stacked 1:2 in a column.
// They return null without a key or if drawing fails, so the paper still prints.

import type { Edition } from "./editor.ts";
import { illustrated, pageItems, STRIP_WIDTH, type Settings } from "./settings.ts";
import { measure } from "./space.ts";

// Draws the pictures this paper needs, at the same time: the illustration if the editor chose a story for it,
// and the comic if the paper has a Comic Strip section.
export async function drawPictures(settings: Settings, edition: Edition) {
  const width = comicWidth(settings);
  const [illustration, comic] = await Promise.all([
    edition.illustration.scene && illustrated(settings) ? illustrate(edition.illustration.scene) : null,
    width ? drawComic(settings.comicCast, edition.comic.panels, width > STRIP_WIDTH) : null,
  ]);
  return { illustration, comic };
}

// How wide the comic prints, in inches, or 0 if the paper has none.
function comicWidth(settings: Settings) {
  for (const [i, page] of settings.pages.entries()) {
    const j = pageItems(page).findIndex((item) => item.section.kind === "comic");
    if (j >= 0) return measure(page, i === 0, settings.paperSize)[j].width;
  }
  return 0;
}

// The illustration's house style, the same every day.
const STYLE =
  "Black-and-white pen-and-ink newspaper illustration with fine cross-hatching, on a plain white background. " +
  "Wide, panoramic composition with the subject in the middle. No color, no gray wash, no text or lettering.";

function illustrate(scene: string) {
  return draw(`${STYLE}\n\nScene: ${scene}`, "wide");
}

// Four panels in one row, or stacked in one column. The cast is described the same way every day, so it looks alike
// from day to day.
function drawComic(cast: string, panels: Edition["comic"]["panels"], strip: boolean) {
  const described = panels.map(
    (p, i) =>
      `Panel ${i + 1}: ${p.scene}${
        p.dialogue ? ` Speech bubble from ${p.speaker || "a character"}: "${p.dialogue}"` : ""
      }`,
  );
  return draw(
    `A cute, funny four-panel newspaper comic: four equal panels ${
      strip ? "side by side in one row" : "stacked top to bottom in one column"
    }, with black borders. ` +
      `Black-and-white ink drawing with clean lines and simple shading, on white. No color. ` +
      `Characters: ${cast}. Draw them exactly the same in every panel. ` +
      `Speech bubbles hold only the exact words given, in clear capital letters. No other text, titles or signatures.\n\n` +
      described.join("\n"),
    strip ? "wide" : "tall",
  );
}

// "wide" is 3:1, "tall" is 1:2.
async function draw(prompt: string, shape: "wide" | "tall"): Promise<string | null> {
  const provider =
    process.env.IMAGE_PROVIDER || (process.env.OPENAI_API_KEY ? "openai" : process.env.GEMINI_API_KEY && "google");
  try {
    if (provider === "openai") return await openai(prompt, shape);
    if (provider === "google") return await google(prompt, shape);
  } catch (error) {
    console.warn(`A picture couldn't be drawn: ${error}`);
  }
  return null;
}

// Returns the image as a data URL, ready for an <img>.
async function openai(prompt: string, shape: "wide" | "tall") {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.IMAGE_MODEL || "gpt-image-2",
      prompt,
      size: shape === "wide" ? "1536x512" : "768x1536",
      quality: "medium",
      output_format: "jpeg",
    }),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error?.message ?? response.statusText);
  return `data:image/jpeg;base64,${json.data[0].b64_json}`;
}

async function google(prompt: string, shape: "wide" | "tall") {
  const model = process.env.IMAGE_MODEL || "gemini-3.1-flash-image";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: shape === "wide" ? "21:9" : "9:16" },
      },
    }),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error?.message ?? response.statusText);
  const image = json.candidates[0].content.parts.find((p: { inlineData?: unknown }) => p.inlineData).inlineData;
  return `data:${image.mimeType};base64,${image.data}`;
}
