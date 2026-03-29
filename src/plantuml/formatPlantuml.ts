/**
 * Pure PlantUML source normalisation: trim line ends, heuristic indent, final newline.
 */

export type PlantumlFormatOptions = {
  tabSize: number;
  insertSpaces: boolean;
};

const OPEN_BLOCK_KW =
  /^(alt|opt|loop|par|group|namespace|package|partition|box)\b/i;

export function formatPlantumlSource(
  text: string,
  options: PlantumlFormatOptions
): string {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const raw = text.split(/\r?\n/).map((line) => line.trimEnd());
  const tab = Math.max(1, Math.floor(options.tabSize) || 4);
  const unit = options.insertSpaces ? " ".repeat(tab) : "\t";

  let depth = 0;
  const out: string[] = [];

  for (const line of raw) {
    const t = line.trim();
    if (t.length === 0) {
      out.push("");
      continue;
    }

    if (/^@start/i.test(t)) {
      depth = 0;
      out.push(t);
      continue;
    }

    if (/^@end/i.test(t)) {
      depth = 0;
      out.push(t);
      continue;
    }

    const isElse = /^else\b/i.test(t);
    if (t === "}" || /^end\s*$/i.test(t)) {
      depth = Math.max(0, depth - 1);
    } else if (isElse) {
      depth = Math.max(0, depth - 1);
    }

    out.push(unit.repeat(depth) + t);

    if (/\{\s*$/.test(t)) {
      depth += 1;
    } else if (OPEN_BLOCK_KW.test(t) && !/\bend\b/i.test(t)) {
      depth += 1;
    } else if (isElse) {
      depth += 1;
    }
  }

  let result = out.join(eol);
  const hasNl = eol === "\r\n" ? /\r\n$/.test(result) : /\n$/.test(result);
  if (!hasNl) {
    result += eol;
  }
  return result;
}
