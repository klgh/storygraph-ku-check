import type { BookIdentity, KuCheckResult } from "../domain/book";
import { normalizeText } from "../domain/normalize";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function resultCacheKey(book: BookIdentity): string {
  return `result:v6:${normalizeText(book.title)}:${normalizeText(book.author)}`;
}

export async function getCachedResult(book: BookIdentity): Promise<KuCheckResult | null> {
  const key = resultCacheKey(book);
  const values = await chrome.storage.local.get(key);
  const result = values[key] as KuCheckResult | undefined;

  if (!result) return null;
  if (Date.now() - result.checkedAt <= CACHE_TTL_MS) return result;

  await chrome.storage.local.remove(key);
  return null;
}

export async function setCachedResult(result: KuCheckResult): Promise<void> {
  if (result.status === "TIMED_OUT") return;
  await chrome.storage.local.set({ [resultCacheKey(result.book)]: result });
}
