import { GoogleGenAI, type GenerateContentConfig } from '@google/genai';

/**
 * Verified model IDs in order of priority:
 * 1. gemini-3.6-flash: Primary fast, capable model
 * 2. gemini-3.1-flash-lite: High-availability low-latency fallback
 * 3. gemini-flash-latest: Dynamic alias
 * 4. gemini-3.7-flash: Deep reasoning fallback
 */
export const VERIFIED_FALLBACK_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
] as const;

export interface FallbackGenerationResult {
  text: string;
  modelUsed: string;
  attemptCount: number;
}

/**
 * Checks whether an error is transient/recoverable (e.g. rate limit, server overload)
 * and should trigger a fallback model, versus a non-recoverable error (e.g. bad request,
 * auth rejection, safety violation) which must fail immediately without retrying.
 */
export function isRecoverableGeminiError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const errStr = String(error);
  const status = (error as { status?: number; statusCode?: number; code?: number | string })
    .status ||
    (error as { status?: number; statusCode?: number; code?: number | string }).statusCode ||
    (error as { status?: number; statusCode?: number; code?: number | string }).code;

  // Non-recoverable status codes: Bad Request (400), Unauthorized (401), Forbidden (403)
  if (status === 400 || status === 'INVALID_ARGUMENT') return false;
  if (status === 401 || status === 'UNAUTHENTICATED') return false;
  if (status === 403 || status === 'PERMISSION_DENIED') return false;

  // Content safety blocks must not be retried across other models
  if (errStr.includes('SAFETY') || errStr.includes('PROHIBITED_CONTENT') || errStr.includes('BLOCKED')) {
    return false;
  }

  // Recoverable status codes: Rate Limits (429), Temporary Unavailable (503), Internal Server Error (500), Not Found / Regional model rollout (404), Gateway Timeout (504)
  if (
    status === 429 ||
    status === 'RESOURCE_EXHAUSTED' ||
    status === 503 ||
    status === 'UNAVAILABLE' ||
    status === 500 ||
    status === 'INTERNAL' ||
    status === 502 ||
    status === 504 ||
    status === 404 ||
    status === 'NOT_FOUND'
  ) {
    return true;
  }

  // Common transient network/timeout error signatures
  if (
    errStr.includes('429') ||
    errStr.includes('RESOURCE_EXHAUSTED') ||
    errStr.includes('503') ||
    errStr.includes('UNAVAILABLE') ||
    errStr.includes('500') ||
    errStr.includes('INTERNAL') ||
    errStr.includes('timeout') ||
    errStr.includes('network') ||
    errStr.includes('overloaded') ||
    errStr.includes('404')
  ) {
    return true;
  }

  return false;
}

/**
 * Executes generateContent with an automated fallback ladder.
 * - Fails fast with clean error on non-recoverable errors (e.g. 400 bad requests).
 * - Attempts successive verified models when encountering 429, 503, 500, 404, or transient timeouts.
 */
export async function generateContentWithFallback(
  ai: GoogleGenAI,
  prompt: string,
  config?: GenerateContentConfig
): Promise<FallbackGenerationResult> {
  const models = VERIFIED_FALLBACK_MODELS;
  let lastError: unknown = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });

      const text = response.text || '';
      return {
        text,
        modelUsed: model,
        attemptCount: i + 1,
      };
    } catch (err: unknown) {
      lastError = err;
      const isRecoverable = isRecoverableGeminiError(err);

      console.warn(
        `[Gemini Resilience] Model ${model} failed (attempt ${i + 1}/${models.length}). Recoverable: ${isRecoverable}`,
        err instanceof Error ? err.message : err
      );

      // If error is not recoverable (e.g., 400 Bad Request, invalid argument, safety block), do NOT retry
      if (!isRecoverable) {
        throw err;
      }

      // If this is the last model in the ladder, loop terminates and throws below
    }
  }

  throw lastError || new Error('All models in fallback ladder were exhausted.');
}
