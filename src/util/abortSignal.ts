/**
 * Combina um AbortSignal externo com um timeout (AbortSignal.timeout).
 * Se `timeoutMs` for inválido ou ≤ 0, devolve apenas `signal`.
 */
export function combineWithTimeout(
  signal: AbortSignal | undefined,
  timeoutMs: number
): AbortSignal | undefined {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return signal;
  }
  const timeout = AbortSignal.timeout(timeoutMs);
  if (!signal) {
    return timeout;
  }
  return AbortSignal.any([signal, timeout]);
}
