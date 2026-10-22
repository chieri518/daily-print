import Anthropic from "@anthropic-ai/sdk";
import type { BetaMessageStreamParams } from "@anthropic-ai/sdk/resources/beta/messages";

const client = new Anthropic();

// Claude Opus 5.5 prices in USD per million tokens. Web search is per request.
const PRICE = { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5, search: 0.01 };

type Options = Omit<BetaMessageStreamParams, "model" | "max_tokens" | "messages">;

// Sends one prompt to Claude and returns the final message with its cost in USD.
export async function ask<O extends Options>(prompt: string, options: O) {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: prompt }];
  let usd = 0;
  while (true) {
    const message = await client.beta.messages
      .stream({
        model: "claude-opus-5-5",
        max_tokens: 32000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default", // if Claude declines by mistake, retry on another model
        ...options,
        messages,
      })
      .finalMessage();

    const u = message.usage;
    usd +=
      (u.input_tokens * PRICE.input +
        u.output_tokens * PRICE.output +
        (u.cache_read_input_tokens ?? 0) * PRICE.cacheRead +
        (u.cache_creation_input_tokens ?? 0) * PRICE.cacheWrite) / 1e6 +
      (u.server_tool_use?.web_search_requests ?? 0) * PRICE.search;

    if (message.stop_reason === "refusal") throw new Error("Claude declined to write this edition.");
    if (message.stop_reason !== "pause_turn") return { message, usd };
    // Long web searches can pause; send the partial turn back so Claude continues.
    messages.push({ role: "assistant", content: message.content });
  }
}
