import OpenAI from "openai";

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "llama-3.1-8b-instant";

let client: OpenAI | null = null;

function getClient(): OpenAI | null {
  const apiKey = process.env.OpenAI_apiKey;
  if (!apiKey) {
    return null;
  }

  if (!client) {
    client = new OpenAI({ baseURL: process.env.OpenAI_BaseURL, apiKey: apiKey });
  }

  return client;
}

export async function generateChangelogSummaryWithOpenAI(input: {
  releaseName: string;
  tagName: string;
  categoryLabel: string;
  body: string;
}): Promise<string | null> {
  const openai = getClient();
  if (!openai) {
    return null;
  }

  const completion = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.2,
    max_tokens: 120,
    messages: [
      {
        role: "system",
        content:
          "You generate concise product changelog summaries. Keep output to 1-2 sentences, plain text only, no markdown.",
      },
      {
        role: "user",
        content: [
          `Category: ${input.categoryLabel}`,
          `Release: ${input.releaseName}`,
          `Tag: ${input.tagName}`,
          "Write a concise changelog description highlighting what changed and any warnings.",
          "Do not mention that you are an AI.",
          "Release notes:",
          input.body,
        ].join("\n\n"),
      },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() || null;
}
