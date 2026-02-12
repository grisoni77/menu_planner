import type { LanguageModel } from "ai";

type ModelOption = {
  id: string;
  label: string;
};

type ProviderConfig = {
  label: string;
  envKey: string;
  models: ModelOption[];
};

export const AI_PROVIDERS: Record<string, ProviderConfig> = {
  groq: {
    label: "Groq",
    envKey: "GROQ_API_KEY",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (fast)" },
    ],
  },
  openai: {
    label: "OpenAI",
    envKey: "OPENAI_API_KEY",
    models: [
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini" },
    ],
  },
};

export type AvailableProvider = {
  id: string;
  label: string;
  models: ModelOption[];
};

/** Returns only providers whose API key is configured in env. Server-side only. */
export function getAvailableProviders(): AvailableProvider[] {
  return Object.entries(AI_PROVIDERS)
    .filter(([, config]) => !!process.env[config.envKey])
    .map(([id, config]) => ({
      id,
      label: config.label,
      models: config.models,
    }));
}

/** Creates an AI SDK model instance via dynamic import. */
export async function createModel(providerId: string, modelId: string): Promise<LanguageModel> {
  switch (providerId) {
    case "groq": {
      const { createGroq } = await import("@ai-sdk/groq");
      return createGroq()(modelId);
    }
    case "openai": {
      const { createOpenAI } = await import("@ai-sdk/openai");
      return createOpenAI()(modelId);
    }
    default:
      throw new Error(`Provider "${providerId}" non supportato.`);
  }
}
