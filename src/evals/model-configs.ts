// Model configuration for testing different AI providers/models

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export interface ModelConfig {
  name: string;
  provider: "openai" | "anthropic";
  model: string;
  temperature?: number;
  maxTokens?: number;
}

// Cache for dynamically fetched models
let cachedOpenAIModels: ModelConfig[] | null = null;
let cachedAnthropicModels: ModelConfig[] | null = null;

/**
 * Fetch available OpenAI models from their API
 */
export async function fetchOpenAIModels(): Promise<ModelConfig[]> {
  if (cachedOpenAIModels) {
    return cachedOpenAIModels;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OPENAI_API_KEY not found, using hardcoded models");
    return getHardcodedOpenAIModels();
  }

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.models.list();

    // Filter for chat completion models that are suitable for our use case
    const chatModels = response.data.filter(
      (model) =>
        model.id.includes("gpt-") &&
        !model.id.includes("instruct") &&
        !model.id.includes("ada") &&
        !model.id.includes("babbage") &&
        !model.id.includes("curie") &&
        !model.id.includes("davinci-002")
    );

    cachedOpenAIModels = chatModels.map((model) => ({
      name: formatModelName(model.id),
      provider: "openai" as const,
      model: model.id,
      temperature: 0.1,
      maxTokens: 500,
    }));

    return cachedOpenAIModels;
  } catch (error) {
    console.error("Failed to fetch OpenAI models:", error);
    return getHardcodedOpenAIModels();
  }
}

/**
 * Fetch available Anthropic models (currently hardcoded as they don't have a public models API)
 */
export async function fetchAnthropicModels(): Promise<ModelConfig[]> {
  if (cachedAnthropicModels) {
    return cachedAnthropicModels;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not found, using hardcoded models");
    return getHardcodedAnthropicModels();
  }

  // Anthropic doesn't have a public models API yet, so we use hardcoded models
  // but validate that the API key works
  try {
    const anthropic = new Anthropic({ apiKey });
    // Test the API key with a minimal request
    await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1,
      messages: [{ role: "user", content: "Hi" }],
    });

    cachedAnthropicModels = getHardcodedAnthropicModels();
    return cachedAnthropicModels;
  } catch (error) {
    console.error("Failed to validate Anthropic API key:", error);
    return getHardcodedAnthropicModels();
  }
}

/**
 * Get all available models from both providers
 */
export async function fetchAllModels(): Promise<ModelConfig[]> {
  const [openaiModels, anthropicModels] = await Promise.all([fetchOpenAIModels(), fetchAnthropicModels()]);

  return [...openaiModels, ...anthropicModels];
}

/**
 * Hardcoded OpenAI models as fallback
 */
function getHardcodedOpenAIModels(): ModelConfig[] {
  return [
    {
      name: "GPT-4.1",
      provider: "openai",
      model: "gpt-4.1",
      temperature: 0.1,
      maxTokens: 500,
    },
    {
      name: "GPT-4.1 Mini",
      provider: "openai",
      model: "gpt-4.1-mini",
      temperature: 0.1,
      maxTokens: 500,
    },
    {
      name: "GPT-4.1 Nano",
      provider: "openai",
      model: "gpt-4.1-nano",
      temperature: 0.1,
      maxTokens: 500,
    },
    {
      name: "O3",
      provider: "openai",
      model: "o3",
      temperature: 0.1,
      maxTokens: 500,
    },
    {
      name: "O4-Mini",
      provider: "openai",
      model: "o4-mini",
      temperature: 0.1,
      maxTokens: 500,
    },
    {
      name: "GPT-4o",
      provider: "openai",
      model: "gpt-4o",
      temperature: 0.1,
      maxTokens: 500,
    },
    {
      name: "GPT-4o Mini",
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.1,
      maxTokens: 500,
    },
    {
      name: "GPT-3.5 Turbo",
      provider: "openai",
      model: "gpt-3.5-turbo",
      temperature: 0.1,
      maxTokens: 500,
    },
  ];
}

/**
 * Hardcoded Anthropic models
 */
function getHardcodedAnthropicModels(): ModelConfig[] {
  return [
    {
      name: "Claude 4 Opus",
      provider: "anthropic",
      model: "claude-opus-4-20250514",
      temperature: 0.1,
      maxTokens: 500,
    },
    {
      name: "Claude 4 Sonnet",
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      temperature: 0.1,
      maxTokens: 500,
    },
    {
      name: "Claude 3.7 Sonnet",
      provider: "anthropic",
      model: "claude-3-7-sonnet-20250219",
      temperature: 0.1,
      maxTokens: 500,
    },
    {
      name: "Claude 3.5 Sonnet",
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      temperature: 0.1,
      maxTokens: 500,
    },
    {
      name: "Claude 3.5 Sonnet (June)",
      provider: "anthropic",
      model: "claude-3-5-sonnet-20240620",
      temperature: 0.1,
      maxTokens: 500,
    },
    {
      name: "Claude 3.5 Haiku",
      provider: "anthropic",
      model: "claude-3-5-haiku-20241022",
      temperature: 0.1,
      maxTokens: 500,
    },
    {
      name: "Claude 3 Opus",
      provider: "anthropic",
      model: "claude-3-opus-20240229",
      temperature: 0.1,
      maxTokens: 500,
    },
    {
      name: "Claude 3 Haiku",
      provider: "anthropic",
      model: "claude-3-haiku-20240307",
      temperature: 0.1,
      maxTokens: 500,
    },
  ];
}

/**
 * Format model ID into a readable name
 */
function formatModelName(modelId: string): string {
  return modelId
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace(/Gpt/g, "GPT")
    .replace(/\d{8}/g, "") // Remove date suffixes
    .trim();
}

/**
 * Get model config by name (searches dynamically fetched models)
 */
export async function getModelConfig(name: string): Promise<ModelConfig | undefined> {
  const allModels = await fetchAllModels();
  return allModels.find((config) => config.name === name);
}

/**
 * Get all model names (from dynamically fetched models)
 */
export async function getAllModelNames(): Promise<string[]> {
  const allModels = await fetchAllModels();
  return allModels.map((config) => config.name);
}

/**
 * Clear model cache (useful for testing or when API keys change)
 */
export function clearModelCache(): void {
  cachedOpenAIModels = null;
  cachedAnthropicModels = null;
}
