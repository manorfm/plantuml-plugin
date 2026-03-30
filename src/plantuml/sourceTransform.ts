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

/**
 * Insere o préâmbulo visual do plugin **depois** de `!theme …` (quando existe logo após `@startuml`),
 * para que `!theme plain` não anule as cores injectadas. Se não houver `!theme` no bloco, insere
 * logo após a linha `@startuml`.
 */
export function applyVisualPreambleAfterTheme(source: string, preamble: string): string {
  const p = preamble.trim();
  if (!p) {
    return source;
  }
  const startIdx = source.search(/@startuml\b/i);
  if (startIdx < 0) {
    return `${p}\n${source}`;
  }
  const rest = source.slice(startIdx);
  const themeLine = rest.match(
    /^@startuml[^\r\n]*\r?\n(?:\s*'[^\r\n]*\r?\n|\s*\r?\n)*\s*!theme\s+[^\r\n]+\r?\n/i
  );
  if (themeLine) {
    const insertPos = startIdx + themeLine[0].length;
    return source.slice(0, insertPos) + p + "\n" + source.slice(insertPos);
  }
  const afterStart = rest.match(/^@startuml[^\r\n]*\r?\n/i);
  if (afterStart) {
    const insertPos = startIdx + afterStart[0].length;
    return source.slice(0, insertPos) + p + "\n" + source.slice(insertPos);
  }
  return `${p}\n${source}`;
}
