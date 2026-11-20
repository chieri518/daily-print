import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { z } from "zod";

// USE_CLAUDE_CODE=1 runs Claude through the Claude Code CLI on this machine, using your Claude subscription
// instead of the API. It is for personal testing only: anything deployed must use ANTHROPIC_API_KEY.
export const useClaudeCode = process.env.USE_CLAUDE_CODE === "1";

// Opus writes the stories, unless the reader chose Sonnet; Sonnet does the rest. `alias` is the name Claude Code uses.
// Prices in USD per million tokens; web search is per request.
const MODELS = {
  opus: { id: "claude-opus-5-5", alias: "opus", input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
  sonnet: { id: "claude-sonnet-5-5", alias: "sonnet", input: 2, output: 10, cacheRead: 0.1, cacheWrite: 2.5 },
};
const SEARCH_PRICE = 0.01;

// `label` names the call in the log. `searches` is the most web searches it may make (none when left out).
type Options = { label: string; model: keyof typeof MODELS; searches?: number; schema?: z.ZodType };

// Sends one prompt to Claude, with web search and/or a JSON output schema.
// Returns the reply's text (JSON when a schema is given) and its cost in USD.
export function ask(prompt: string, options: Options) {
  return useClaudeCode ? askClaudeCode(prompt, options) : askApi(prompt, options);
}

async function askApi(prompt: string, { label, model: name, searches, schema }: Options) {
  const model = MODELS[name];
  const client = new Anthropic();
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: prompt }];
  let usd = 0;
  while (true) {
    const message = await client.beta.messages
      .stream({
        model: model.id,
        max_tokens: 32000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default", // if Claude declines by mistake, retry on another model
        tools: searches ? [{ type: "web_search_20260209", name: "web_search", max_uses: searches }] : undefined,
        output_config: { effort: "medium", format: schema && betaZodOutputFormat(schema) },
        messages,
      })
      .finalMessage();

    const u = message.usage;
    usd +=
      (u.input_tokens * model.input +
        u.output_tokens * model.output +
        (u.cache_read_input_tokens ?? 0) * model.cacheRead +
        (u.cache_creation_input_tokens ?? 0) * model.cacheWrite) /
        1e6 +
      (u.server_tool_use?.web_search_requests ?? 0) * SEARCH_PRICE;

    logCall(label, 1, u.server_tool_use?.web_search_requests, u.output_tokens);
    if (message.stop_reason === "refusal") throw new Error("Claude declined to write this edition.");
    if (message.stop_reason !== "pause_turn") {
      return { text: message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join(""), usd };
    }
    // Long web searches can pause; send the partial turn back so Claude continues.
    messages.push({ role: "assistant", content: message.content });
  }
}

async function askClaudeCode(prompt: string, { label, model, searches, schema }: Options) {
  const args = [
    "-p",
    prompt,
    "--output-format",
    "json",
    "--model",
    MODELS[model].alias,
    "--effort",
    "medium",
    "--no-session-persistence",
  ];
  // Claude Code has no limit on searches: the prompt asks for at most `searches`.
  args.push("--tools", searches ? "WebSearch,WebFetch" : "");
  if (searches) args.push("--allowedTools", "WebSearch,WebFetch");
  if (schema) args.push("--json-schema", JSON.stringify(z.toJSONSchema(schema, { target: "draft-07" })));

  // Without an API key in its environment, Claude Code uses your subscription login.
  // It runs in a temp folder so this repo's CLAUDE.md doesn't end up in the prompt.
  const { ANTHROPIC_API_KEY, ...env } = process.env;
  const run = promisify(execFile)("claude", args, { cwd: tmpdir(), env, maxBuffer: 50_000_000 });
  run.child.stdin?.end(); // nothing to read from stdin
  const { stdout } = await run;

  const result = JSON.parse(stdout);
  if (result.is_error) throw new Error(`Claude Code failed: ${result.result}`);
  // Claude Code runs web searches through a helper model, so count them across every model it used.
  const searched = Object.values(result.modelUsage as Record<string, { webSearchRequests?: number }>).reduce(
    (sum, m) => sum + (m.webSearchRequests ?? 0),
    0,
  );
  logCall(label, result.num_turns, searched, result.usage.output_tokens);
  // total_cost_usd is what the run would cost on the API. Your subscription covers it.
  return { text: schema ? JSON.stringify(result.structured_output) : result.result, usd: result.total_cost_usd };
}

// One line per Claude call, to see where the time goes: more turns, searches and output take longer.
function logCall(label: string, turns: number, searches = 0, outputTokens = 0) {
  console.log(`  ${label}: ${turns} turns, ${searches} web searches, ${outputTokens} tokens written`);
}
