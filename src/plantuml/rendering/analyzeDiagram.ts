/**
 * Heurística leve sobre o texto PlantUML (antes ou depois do préâmbulo visual).
 * Não garante 100% de precisão — serve para adaptar estilo e layout.
 */
export type DiagramKind =
  | "sequence"
  | "class"
  | "component"
  | "deployment"
  | "activity"
  | "usecase"
  | "state"
  | "object"
  | "other";

export function analyzeDiagramKind(source: string): DiagramKind {
  const s = source.toLowerCase();

  if (
    /(?:^|\n)\s*(?:participant|actor|boundary|control|entity|database|collections)\b/.test(
      s
    ) ||
    /(?:^|\n)\s*create\s/.test(s) ||
    /(?:^|\n)\s*autonumber\b/.test(s) ||
    /(?:^|\n)\s*(?:alt|else|end|loop|opt|par|break|critical|group)\b/.test(s)
  ) {
    return "sequence";
  }

  /* Antes de `class`: diagramas com `<<stereotype>>` e `package` não são necessariamente classe. */
  if (/\bcomponent\b/.test(s) || /(?:^|\n)\s*@startuml[^\n]*\n[^\n]*\[\s*\w+/.test(s)) {
    return "component";
  }

  if (
    /(?:^|\n)\s*(?:abstract\s+class|class|interface|enum|package)\b/.test(s) ||
    /\w+\s+:\s+\w+/.test(s)
  ) {
    return "class";
  }

  if (/(?:^|\n)\s*node\b|deployment/.test(s) || /\bartifact\b/.test(s)) {
    return "deployment";
  }

  if (/(?:^|\n)\s*start\b|(?:^|\n)\s*:\w+;/.test(s) && /(?:^|\n)\s*stop\b/.test(s)) {
    return "activity";
  }

  if (/(?:^|\n)\s*actor\b|usecase|rectangle\s/.test(s) && /use\s*case/i.test(s)) {
    return "usecase";
  }

  if (/(?:^|\n)\s*\[\*\]\s*-->/.test(s) || /\bstate\s+"[^"]+"/.test(s)) {
    return "state";
  }

  if (/(?:^|\n)\s*object\b/.test(s)) {
    return "object";
  }

  return "other";
}
