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
      model: process.env.OPENROUTER_MODEL || "poolside/laguna-m.1:free",
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

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  system: string;
  user?: string;
  messages?: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}

function toMessages(req: ChatRequest): ChatMessage[] {
  return req.messages ?? [{ role: "user", content: req.user ?? "" }];
}

export async function aiChat(req: ChatRequest): Promise<string | null> {
  const config = getAiConfig();
  if (!config.provider) return null;

  if (config.provider === "openrouter") {
    return openRouterChat(config.model, req);
  }

  return claudeChat(config.model, req);
}

export async function aiChatStream(req: ChatRequest): Promise<ReadableStream<Uint8Array> | null> {
  const config = getAiConfig();
  if (!config.provider) return null;

  if (config.provider === "openrouter") {
    return openRouterChatStream(config.model, req);
  }

  return claudeChatStream(config.model, req);
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
        ...toMessages(req),
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

async function openRouterChatStream(
  model: string,
  req: ChatRequest,
): Promise<ReadableStream<Uint8Array>> {
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
        ...toMessages(req),
      ],
      max_tokens: req.maxTokens ?? 4000,
      temperature: req.temperature ?? 0.5,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter error (${res.status}): ${text.slice(0, 300)}`);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = res.body.getReader();

  return new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // skip malformed SSE chunk
            }
          }
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`\n\n[Error: ${err instanceof Error ? err.message : "stream failed"}]`));
      } finally {
        controller.close();
      }
    },
  });
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
    messages: toMessages(req),
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  if (!text) throw new Error("Claude returned empty response");
  return text;
}

async function claudeChatStream(
  model: string,
  req: ChatRequest,
): Promise<ReadableStream<Uint8Array>> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const stream = client.messages.stream({
    model,
    max_tokens: req.maxTokens ?? 4000,
    system: req.system,
    messages: toMessages(req),
  });

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`\n\n[Error: ${err instanceof Error ? err.message : "stream failed"}]`));
      } finally {
        controller.close();
      }
    },
  });
}
