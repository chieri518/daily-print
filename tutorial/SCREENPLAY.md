# Agents, Explained — screenplay for four shorts

A four-part tutorial series that teaches agentic AI to people who don't work in tech. Each short teaches one idea with a running example anyone can follow, then shows how the same idea works in a real agent we built, Daily Print.

- **Format:** 1080 × 1920 (9:16), 30 fps, 55–60 seconds each, burned-in captions.
- **Teaching first.** Every short opens with a question, teaches one idea with a diagram, and ends on a "remember these 3 things" card. Skits are there to make the idea stick, not to sell anything.
- **Split:** shorts 1–3 are about **70% general lesson** (Nora's bakery) and **30% case file** (Daily Print). Short 4 is all Daily Print.
- **Running time follows the voice track.** Timecodes are targets; the final cut is timed to the generated narration.

| # | Title | Assignment section | Question it answers |
|---|---|---|---|
| 1 | Chatbot or Agent? | 1. Big picture & problem | What makes an agent different, and when do you need one? |
| 2 | Inside an Agent | 2. How the agent thinks & acts | What happens between the request and the result? |
| 3 | Building an Agent Safely | 3. Rules, connections, humans | How do you stop an agent making costly mistakes? |
| 4 | What We Learned | 4. Lessons & how non-tech people help | What did building a real one teach us? |

## The final cut

The finished shorts are in `final/` (`short1.mp4` … `short4.mp4`), each just under 60 seconds. The code that builds them is in [video/](video/), and its `src/shortN.tsx` files hold the narration exactly as spoken. To fit 60 seconds, the final cut differs from the shots below:

- The narration plays 15% faster than recorded (pitch kept), and some lines are shorter. Short 1 drops "So: a chatbot generates text. An agent takes action.", the "One quick question? A chatbot's fine." example and the feeds-and-tabs line. Short 3 drops "before it ever runs" and "Our turn."
- In shorts 2 and 3 the narrator's opening line plays over the title card, not over the clip.
- Short 2's four steps share one page with step chips along the top; Short 4's four lessons do the same with a checklist.
- Short 4 runs 4.1–4.8, then a series end card with no Nora cutout.

How the audio was made: narration with ElevenLabs (narrator voice "Dean", Nora voice "Lucia", model eleven_v4), recorded one take per short and split at the pauses (`video/scripts/split-take.mjs`), then cut and sped up by `video/scripts/voice.mjs`. Music and sound effects are ElevenLabs too, in `assets/music/` and `assets/sfx/`.

---

## The running example: Nora's invoice agent

**Nora** runs a small neighbourhood bakery. She's great at bread and hates paperwork. Every week, suppliers email her invoices, and she has to check each one against what she ordered and what actually arrived before she pays. That job — read, look up, compare, flag, reply, pay — is a textbook agent task, and it lets the series teach *verification* (checking a document against trusted records), which the assignment asks for.

The agent in her story is **illustrative**: we didn't build it. Every general segment carries a small **EXAMPLE** tag in the top-right corner so viewers know. Daily Print segments carry a **CASE FILE: DAILY PRINT** stamp instead.

The supplier in the story is fictional: **Golden Mill Flour Co.** The scam supplier in Short 3 is **Premium Flour Partners**, also fictional.

---

## How to read this

Every shot has a **source**:

- **VEO** — an AI clip made in Google Flow with Omni 1.2 Flash, 9:16, 8 seconds, started from a reference frame. Each short uses the part of the clip that works (2.1 only its first 4.5 seconds). Veo's own audio stays quiet underneath.
- **MOTION** — animated graphics built in code (Remotion), in the styles below.
- **REAL** — real Daily Print material: the sample papers in `public/samples/`, the screenshots in `docs/images/`, and the demo-day poster.

Two rules for every shot:

1. **Nora never speaks on camera.** Her few lines are voice-over, heard while she's seen from behind, in a wide shot, or while we're on a graphic. No lip-sync to get wrong.
2. **No text inside VEO clips.** AI video garbles letters. Laptop screens show soft glowing shapes; invoices show grey lines. All readable words are MOTION overlays or MOTION cut-aways.

---

## Style bible

### Two looks, one for each kind of segment

**The notebook (general lessons).** A top-down view of an open dot-grid notebook filling the frame, cream pages `#FBF7EE` with faint grey dots and a soft shadow down the spine. Everything is drawn on it in thick, slightly wobbly marker strokes that draw themselves on (stroke-reveal, 10–14 frames per shape):

- Marker colours are the same risograph inks as the VEO clips: Pink `#FF48B0` · Yellow `#FFE800` · Teal `#00838A` · Blue `#0078BF` · Purple `#765BA7` · Ink `#1F1F1F`. Every filled shape gets a light grain texture and is offset 2 px from its outline, like a riso print slightly out of register.
- **Sticky notes** (Yellow, Teal, Pink) peel in with a slight curl and a soft shadow.
- **Paper cutouts** of Nora (stills taken from her VEO clips, background removed) with a 10 px white border, animated with small bobs and tilts.
- Handwritten labels in *Caveat Brush*; definitions and numbers in *Space Grotesk Bold*.

**The newspaper (case file).** When the story turns to Daily Print, the notebook page **turns like a newspaper page** and the background becomes newsprint: cream `#F6F0E1` with grain and a light halftone, Ink `#161616` headlines in *Playfair Display Black*, a red rubber stamp **CASE FILE: DAILY PRINT** (Tomato `#E8432E`) slammed in the top-right. Diagrams in this look are the same shapes as the notebook versions, redrawn in ink with Tomato and Sunflower `#FFC62E` accents, so viewers see the *same* idea applied.

**VEO (Nora's world): "riso paper theatre."** Nora's scenes are **cut-paper stop-motion on a tabletop diorama**, as if every piece had been printed on a risograph and cut out by hand. It's a craft look AI video rarely defaults to, and it belongs to this project: Daily Print is about paper, and the MOTION segments are paper too, so the whole series feels like one handmade world.

- **Materials:** matte paper and card with rough hand-cut edges, visible fibre, grainy halftone, and slight misregistration where ink layers don't line up. Black pencil for linework and shading.
- **Palette:** four riso inks — fluorescent pink, bright yellow, teal, blue — on cream paper. Where two inks overlap, they mix (pink over yellow makes orange), which gives the warm tones.
- **Depth:** the set is built in layers (foreground, figures, back wall), each casting a thin soft shadow on the one behind.
- **Light is paper too:** sunbeams are strips of translucent yellow paper laid across the scene; night or shade is a sheet of blue tissue over a layer. The overall light is flat and even, like a lightbox.
- **Movement:** Veo's smooth movement, kept as it comes; the paper look carries the style. Figures are flat jointed paper puppets that move at their joints.
- **Never:** glossy surfaces, plastic or clay, smooth gradients, a 3D-rendered or CGI look.

**The bakery set:** a pink paper back wall with a pencil-drawn tile grid; a long pale blue-grey paper counter with pencil shading; cut-paper loaves (pink over yellow, so orange) on pencil-drawn cooling racks; paper shelves of teal and blue jars; a window cut out of the back layer; a paper laptop whose screen is a flat teal panel with blank paper shapes. Flour is tiny white paper confetti.

**The style block.** Every image and Veo prompt starts with this paragraph (or a version of it), so everything matches. The ready-to-paste Veo prompts are in [prompts_veo/](prompts_veo/):

> *Handmade cut-paper stop-motion animation on a tabletop paper diorama. Every character, object and set piece is cut from matte risograph-printed paper and card: rough hand-cut edges, visible paper fibre, grainy halftone texture, slight colour misregistration. Limited ink palette of fluorescent pink, bright yellow, teal and blue on cream paper, with black pencil linework; overlapping inks mix into orange and purple. Paper layers at different depths cast thin soft shadows on the layers behind. Light is flat and even like a lightbox; sunbeams are strips of translucent yellow paper. Choppy stop-motion movement at about 12 frames per second; characters are flat jointed paper puppets that move at their joints. Nothing glossy, no plastic, no clay, no smooth gradients, no 3D render or CGI look.*

**Test the style before spending Veo credits.** In the Gemini app, generate one still of Nora in her kitchen using the style block plus her description. If it looks right, generate the **first frame of each VEO shot** as a still the same way, and start each clip from it in Flow (*Frames to Video*). A first frame pins the style much harder than words alone. Then try one shot on Veo 3.1 Lite (10 credits) to check the stop-motion movement before using Fast or Quality.

### Recurring graphic elements

- **Agent cards:** what the agent "says" appears as a white rounded card with a Teal bar down the left edge, a small ✦ icon and the label *Agent*, text in *Space Grotesk*. Cards slide up with a soft ping.
- **Step numbers:** big hand-drawn circled numbers (Pink) with a one-word label, drawn on with a marker squeak.
- **Captions:** narration only (character lines get their own small speech label instead). *Space Grotesk ExtraBold* 60 px, ink on a Yellow highlighter swipe behind the current phrase, 3–4 words at a time, at y ≈ 1350 px. Keep key content out of the top 250 px and bottom 400 px.
- **Nora's lines:** a small hand-drawn speech label (white, ink outline) with "NORA" in tiny caps above it, beside her cutout or at the edge of the frame.

### Title card (every short, ~2 seconds)

**MOTION.** A notebook cover (Pink, cloth texture) slides up; a round sticker slaps on: **AGENTS, EXPLAINED**, then a handwritten line beneath: **Part N · {title}**. Sound: sticker slap, then a soft two-note marimba chime. No voice.

### "Remember" card (last ~5 seconds of every short)

**MOTION.** A Yellow sticky note peels onto the notebook: **REMEMBER** and three numbered one-line takeaways, each drawing on in turn (given per short). Under it, small: "Next: {next title} →". The narrator says only the "Next" line, so viewers have a moment to read. Bottom credit line, small: *Voices: ElevenLabs · Clips: Google Veo · A Daily Print team tutorial*.

---

## Cast

### NORA — the learner

- **Look:** a flat, jointed **paper puppet** of a woman in her mid-30s: warm-brown paper skin; a cloud of curly black-paper hair with pencil-drawn curls, tied up under a **teal paper bandana**; small yellow paper hoop earrings; a **bright yellow paper apron** speckled with white flour dots over a **blue-and-cream striped paper shirt**, sleeves rolled. Her face is drawn in pencil: dot eyes, very expressive eyebrow lines, a small line mouth, and two pink riso circles for cheeks.
- **Personality:** practical, funny, a little sceptical of tech. She asks the questions the audience would ask.
- **Voice:** *Lucia – Raspy & Natural* (`EkpXPRVw7LERkOks6f1W`): down-to-earth, wry.
- **Reference images (make first, in Gemini / Nano Banana):**
  - **Nora:** the style block, then: "*Character sheet of one paper puppet, full body, front view and three-quarter view side by side, laid flat on plain cream paper, no text. A woman in her mid-30s cut from paper: warm-brown paper skin, a cloud of curly black-paper hair with pencil-drawn curls tied up under a teal paper bandana, small yellow paper hoop earrings, a bright yellow paper apron with white flour dots over a blue-and-cream striped paper shirt with rolled sleeves. Face drawn in pencil: dot eyes, expressive eyebrow lines, small line mouth, pink riso cheek circles. Visible brass split-pin joints at the shoulders, elbows and knees.*"
  - **The kitchen:** the style block, then the bakery set description above, "*empty, morning, yellow paper sunbeams through the window, no text*".
  
  Attach both to every VEO shot (as *Ingredients*, or use them to make each shot's first frame).

### THE NARRATOR — the teacher

- Never seen. Speaks to the viewer like a good teacher: clear, warm, a little dry. In the case file segments the narrator says "we" — the narrator is the Daily Print team.
- **Voice:** *Dean – Clear, Patient & Engaging* (`hqsADTrqjrr0sI9LFcYV`).

### THE AGENT

Not a character with a face. In the notebook it's drawn as a small **org chart**: a **Manager** card (a brain icon, labelled "the language model") with **specialist** cards beneath it, each holding a tool icon. It "talks" only through agent cards. This keeps the focus on how it works, not on a mascot.

**Voice model:** ElevenLabs `eleven_v4` (supports tags like `[sighs]`, `[laughs softly]`). One take per line; redo only lines that miss.

---

## Sound bible

### Music

- **Lesson bed (all general segments):** "*Light, curious, upbeat acoustic explainer music. 100 BPM, G major. Plucked nylon-string guitar, marimba melody, soft hand claps, warm upright bass, gentle shaker. Friendly and focused, like a good classroom video; not salesy, no big build. No vocals. Loops cleanly.*" Length: 60 seconds.
- **Case file sting (2 seconds):** "*A typewriter carriage-return ding into a short, playful muted-trumpet and upright-bass newsroom motif. No vocals.*" Plays on every page turn into the case file, then the lesson bed continues under it with a brushed snare added.
- **Mix:** music at −20 dB under speech, −12 dB in gaps (title card, Remember card). Duck by 6 dB for 300 ms before each punchline.

### Sound effects

Generate with ElevenLabs Sound Effects, one take each, or take from Pixabay.

| ID | Prompt | Used in |
|---|---|---|
| SFX-MARKER | felt-tip marker squeaking quickly on paper | step numbers, drawings |
| SFX-STICKY | sticky note peeled and pressed onto paper | sticky notes |
| SFX-PING | soft, friendly app notification ping | agent cards |
| SFX-STAMP | rubber stamp thump on paper | stamps |
| SFX-PAGE | crisp newspaper page turn | into each case file |
| SFX-TICK | short pencil tick on paper | checklist ticks |
| SFX-ERR | soft, low two-tone "nope" blip, not harsh | mismatches, held invoices |
| SFX-KEY | small key turning in a lock, then a door clicking open | API doors |
| SFX-BLOCKS | wooden blocks tumbling onto a table | 4.4 |
| SFX-METER | old cash register ticking and slowing to a stop | 4.5 |
| SFX-SAFE | small safe door closing with a heavy click | 4.6 |
| SFX-BELL | shop door bell jingling | 4.8 |
| SFX-OVEN | kitchen timer ding | 1.1 |

---

# SHORT 1 — "Chatbot or Agent?"

**Covers (assignment §1):** how agents go beyond chatbots (taking multi-step actions vs. generating text); the real-world challenge (news feeds are built never to end; checking sources yourself is slow); why an agent is the right tool; why Daily Print is a better way to get the news than a feed.
**Teaches:** the definition of an agent, the plan → act → check loop, and a four-question test for when a job needs one.

### 1.1 · 0:00–0:05 · VEO — meet Nora

- **Picture:** Dawn in the paper bakery. Nora, in profile, kneads a big ball of dough (cream card, pencil-shaded) on the counter; white paper confetti flour flutters up with each push. An oven timer dings; she looks over at the paper laptop at the end of the counter, where a tall, leaning stack of tiny paper invoices sits beside it. Her shoulders drop, in two stop-motion steps.
- **Camera:** medium-wide side view at counter height, a slow push-in toward the laptop and the stack.
- **Light:** strips of yellow paper sunbeam fall across the counter from the window (frame left); the back corners of the set are under a sheet of blue tissue.
- **On screen (MOTION overlay):** lower-third label in handwriting: "Nora · runs a small bakery". EXAMPLE tag top-right.
- **Narrator:** "This is Nora. Bread at five a.m. [beat] Paperwork at nine."
- **Sound:** SFX-OVEN; lesson bed starts; faint kitchen ambience (Veo's audio at −24 dB if usable).
- **Veo prompt:** [prompts_veo/1.1-meet-nora.txt](prompts_veo/1.1-meet-nora.txt), starting from the frame `assets/references/Gemini_Generated_Image_Nora_Short1.jpg`.

### 1.2 · 0:05–0:07 · MOTION — title card

**Part 1 · Chatbot or Agent?**

### 1.3 · 0:07–0:12 · MOTION — the chatbot

- **Picture:** Notebook. A chat window is drawn in Blue marker. Nora's cutout stands to the left. Her message appears in a bubble: *"Can you check this invoice?"* The reply draws itself as a numbered list: *1. Find your purchase order · 2. Find the delivery note · 3. Compare quantities · 4. Compare prices · 5. …* and keeps going to **7**. Nora's cutout slowly tilts her head.
- **Label:** a Blue sticky note: **CHATBOT → text**.
- **Nora (VO):** "Can you check this invoice?"
- **Narrator:** "A chatbot replies with instructions. [beat] Nora still does every step."
- **Sound:** keyboard taps; SFX-MARKER as the list writes; a small deflated "hm" from Nora (part of her line's take, `[unimpressed]`).

### 1.4 · 0:12–0:22 · MOTION — the agent

- **Picture:** The chat window erases with a quick scribble. Across the page, six sticky notes peel on in a left-to-right path, joined by a hand-drawn arrow, each getting a Teal tick (SFX-TICK) as the narration reaches it:
  1. 📧 Open the invoice
  2. 📁 Find the order
  3. 📦 Check the delivery note
  4. ⚠️ **"Billed: 50 bags of flour. Delivered: 40."** (this one is Pink, with SFX-ERR)
  5. ✉️ Draft an email to the supplier
  6. ✋ An agent card: **"Email ready. Send it?"** — Nora's cutout taps **Yes**.
- **Label:** a Teal sticky note: **AGENT → actions**.
- **Narrator:** "An agent does the steps. It opens the invoice, finds the order, checks the delivery, spots the problem, drafts the email — and asks Nora before sending."
- **Sound:** SFX-STICKY per note, SFX-TICK per tick, SFX-PING on the agent card.

### 1.5 · 0:22–0:30 · MOTION — the definition

- **Picture:** The path clears. Two drawings side by side:
  - Left, small: **Chatbot** — a box with an arrow in ("question") and an arrow out ("text").
  - Right, big: **Agent** — a circular loop of three arrows: **PLAN → ACT (use a tool) → CHECK →** back to PLAN, with a flag at the exit marked **DONE**. A dot travels around the loop twice, then exits to DONE.
  
  Beneath, a definition box in *Space Grotesk*: **An AI agent is an AI that can plan, use tools, check the results, and repeat until the job is done.**
- **Narrator:** "So: a chatbot generates text. An agent takes action — it plans, uses tools, checks the results, and loops until the job is done."
- **Sound:** a soft whoosh each time the dot circles; SFX-TICK at DONE.

### 1.6 · 0:30–0:37 · MOTION — the Agent Test

- **Picture:** A Yellow sticky note titled **THE AGENT TEST** with four checkboxes, each ticked as it's read, with Nora's invoices as the example:
  - Many steps? ✓
  - Needs tools or data? ✓
  - Needs judgment? ✓
  - Happens again and again? ✓
  
  A Teal stamp: **AGENT-SHAPED**. Then a small counter-example card flicks in at the corner: *"Convert 3 cups of flour to grams"* — one tick only — labelled **a chatbot is fine**.
- **Narrator:** "Is your job agent-shaped? Many steps? Tools or data? Judgment? Again and again? Four yeses: good fit. One quick question? A chatbot's fine."
- **Sound:** SFX-TICK ×4; SFX-STAMP.

### 1.7 · 0:37–0:54 · MOTION + REAL — CASE FILE: our problem

- **0:37–0:38 · Transition.** SFX-PAGE: the notebook page turns into newsprint. SFX-STAMP: **CASE FILE: DAILY PRINT**. The case-file sting plays.
- **0:38–0:42 · MOTION.** A phone drawn in ink fills the centre; its feed scrolls endlessly (abstract posts: grey blocks, thumbnail squares, small heart icons), getting faster. A Tomato label: **FEEDS: NO LAST PAGE**.
- **0:42–0:45 · MOTION.** A dozen small browser tabs fan out like playing cards around a coffee cup; a clock above spins an hour forward. Label: **DIY: A DOZEN SITES, EVERY MORNING**.
- **0:45–0:48 · MOTION.** The Agent Test sticky note returns, redrawn in ink: *Many steps ✓ · Tools (web search) ✓ · Judgment (what matters to you) ✓ · Every day ✓* → stamp **AGENT-SHAPED**.
- **0:48–0:54 · REAL.** A real front page (`public/samples/1-the-morning-edition.pdf`, page 1) drops onto the newsprint with a soft thump, slightly rotated. Beside it, two rows from the poster's *Your feed vs. your paper* table draw in: *Never ends → Ends: a fixed number of pages* · *An algorithm ranks what you see → You choose the sections and sources*.
- **Narrator:** "Our project ran the same test on the news. Feeds are built to never end; doing it yourself means a dozen sites every morning. Steps, tools, judgment, daily — four yeses. So we built Daily Print: an agent that researches and edits one newspaper, for one reader, that ends."

### 1.8 · 0:54–1:00 · MOTION — Remember

- **REMEMBER:**
  1. Chatbots answer. Agents act.
  2. Agents loop: plan → act → check.
  3. Use the Agent Test before you build.
- **Narrator:** "Next: what's inside an agent."

---

# SHORT 2 — "Inside an Agent"

**Covers (assignment §2):** the "brain" and the "tools" as a manager with specialist workers; input (receiving a document to verify); how the agent breaks the task into sub-steps; tool calls and verification against outside data; delivering the result.
**Teaches:** the four stages (input → plan → tools & checks → output) and what "verification" means: checking a document against a record you trust (the *three-way match*).

### 2.1 · 0:00–0:05 · VEO — Nora counts by hand

- **Picture:** The bakery's small paper storeroom. Nora, seen from behind, a paper clipboard in one hand, counts a tall stack of cream paper flour sacks (each a folded card with pencil creases), tapping each with a real-looking pencil stub, then stops, turns her head to profile (not facing camera), and slumps.
- **Camera:** over-the-shoulder from behind Nora, slightly low so the stack looks huge; static, with a slight drift right.
- **Light:** the room sits under blue tissue paper; a cut-paper bulb overhead throws a circle of yellow tissue onto the sacks; a strip of yellow paper daylight comes through a half-open paper door.
- **Nora (VO):** `[counting, flat]` "Thirty-nine… forty. [sighs] Forty bags."
- **Narrator:** "Last time, Nora's agent caught that flour invoice. How?"
- **On screen:** EXAMPLE tag.
- **Veo prompt:** [prompts_veo/2.1-counting-flour.txt](prompts_veo/2.1-counting-flour.txt), starting from the frame `assets/references/Gemini_Generated_Image_Short2.jpg`.

### 2.2 · 0:05–0:07 · MOTION — title card

**Part 2 · Inside an Agent**

### 2.3 · 0:07–0:16 · MOTION — the manager and the specialists

- **Picture:** Notebook. An org chart draws itself:
  - Top: a **Manager** card with a Purple brain icon, labelled **BRAIN · the language model**, and three small words around it: *plans · decides · delegates*.
  - Below, four **specialist** cards fan out on lines from the manager, each with a tool icon: **READER** (magnifying glass over a page) · **CLERK** (filing drawer) · **CHECKER** (balance scales) · **WRITER** (pen).
  - Along the bottom, a **toolbox** row of the systems they're allowed to use: 📧 *email* · 🗄 *accounting records* · 📋 *supplier list*.
- **Narrator:** "An agent is a brain plus tools. The brain — a language model — is the manager: it plans and decides. Specialists do the work, using the tools they're allowed to touch."
- **Sound:** SFX-MARKER on each card; SFX-STICKY for the toolbox.

### 2.4 · 0:16–0:20 · MOTION — Step 1: input

- **Picture:** A Pink circled **1** with the label **INPUT**. An envelope drops onto the page and opens; an invoice slides out, drawn simply: **Golden Mill Flour Co. · Flour, 50 bags × $32 · Total $1,600**.
- **Narrator:** "One: input. An invoice arrives by email."
- **Sound:** SFX-PING; paper slide.

### 2.5 · 0:20–0:26 · MOTION — Step 2: plan

- **Picture:** Circled **2**, label **PLAN**. The manager card "thinks" (three dots), then four sticky notes fly from it to the specialists: *Read it* → READER · *Find the order + delivery note* → CLERK · *Compare* → CHECKER · *Draft a reply* → WRITER.
- **Narrator:** "Two: the manager splits the job — read it, find the order, check the delivery, compare."
- **Sound:** four quick SFX-STICKY.

### 2.6 · 0:26–0:37 · MOTION — Step 3: tools and checks

- **Picture:** Circled **3**, label **TOOLS + CHECKS**. READER draws a box around the invoice's line and lifts out **50 bags · $32**. CLERK opens the filing drawer (🗄 accounting records) and pulls two cards: the **Order: 50 bags** and the **Delivery note: 40 bags**. The three documents slide into a row: **INVOICE 50 · ORDER 50 · DELIVERED 40**. The CHECKER's scales tip; a Pink circle snaps around **40**; a label: **MISMATCH**. A small grey footnote writes in under the row: *"Accountants call this a three-way match."*
- **Narrator:** "Three: tools and checks. One specialist reads the PDF, one pulls the order and delivery note from the records, one compares. Fifty billed, forty delivered. Verification means checking against a record you trust."
- **Sound:** a drawer sliding; SFX-TICK, SFX-TICK, then SFX-ERR on the mismatch.

### 2.7 · 0:37–0:42 · MOTION — Step 4: output

- **Picture:** Circled **4**, label **OUTPUT**. An agent card slides up: **Pay $1,280 for 40 bags · Hold $320 for 10 missing · Email to Golden Mill drafted · Waiting for Nora.** Nora's cutout gives a thumbs-up.
- **Narrator:** "Four: output. Pay for forty, flag ten, draft the email."
- **Sound:** SFX-PING.

### 2.8 · 0:42–0:55 · MOTION + REAL — CASE FILE: Daily Print's newsroom

- **0:42–0:43 · Transition.** SFX-PAGE into newsprint; SFX-STAMP **CASE FILE: DAILY PRINT**; sting.
- **0:43–0:52 · MOTION.** The same org chart and four-step row, redrawn in ink. Each box fills in with Daily Print's version as it's named:
  1. **INPUT:** *your sections, tone and sources* + a drawer labelled *what you've read · last 14 days*
  2. **PLAN:** the manager splits the paper into sections; arrows fan out to all of them at once (*"every section at once"*)
  3. **TOOLS + CHECKS:** four specialists, each with a small grey tech label:
     - **RESEARCHER** — web search, sources kept · *Claude Sonnet*
     - **WRITER** — checks the reading-history drawer and skips what you've read · *Claude Opus*
     - **ARTIST** — the illustration and comic · *OpenAI or Google*
     - **FITTER** — a ruler measures each column; text that spills past the bottom shrinks until it fits · *Chromium*
  4. **OUTPUT:** a printer icon and a screen icon
- **0:52–0:55 · REAL.** A real front page (`public/samples/4-the-daily-vibe-check-gen-z.pdf`, page 1) slides out of the drawn printer.
- **Narrator:** "Daily Print, same steps. Input: your sections, tone, and two weeks of reading history. Plan: research every section at once. Tools and checks: web search with sources, skip what you've read, measure every column. Output: your paper."
- **Sound:** a tape measure zip on FITTER; a printer whirr under the final page.

### 2.9 · 0:55–1:00 · MOTION — Remember

- **REMEMBER:**
  1. Brain = the manager. Tools = the hands.
  2. Input → plan → tools & checks → output.
  3. Verify against a record you trust.
- **Narrator:** "Next: building one safely."

---

# SHORT 3 — "Building an Agent Safely"

**Covers (assignment §3):** Step 1 defining rules and safety guards; Step 2 connecting the language model to tools and databases; Step 3 human-in-the-loop at the risky steps — first for Nora's agent, then how Daily Print does each.
**Teaches:** rules before launch, *least access* (give the agent only the permissions it needs), testing with fake data, and approval points.

### 3.1 · 0:00–0:06 · VEO — the suspicious invoice

- **Picture:** Nora pipes icing onto a round paper cake; the icing is a ribbon of fluorescent-pink paper curling out of a paper piping bag. The paper laptop beside her pops a small yellow paper square onto its teal screen (the notification). She glances at it and freezes; the piping bag keeps squeezing, and the pink paper ribbon piles up into a big, ridiculous coil on the cake.
- **Camera:** wide shot from the front of the counter, Nora small in frame on the right, the laptop in the left foreground slightly out of focus; on the freeze, a quick, gentle push-in on the icing coil.
- **Light:** bright mid-morning: several wide yellow paper sunbeams, no blue tissue anywhere. Clean and cheerful.
- **Narrator:** "A five-thousand-dollar invoice from a supplier Nora's never heard of. What should her agent do?"
- **Nora (VO, during the freeze):** `[suspicious]` "Who is 'Premium Flour Partners'?"
- **Sound:** SFX-PING; a comic squelch as the icing piles up.
- **On screen:** EXAMPLE tag.
- **Veo prompt:** [prompts_veo/3.1-the-icing.txt](prompts_veo/3.1-the-icing.txt), starting from the frame `assets/references/Gemini_Generated_Image_Short3.jpg`.

### 3.2 · 0:06–0:08 · MOTION — title card

**Part 3 · Building an Agent Safely**

### 3.3 · 0:08–0:19 · MOTION — Step 1: rules and guards

- **Picture:** Notebook. Circled **1**, label **RULES + GUARDS**. Three rules handwritten on lined index cards, each stamped as it's read:
  - **Only pay suppliers on the list.**
  - **Over $500? Ask Nora.**
  - **Not sure? Ask.**
  
  Then a key ring drops in: one key labelled **BANK: READ ONLY**, and the label **least access** draws in beside it. Payoff: the Premium Flour Partners invoice slides in, bounces off the first rule, and an agent card appears: **Held for Nora: unknown supplier · $5,000.**
- **Narrator:** "Step one: rules and guards, before it ever runs. Only pay known suppliers. Over five hundred dollars? Ask Nora. And least access: it can read the bank, never move money."
- **Sound:** SFX-STAMP ×3; key jingle; SFX-ERR on the bounce; SFX-PING.

### 3.4 · 0:19–0:26 · MOTION — Step 2: connect the systems

- **Picture:** Circled **2**, label **CONNECT**. The manager card sits in the centre; around it, three small doors drawn on the page — **Email**, **Accounting**, **Bank** — each with a brass plate reading **API** and a keyhole. A key turns in each and a cable runs from the door to the manager. Then a baking tray slides in labelled **TEST KITCHEN**, holding fake invoices: *a duplicate*, *a wrong total*, *an unknown supplier*. Each passes through the agent and comes out correctly flagged.
- **Narrator:** "Step two: connect the tools through APIs — official doorways with keys. Then test on fake invoices, tricky ones included."
- **Sound:** SFX-KEY ×3; SFX-TICK ×3 for the test results.

### 3.5 · 0:26–0:31 · MOTION — Step 3: humans in the loop

- **Picture:** Circled **3**, label **HUMAN IN THE LOOP**. An approval queue of three agent cards: *Golden Mill · $1,280 · OK* · *Milk delivery · $96 · OK* · *Premium Flour Partners · $5,000 · unknown supplier*. Nora's cutout taps **Approve** on the first two (Teal) and **Reject** on the third (Pink), which crumples.
- **Narrator:** "Step three: humans in the loop. The agent prepares; Nora approves anything risky."
- **Sound:** two SFX-TICK; a paper crumple.

### 3.6 · 0:31–0:53 · MOTION + REAL — CASE FILE: how we built Daily Print

- **0:31–0:32 · Transition.** SFX-PAGE into newsprint; SFX-STAMP **CASE FILE: DAILY PRINT**; sting.
- **0:32–0:40 · MOTION — our rules.** A newspaper column outline; text pours into it and keeps going past the bottom, unrolling off the page like a scroll; a Tomato stamp **+40%**. Then the same rulebook from 3.3, in ink, with Daily Print's rules stamped in:
  - **LENGTH = THE SIZE OF THE BOX** (the column refills, exactly to the bottom edge)
  - **EVERY STORY CITES ITS SOURCES**
  - **PICTURES AVOID TRAGEDY** (an illustration frame with a small storm cloud gets a NOPE stamp)
- **Narrator:** "Our turn. Daily Print's first real edition wrote forty percent too much. Now length comes from the box, stories cite sources, and the pictures avoid tragedy."
- **0:40–0:47 · MOTION — our connections.** The doors from 3.4, relabelled: *web search* · *weather (Open-Meteo)* · *Google Calendar* · *image model* · *database (Supabase)* · *printer box*. Below, a five-step progress bar — *Research · Write · Draw · Fit · Print* — fills to step 3, flashes red (a lightning-bolt icon: **crash**), then **resumes from step 3**, not zero, with a Teal **SAVED** tick.
- **Narrator:** "It plugs into web search, weather, a calendar, a database and a printer — and saves every step, so a crash resumes."
- **0:47–0:53 · REAL — readers steer.** The **Customize page** screenshot (`docs/images/customize.png`) slides in at a slight tilt; a Sunflower circle loops the page builder. Page-turn to the **Paper page** (`docs/images/paper.png`): an animated cursor taps a **+** above a story (it becomes ✓).
- **Narrator:** "And readers steer it: they design the pages, pick sources, and follow stories."
- **Sound:** SFX-STAMP per rule; SFX-KEY ×6, fast; a power-down blip on the crash; SFX-TICK on SAVED; soft UI clicks.

### 3.7 · 0:53–1:00 · MOTION — Remember

- **REMEMBER:**
  1. Write the rules first. Give the least access.
  2. Connect through APIs. Test with fake data.
  3. A human approves the risky moments.
- **Narrator:** "Next: what we learned."

---

# SHORT 4 — "What We Learned"

**Covers (assignment §4):** practical takeaways from building Daily Print (accuracy, edge cases, cost, privacy) and how non-technical domain experts can help: writing the rules, collecting tricky test cases, checking the agent's work.
**Teaches:** four lessons that apply to any agent, and that the rules an agent follows are written in plain language by people who know the job.

This short is all case file, so it stays in the **newspaper look** throughout (CASE FILE stamp top-right), except the callback to Nora in 4.7.

### 4.1 · 0:00–0:04 · MOTION — the question

- **Picture:** Newsprint. A reporter's notebook flips open to a page titled **LESSONS** with four empty checkboxes.
- **Narrator:** "Four lessons from building a real agent — and how non-coders can help."
- **Sound:** case-file sting; SFX-PAGE.

### 4.2 · 0:04–0:06 · MOTION — title card

**Part 4 · What We Learned**

### 4.3 · 0:06–0:12 · MOTION + REAL — 1: accuracy needs receipts

- **Picture:** Checkbox 1 ticks: **ACCURACY**. A REAL crop of one story from `public/samples/1-the-morning-edition.pdf`, with its source line. A Sunflower highlighter swipes across the source; a magnifying glass passes over it. Tagline writes in: **Can't trace it? Don't trust it.**
- **Narrator:** "One: accuracy needs receipts. Every story names its sources, so a person can check it."

### 4.4 · 0:12–0:21 · MOTION — 2: plan for things going wrong

- **Picture:** Checkbox 2: **EDGE CASES**. A wooden block tower, each block a section: *World · Tech · Local · Science · Sports*. **BEFORE:** the *Science* block slides out and the whole tower tumbles; Tomato stamp **PAPER FAILED**. A quick rewind. **AFTER:** the block slides out, a small card drops into the gap — *"No news today"* — and the tower stands; Teal stamp **PRINTED**.
- **Narrator:** "Two: plan for things going wrong. One failed section used to sink the whole paper. Now it says 'no news today', and the rest still prints."
- **Sound:** SFX-BLOCKS; a short tape-rewind whirr; SFX-STAMP.

### 4.5 · 0:21–0:29 · MOTION — 3: every step costs money

- **Picture:** Checkbox 3: **COST**. A taxi-style meter ticks over a newspaper. Three changes stamp in one by one, and the meter slows with each: **RESEARCH IN PARALLEL** (three section icons side by side instead of in a queue) · **RETRY ONCE, NOT FOREVER** · **ONE PAPER AT A TIME** (a mouse cursor double-clicks a Generate button; the second click bounces off). The meter stops.
- **Narrator:** "Three: every step costs money. Research runs in parallel, retries stop at one, and one paper runs at a time."
- **Sound:** SFX-METER, slowing to a stop; SFX-STAMP ×3.

### 4.6 · 0:29–0:36 · MOTION — 4: share less

- **Picture:** Checkbox 4: **PRIVACY**. A calendar page with two birthday cakes; the names next to them (unreadable scribbles) drop into a small safe, which closes. The manager card (the language model) receives only a slip: **🎂 × 2 today**.
- **Narrator:** "Four: share less. We read your calendar for birthdays — but the names never go to the AI."
- **Sound:** SFX-SAFE.

### 4.7 · 0:36–0:52 · MOTION — anyone can help

- **Picture:** Page-turn back to the **notebook** (EXAMPLE tag returns). Nora's cutout holds up her index card from Short 3: **Over $500? Ask Nora.** A label draws in: **Only Nora could write this rule.** Then three role cards pop in, each with an icon and a short line:
  - ✍️ **WRITE THE RULES** — in plain language
  - 🧪 **COLLECT TRICKY EXAMPLES** — to test with
  - ✅ **CHECK THE RESULTS** — and flag what's wrong
  
  Page-turn to newsprint for the last beat: the same three cards relabelled for Daily Print: *editors → the house style and tone* · *subject experts → sources to trust* · *readers → flag mistakes in real editions*.
- **Narrator:** "And you don't need to code to help. Nora's 'over five hundred, ask me' rule? Only Nora could write it. Experts write the rules, gather tricky examples, and check the results. For us: editors set the house style, readers flag mistakes."
- **Sound:** SFX-STICKY ×3; SFX-PAGE; SFX-STAMP ×3.

### 4.8 · 0:52–0:57 · VEO (Quality) — back to baking

- **Picture:** The bakery's front door from inside. Nora closes the paper laptop on the counter with a satisfied little pat, wipes her hands on her apron (a puff of white paper confetti), walks to the door in stop-motion steps and flips the small hanging paper sign (shown edge-on, no readable text) as the shop bell, a tiny brass-coloured paper bell, swings. Outside the door, a street layer: pencil-drawn shopfronts and two cut-paper customer silhouettes in blue. She turns her head and her pencil mouth changes to a smile.
- **Camera:** starts on the laptop closing in the foreground (shallow focus), racks focus to Nora as she walks to the door; ends on a medium shot of her at the door, backlit.
- **Light:** the brightest of the series: the door is a window of layered yellow and pink tissue, so Nora is edged in orange; every blue tissue sheet is gone.
- **Narrator:** "If you can explain your job, you can help build an agent."
- **Sound:** SFX-BELL; lesson bed resolves on its final marimba note.
- **Veo prompt:** [prompts_veo/4.8-back-to-baking.txt](prompts_veo/4.8-back-to-baking.txt), starting from the frame `assets/references/Gemini_Generated_Image_Short4.jpg`.

### 4.9 · 0:57–1:00 · MOTION — series Remember card

- **REMEMBER:**
  1. Can't trace it? Don't trust it.
  2. Design for failure, cost and privacy from day one.
  3. The rules are plain language — experts write them.
- Under it: **Agents, Explained · 1 Chatbot or Agent? · 2 Inside an Agent · 3 Building an Agent Safely · 4 What We Learned** and *Case study: Daily Print · daily-print.vercel.app*.
- No narration; music ends.

### Optional split: 4a and 4b

Short 4 fits in 60 seconds as written. If it feels rushed when cut together, split it at 4.7:

- **4a — "What We Learned" (~40 s):** 4.1–4.6, then 4.8 with the narrator's line changed to "Next: how you can help — no code needed."
- **4b — "You Don't Need to Code" (~40 s):** title card **Part 5 · You Don't Need to Code**, then:
  - **Narrator:** "Building an agent isn't only a job for programmers. The most important part is written in plain language."
  - Nora's card, as in 4.7: "Nora's 'over five hundred, ask me' rule? Only Nora could write it."
  - **Write the rules:** "People who know the job write the rules: what's normal, what's suspicious, when to ask."
  - **Collect tricky examples:** "They collect the weird cases — the duplicate invoice, the missing delivery — to test the agent before it goes live."
  - **Check the results:** "And they review what the agent produces, and flag what's wrong, so the rules get better."
  - Newsprint: "For Daily Print, editors set the house style, experts choose sources to trust, and readers flag mistakes."
  - 4.8 VEO with "If you can explain your job, you can help build an agent." and the series Remember card.

---

## Production list

### VEO clips (4 shots)

| Shot | What | Model |
|---|---|---|
| 1.1 | Nora kneading at dawn; the pile of invoices | Fast |
| 2.1 | Nora counting flour sacks in the storeroom | Fast |
| 3.1 | Nora freezes; the icing blob | Fast |
| 4.8 | Nora closes the laptop and opens the shop | **Quality** |

Before these, in the Gemini app (Google AI Pro): Nora's character sheet, the empty kitchen, and a first-frame still for each of the four shots, all made with the style block. Attach the references to every VEO shot and start each clip from its first frame. Four shots cost about 160 Flow credits (three Fast at 20, one Quality at 100), plus about 10 for a Lite test of the style, leaving plenty for retakes.

### Nora cutouts for MOTION

Nora is already a paper puppet, so her cutouts sit naturally on the notebook. Generate 3 poses in Gemini from her character sheet (standing, tapping a button, thumbs-up), each on plain cream paper, and remove the background (free, locally).

### REAL assets

- Front pages rendered from `public/samples/1-the-morning-edition.pdf` and `public/samples/4-the-daily-vibe-check-gen-z.pdf`, and one story crop with its source line.
- `docs/images/customize.png`, `docs/images/paper.png`.
- From the poster: two rows of the *Your feed vs. your paper* table.

### Voice budget

About 580 spoken words in total (narrator about 560, Nora about 20): roughly 3,500 ElevenLabs credits for one full take of everything, out of 10,000.

---

## Assignment coverage

| Assignment item | Where |
|---|---|
| §1 How agents go beyond chatbots (multi-step actions vs. text) | 1.3–1.5 |
| §1 The real-world challenge; why doing it manually is slow | 1.1, 1.3, 1.7 |
| §1 Why an agent is the right solution | 1.6, 1.7 |
| §1 Why the current news platforms are outdated and Daily Print is better | 1.7 |
| §2 The brain & tools as manager + specialists | 2.3, 2.8 |
| §2 Input / user request (receiving a document to verify) | 2.4, 2.8 |
| §2 Agent decision making (breaking the task down) | 2.5, 2.8 |
| §2 Tool call / verification against outside data | 2.6, 2.8 |
| §2 Output / delivering the result | 2.7, 2.8 |
| §3 Step 1: rules & safety guards | 3.3, 3.6 |
| §3 Step 2: connecting the language model to tools and databases | 3.4, 3.6 |
| §3 Step 3: human-in-the-loop | 3.5, 3.6 |
| §4 Practical takeaways: accuracy, edge cases, cost, privacy | 4.3–4.6 |
| §4 How non-tech domain experts can help (rules, prompting, validating) | 4.7 (or 4b) |

## Facts checked against the repo

- Every story cites its sources; opinion pieces say so — `docs/DECISIONS.md` (Writing).
- Research runs every section at once; Claude calls retry at most once; one paper at a time — `docs/DECISIONS.md` (Writing, Making editions).
- The writer skips what the reader has read in the last 14 days — the poster and README.
- A failed section prints a one-line "no news today" piece instead of failing the paper — `docs/DECISIONS.md` (Writing).
- The first real run wrote 40% too much — `docs/DECISIONS.md` (Writing).
- The illustration avoids violence, death, war, disasters, crime and grief — `docs/DECISIONS.md` (Pictures).
- Birthday names never go to Claude — `docs/DECISIONS.md` (The paper's sections).
- Each workflow step saves, so a restart carries on — `docs/DECISIONS.md` (Making editions).
- **The fitter shrinks text; it doesn't rewrite it.** The poster says Chromium "rewrites what doesn't fit", but `lib/paper/render.ts` shrinks the text until it fits. The script shows shrinking.
- **Cost is not stated.** The poster says under 50¢ and the README says about $1, so the script doesn't give a number.
