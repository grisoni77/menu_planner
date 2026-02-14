import type { LanguageModel } from "ai";
import {SharedV3ProviderOptions} from "@ai-sdk/provider";

type ModelOption = {
  id: string;
  label: string;
  providerOptions?: SharedV3ProviderOptions;
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
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", providerOptions: { groq: { structuredOutputs: false } } },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (fast)", providerOptions: { groq: { structuredOutputs: false }} },
      { id: "openai/gpt-oss-20b", label: "GPT OSS 20B" },
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
  google: {
    label: "Google Gemini",
    envKey: "GOOGLE_GENERATIVE_AI_API_KEY",
    models: [
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    ],
  },
  sambanova: {
    label: "SambaNova",
    envKey: "SAMBANOVA_API_KEY",
    models: [
      { id: "Meta-Llama-3.3-70B-Instruct", label: "Llama 3.3 70B" },
      { id: "gpt-oss-120b", label: "OpenAI GPT OSS 120B" },
    ],
  },
};

export type AvailableProvider = {
  id: string;
  label: string;
  models: ModelOption[];
};

export function getProviderOptions(providerId: string, modelId: string): SharedV3ProviderOptions | undefined {
  return AI_PROVIDERS[providerId]?.models.find((m) => m.id === modelId)?.providerOptions;
}

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
    case "google": {
      const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
      return createGoogleGenerativeAI()(modelId);
    }
    case "sambanova": {
      const { createOpenAI } = await import("@ai-sdk/openai");
      return createOpenAI({
        baseURL: "https://api.sambanova.ai/v1",
        apiKey: process.env.SAMBANOVA_API_KEY,
      })(modelId);
    }
    default:
      throw new Error(`Provider "${providerId}" non supportato.`);
  }
}
