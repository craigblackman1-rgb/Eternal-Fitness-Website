/**
 * AI client — supports Anthropic Claude and OpenRouter (OpenAI-compatible).
 * Tries OpenRouter first (OPENROUTER_API_KEY), then Claude (ANTHROPIC_API_KEY),
 * then returns null for template-only fallback.
 */

export interface AiConfig {
  provider: "openrouter" | "claude" | null;
  model: string;
}

export function getAiConfig(): AiConfig {
  if (process.env.OPENROUTER_API_KEY) {
    return {
      provider: "openrouter",
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
    };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: "claude",
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    };
  }
  return { provider: null, model: "" };
}

export interface ChatRequest {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

export async function aiChat(req: ChatRequest): Promise<string | null> {
  const config = getAiConfig();
  if (!config.provider) return null;

  if (config.provider === "openrouter") {
    return openRouterChat(config.model, req);
  }

  return claudeChat(config.model, req);
}

async function openRouterChat(
  model: string,
  req: ChatRequest,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY!;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://eternal-fitness.co.uk",
      "X-Title": "Eternal Fitness",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: req.system },
        { role: "user", content: req.user },
      ],
      max_tokens: req.maxTokens ?? 4000,
      temperature: req.temperature ?? 0.5,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter error (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter returned empty response");
  return content;
}

async function claudeChat(
  model: string,
  req: ChatRequest,
): Promise<string> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const response = await client.messages.create({
    model,
    max_tokens: req.maxTokens ?? 4000,
    system: req.system,
    messages: [{ role: "user", content: req.user }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  if (!text) throw new Error("Claude returned empty response");
  return text;
}
