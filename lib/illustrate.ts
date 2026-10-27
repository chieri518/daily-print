// Draws the front-page illustration and the comic strip with an image model. Uses OpenAI or Google, whichever has a key in
// the environment (IMAGE_PROVIDER=openai or google picks one when both do). IMAGE_MODEL overrides the default model.
// The illustration prints 3:1 (OpenAI draws it that shape; Google's widest is 21:9, trimmed slightly to fit). The comic
// takes the shape that suits its spot: a 3:1 strip, four panels stacked 1:2, or 2 × 2 (see comicShape).
// They return null without a key or if drawing fails, so the paper still prints.

import type { Edition } from "./editor.ts";
import { comicShape, type Settings } from "./settings.ts";
import { illustratedSpot, measure } from "./space.ts";

// Draws the pictures this paper needs, at the same time: the illustration if the editor chose a story for it,
// and the comic if the paper has a Comic Strip section.
export async function drawPictures(settings: Settings, edition: Edition) {
  const shape = comicSpot(settings);
  const [illustration, comic] = await Promise.all([
    edition.illustration.scene && illustratedSpot(settings) >= 0 ? illustrate(edition.illustration.scene) : null,
    shape ? drawComic(settings.comicCast, edition.comic.panels, shape) : null,
  ]);
  return { illustration, comic };
}

// The comic's shape in its spot, or null if the paper has no comic.
function comicSpot(settings: Settings) {
  for (const [i, page] of settings.pages.entries()) {
    const j = page.slots.findIndex((s) => s?.kind === "comic");
    if (j >= 0) return comicShape(measure(page, i === 0, settings.paperSize)[j]!);
  }
  return null;
}

// How the panels are arranged, and the picture's shape, for each comic shape.
const PANELS = {
  strip: { layout: "side by side in one row", shape: "wide" },
  tall: { layout: "stacked top to bottom in one column", shape: "tall" },
  square: { layout: "in a 2 × 2 grid", shape: "square" },
} as const;

// The illustration's house style, the same every day.
const STYLE =
  "Black-and-white pen-and-ink newspaper illustration with fine cross-hatching, on a plain white background. " +
  "Wide, panoramic composition with the subject in the middle. No color, no gray wash, no text or lettering.";

function illustrate(scene: string) {
  return draw(`${STYLE}\n\nScene: ${scene}`, "wide");
}

// Four panels, arranged for the comic's spot. The cast is described the same way every day, so it looks alike from day
// to day.
function drawComic(cast: string, panels: Edition["comic"]["panels"], shape: keyof typeof PANELS) {
  const described = panels.map(
    (p, i) =>
      `Panel ${i + 1}: ${p.scene}${
        p.dialogue ? ` Speech bubble from ${p.speaker || "a character"}: "${p.dialogue}"` : ""
      }`,
  );
  return draw(
    `A cute, funny four-panel newspaper comic: four equal panels ${PANELS[shape].layout}, with black borders. ` +
      `Black-and-white ink drawing with clean lines and simple shading, on white. No color. ` +
      `Characters: ${cast}. Draw them exactly the same in every panel. ` +
      `Speech bubbles hold only the exact words given, in clear capital letters. No other text, titles or signatures.\n\n` +
      described.join("\n"),
    PANELS[shape].shape,
  );
}

type Shape = "wide" | "tall" | "square"; // 3:1, 1:2 or 1:1

async function draw(prompt: string, shape: Shape): Promise<string | null> {
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

// OpenAI's sizes for each shape.
const OPENAI_SIZES = { wide: "1536x512", tall: "768x1536", square: "1024x1024" };

// Returns the image as a data URL, ready for an <img>.
async function openai(prompt: string, shape: Shape) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.IMAGE_MODEL || "gpt-image-2",
      prompt,
      size: OPENAI_SIZES[shape],
      quality: "medium",
      output_format: "jpeg",
    }),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error?.message ?? response.statusText);
  return `data:image/jpeg;base64,${json.data[0].b64_json}`;
}

// Google's nearest aspect ratios.
const GOOGLE_RATIOS = { wide: "21:9", tall: "9:16", square: "1:1" };

async function google(prompt: string, shape: Shape) {
  const model = process.env.IMAGE_MODEL || "gemini-3.1-flash-image";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: GOOGLE_RATIOS[shape] },
      },
    }),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error?.message ?? response.statusText);
  const image = json.candidates[0].content.parts.find((p: { inlineData?: unknown }) => p.inlineData).inlineData;
  return `data:${image.mimeType};base64,${image.data}`;
}
