import type { BookIdentity, KuCheckResult } from "../domain/book";

export type ExtensionMessage =
  | { type: "CHECK_BOOK"; payload: BookIdentity }
  | { type: "GET_AMAZON_CHECK" }
  | { type: "GET_CHECK_RESULT"; checkId: string }
  | { type: "AMAZON_RESULT"; payload: KuCheckResult; checkId: string }
  | { type: "KU_RESULT"; payload: KuCheckResult; checkId: string };

export interface PendingCheck {
  sourceTabId: number;
  amazonTabId?: number;
  book: BookIdentity;
  createdAt: number;
}
