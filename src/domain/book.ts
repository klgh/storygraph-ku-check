export interface BookIdentity {
  title: string;
  author: string;
  isbn?: string;
  storygraphUrl: string;
}

export type KuStatus =
  | "AVAILABLE"
  | "NOT_DETECTED"
  | "UNCERTAIN"
  | "NO_MATCH"
  | "TIMED_OUT"
  | "CHECKING";

export interface KuCheckResult {
  book: BookIdentity;
  status: KuStatus;
  amazonUrl?: string;
  matchedTitle?: string;
  evidence: string[];
  checkedAt: number;
}
