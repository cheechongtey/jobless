import { GoogleGenAI } from '@google/genai';

import { env } from '@/shared/lib/env';

let singleton: GoogleGenAI | null = null;

export function geminiClient() {
  if (singleton) return singleton;
  singleton = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return singleton;
}
