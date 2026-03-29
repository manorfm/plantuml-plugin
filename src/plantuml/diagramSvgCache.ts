import { createHash } from "node:crypto";

const MAX_ENTRIES = 32;

const store = new Map<
  string,
  | { kind: "svg"; svg: string }
  | { kind: "err"; message: string }
>();

export function diagramCacheKey(serverUrl: string, diagramBody: string): string {
  return createHash("sha256")
    .update(serverUrl, "utf8")
    .update("\0")
    .update(diagramBody, "utf8")
    .digest("hex");
}

export function getCachedDiagram(
  key: string
):
  | { kind: "svg"; svg: string }
  | { kind: "err"; message: string }
  | undefined {
  const hit = store.get(key);
  if (!hit) {
    return undefined;
  }
  store.delete(key);
  store.set(key, hit);
  return hit;
}

export function setCachedDiagram(
  key: string,
  value:
    | { kind: "svg"; svg: string }
    | { kind: "err"; message: string }
): void {
  if (store.has(key)) {
    store.delete(key);
  } else if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value as string | undefined;
    if (oldest !== undefined) {
      store.delete(oldest);
    }
  }
  store.set(key, value);
}
