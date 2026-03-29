import * as path from "path";
import * as vscode from "vscode";

const MAX_DEPTH = 32;

/**
 * Extrai o caminho de uma linha `!include` (não processa `!includeurl`).
 * Suporta: `!include f.puml`, `!include <f.puml>`, `!include "a b.puml"`.
 */
export function parseIncludeLine(line: string): string | null {
  const lead = line.trimStart();
  if (/^!includeurl\b/i.test(lead)) {
    return null;
  }
  if (!/^\s*!include\s+/i.test(line)) {
    return null;
  }

  const after = line.replace(/^\s*!include\s+/i, "");
  let rest = after.trim();
  if (rest.length === 0) {
    return null;
  }

  if (rest.startsWith("<")) {
    const end = rest.indexOf(">", 1);
    if (end === -1) {
      return null;
    }
    return rest.slice(1, end).trim();
  }

  if (rest.startsWith('"')) {
    const end = rest.indexOf('"', 1);
    if (end === -1) {
      return null;
    }
    return rest.slice(1, end);
  }

  if (rest.startsWith("'")) {
    const end = rest.indexOf("'", 1);
    if (end === -1) {
      return null;
    }
    return rest.slice(1, end);
  }

  const token = rest.match(/^(\S+)/);
  return token ? token[1] : null;
}

/**
 * Expande `!include` lendo ficheiros relativos ao diretório do documento.
 * URLs `http(s)` deixam a linha inalterada. Documentos não-`file:` não expandem.
 */
export async function expandPlantUmlIncludes(
  documentUri: vscode.Uri,
  source: string,
  depth = 0,
  seen: Set<string> = new Set()
): Promise<{ ok: true; text: string } | { ok: false; message: string }> {
  if (documentUri.scheme !== "file") {
    return { ok: true, text: source };
  }

  const key = documentUri.fsPath;
  if (depth > MAX_DEPTH) {
    return {
      ok: false,
      message: `!include: maximum depth (${MAX_DEPTH}) exceeded.`,
    };
  }
  if (seen.has(key)) {
    return { ok: false, message: `!include cycle: ${key}` };
  }
  seen.add(key);

  try {
    const baseDir = vscode.Uri.file(path.dirname(documentUri.fsPath));
    const lines = source.split(/\r?\n/);
    const out: string[] = [];

    for (const line of lines) {
      const incPath = parseIncludeLine(line);
      if (incPath === null) {
        out.push(line);
        continue;
      }
      if (/^https?:\/\//i.test(incPath)) {
        out.push(line);
        continue;
      }

      let target: vscode.Uri;
      try {
        target = path.isAbsolute(incPath)
          ? vscode.Uri.file(incPath)
          : vscode.Uri.joinPath(baseDir, incPath.replace(/\\/g, "/"));
      } catch (e) {
        return {
          ok: false,
          message: `!include "${incPath}": ${e instanceof Error ? e.message : String(e)}`,
        };
      }

      let data: Uint8Array;
      try {
        data = await vscode.workspace.fs.readFile(target);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return {
          ok: false,
          message: `!include "${incPath}" (${target.fsPath}): ${msg}`,
        };
      }

      const inner = Buffer.from(data).toString("utf8");
      const expanded = await expandPlantUmlIncludes(
        target,
        inner,
        depth + 1,
        seen
      );
      if (!expanded.ok) {
        return expanded;
      }
      out.push(expanded.text);
    }

    return { ok: true, text: out.join("\n") };
  } finally {
    seen.delete(key);
  }
}
