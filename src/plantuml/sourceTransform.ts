/**
 * Texto inserido **antes** do diagrama (após expansão de `!include`), útil para
 * `!theme`, `skinparam` globais, etc.
 */
export function applyDiagramPreamble(
  source: string,
  preamble: string | undefined
): string {
  const p = preamble?.trim();
  if (!p) {
    return source;
  }
  return `${p}\n${source}`;
}
