/**
 * Model pricing data for AI evaluation cost-effectiveness calculations
 * 
 * This file contains hardcoded pricing data for OpenAI and Anthropic models.
 * Pricing is current as of January 2025 and may change.
 */

export interface ModelPricing {
  inputPricePerMToken: number;  // Price per million tokens
  outputPricePerMToken: number; // Price per million tokens
}

// Model pricing lookup by API name
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // OpenAI Models (Updated January 2025)
  'gpt-4.1': {
    inputPricePerMToken: 2.00,
    outputPricePerMToken: 8.00,
  },
  'gpt-4.1-mini': {
    inputPricePerMToken: 0.40,
    outputPricePerMToken: 1.60,
  },
  'gpt-4.1-nano': {
    inputPricePerMToken: 0.10,
    outputPricePerMToken: 0.40,
  },
  'o3': {
    inputPricePerMToken: 2.00,
    outputPricePerMToken: 8.00,
  },
  'o4-mini': {
    inputPricePerMToken: 1.10,
    outputPricePerMToken: 4.40,
  },
  'gpt-4o': {
    inputPricePerMToken: 2.50,
    outputPricePerMToken: 10.00,
  },
  'gpt-4o-mini': {
    inputPricePerMToken: 0.15,
    outputPricePerMToken: 0.60,
  },
  'gpt-3.5-turbo': {
    inputPricePerMToken: 0.50,
    outputPricePerMToken: 1.50,
  },

  // Anthropic Models (Updated January 2025)
  'claude-opus-4-20250514': {
    inputPricePerMToken: 15.00,
    outputPricePerMToken: 75.00,
  },
  'claude-sonnet-4-20250514': {
    inputPricePerMToken: 3.00,
    outputPricePerMToken: 15.00,
  },
  'claude-3-7-sonnet-20250219': {
    inputPricePerMToken: 3.00,
    outputPricePerMToken: 15.00,
  },
  'claude-3-5-sonnet-20241022': {
    inputPricePerMToken: 3.00,
    outputPricePerMToken: 15.00,
  },
  'claude-3-5-sonnet-20240620': {
    inputPricePerMToken: 3.00,
    outputPricePerMToken: 15.00,
  },
  'claude-3-5-haiku-20241022': {
    inputPricePerMToken: 0.80,
    outputPricePerMToken: 4.00,
  },
  'claude-3-opus-20240229': {
    inputPricePerMToken: 15.00,
    outputPricePerMToken: 75.00,
  },
  'claude-3-haiku-20240307': {
    inputPricePerMToken: 0.25,
    outputPricePerMToken: 1.25,
  },
};

/**
 * Get pricing for a model by API name
 */
export function getModelPricing(apiName: string): ModelPricing | null {
  return MODEL_PRICING[apiName] || null;
}

/**
 * Calculate cost for a given number of tokens
 */
export function calculateCost(
  modelApiName: string,
  inputTokens: number,
  outputTokens: number
): { inputCost: number; outputCost: number; totalCost: number } | null {
  const pricing = getModelPricing(modelApiName);
  if (!pricing) return null;

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPricePerMToken;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPricePerMToken;
  const totalCost = inputCost + outputCost;

  return { inputCost, outputCost, totalCost };
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  if (price < 0.01) {
    return `$${price.toFixed(4)}`;
  }
  return `$${price.toFixed(2)}`;
}
