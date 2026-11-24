# Making the clips in Google Flow

Four clips, one per short. Each `.txt` file here is the whole prompt for one clip.

| Shot | Prompt file | Start frame | Model | Credits | Status |
|---|---|---|---|---|---|
| 1.1 Meet Nora | `1.1-meet-nora.txt` | `assets/references/Gemini_Generated_Image_Nora_Short1.jpg` | Omni 1.2 Flash, 8 s | 24 | Done |
| 2.1 Counting flour | `2.1-counting-flour.txt` | `assets/references/Gemini_Generated_Image_Short2.jpg` | Omni 1.2 Flash, 8 s | 24 | Done (used to 4.5 s; it jumps after 4.6 s) |
| 3.1 The icing | `3.1-the-icing.txt` | `assets/references/Gemini_Generated_Image_Short3.jpg` | Omni 1.2 Flash, 8 s | 24 | Done |
| 4.8 Back to baking | `4.8-back-to-baking.txt` | `assets/references/Gemini_Generated_Image_Short4.jpg` | Omni 1.2 Flash, 8 s | 24 | Done (has a cut at 3.3 s; kept) |

All four were made through Flow's agent chat, each first time, for 96 credits in all. The finished clips are in `tutorial/assets/veo_creations/` as `1.1.mp4`, `2.1.mp4`, `3.1.mp4` and `4.8.mp4`.

What we changed from the files when sending them: we dropped "Choppy stop-motion movement at about 12 frames per second" (Omni's smooth movement looks better with the paper style), and for 1.1 we added "her eyebrows sink and her shoulders drop, tired and a little overwhelmed, not smiling".

The steps below are how to remake a clip by hand.

## Before you start

The four start frames are final and checked (in `tutorial/assets/references/`, as in the table): the writing is gone from 1.1's invoice, and 4.8's laptop screen is teal. In 4.8 the lid is still fully open with Nora's hand raised above it, so its prompt has her hand come down and close the lid.

Every prompt's timeline is written for an **8-second clip**. Omni 1.2 Flash charges by the second (3 credits a second, so 24 for 8 s). Veo 3.1 Fast and Quality leave Flow on December 5, 2026.

We keep the smooth movement; the paper look carries the style.

## In Flow, for each clip

1. Open [Flow](https://labs.google/fx/tools/flow) and use the same project as 1.1, so the clips stay together.
2. In the settings next to the prompt box:
   - **Aspect ratio:** portrait, 9:16.
   - **Outputs per prompt:** 1 (each extra output costs the same again).
   - **Model:** Omni 1.2 Flash.
   - **Length:** 8 seconds.
3. Choose **Frames to Video** and upload the shot's start frame as the **first frame**. Leave the last frame empty.
4. Paste the whole prompt from the shot's `.txt` file and generate.
5. Download the result as MP4 at the highest resolution offered (upscaling to 1080p is worth it only if it doesn't cost credits) into `tutorial/assets/veo_creations/`, named by shot (for example `2.1.mp4`).

## What to check in each clip

- **Still paper.** No shiny 3D look. Edges look cut, light looks flat.
- **Nora still matches** the character sheet: teal bandana, curly black hair, yellow apron, striped shirt, split pins.
- **No text appears** anywhere: invoices, laptop screen, the door sign.
- **Her mouth doesn't move as if talking.** We add her voice ourselves.
- **The action happens:** the taps and slump (2.1), the icing coil (3.1), the laptop closing and the walk to the door (4.8).

## If something goes wrong

Change the prompt only as much as needed, and regenerate once:

- **Looks 3D or plastic:** add at the start of the Action paragraph: "Everything stays flat cut paper, like real paper animation filmed on a tabletop."
- **Nora changes or gets a new outfit:** add: "The woman keeps exactly the same face, hair, bandana and clothes as in the starting image throughout."
- **Text shows up:** add: "Every surface stays blank; there is no writing of any kind."
- **Too much happens, or the action is muddled:** cut the Action paragraph down to its first two sentences and generate again.
- **3.1 — the icing doesn't pile up:** replace the last sentence of the Action with: "The pink paper ribbon keeps pouring out of the bag in loops, piling into a tall, wobbly coil."
- **4.8 — she doesn't reach the door in 8 seconds:** delete the first two sentences of the Action and change the Timing to "0–5 s, she walks to the door and flips the sign as the bell swings; 5–8 s, she turns her head back to us and smiles, and holds." Her raised hand then reads as her stepping away from the laptop.

Note what you changed in the prompt file, so the final prompts match the clips.
