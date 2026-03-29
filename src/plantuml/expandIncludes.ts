import { createHash } from "node:crypto";
import * as path from "path";
import * as vscode from "vscode";

const MAX_DEPTH = 32;

const EXPAND_CACHE_MAX = 16;

const expandResultCache = new Map<
  string,
  { text: string; mtimes: Map<string, number> }
>();

export type ExpandIncludesOptions = {
  /** Filled with `fsPath -> mtime` for every included file read from disk. */
  recordMtimes?: Map<string, number>;
};

function expandCacheKey(fsPath: string, source: string): string {
  return `${fsPath}\0${createHash("sha256").update(source, "utf8").digest("hex")}`;
}

/**
 * Cached `!include` expansion: same source reuses the result until an included file’s mtime changes.
 */
export async function expandPlantUmlIncludesCached(
  documentUri: vscode.Uri,
  source: string
): Promise<{ ok: true; text: string } | { ok: false; message: string }> {
  if (documentUri.scheme !== "file") {
    return expandPlantUmlIncludes(documentUri, source);
  }
  const key = expandCacheKey(documentUri.fsPath, source);
  const hit = expandResultCache.get(key);
  if (hit) {
    let valid = true;
    for (const [p, t] of hit.mtimes) {
      try {
        const st = await vscode.workspace.fs.stat(vscode.Uri.file(p));
        if (st.mtime !== t) {
          valid = false;
          break;
        }
      } catch {
        valid = false;
        break;
      }
    }
    if (valid) {
      expandResultCache.delete(key);
      expandResultCache.set(key, hit);
      return { ok: true, text: hit.text };
    }
    expandResultCache.delete(key);
  }

  const recordMtimes = new Map<string, number>();
  const result = await expandPlantUmlIncludes(documentUri, source, 0, new Set(), {
    recordMtimes,
  });
  if (!result.ok) {
    return result;
  }
  if (expandResultCache.size >= EXPAND_CACHE_MAX) {
    const first = expandResultCache.keys().next().value as string | undefined;
    if (first !== undefined) {
      expandResultCache.delete(first);
    }
  }
  expandResultCache.set(key, { text: result.text, mtimes: recordMtimes });
  return result;
}

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
  seen: Set<string> = new Set(),
  options?: ExpandIncludesOptions
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
        if (options?.recordMtimes) {
          try {
            const st = await vscode.workspace.fs.stat(target);
            options.recordMtimes.set(target.fsPath, st.mtime);
          } catch {
            /* still try read */
          }
        }
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
        seen,
        options
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
