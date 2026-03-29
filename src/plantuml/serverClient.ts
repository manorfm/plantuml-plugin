import * as plantumlEncoder from "plantuml-encoder";
import { combineWithTimeout } from "../util/abortSignal";

export type FetchSvgResult =
  | { kind: "svg"; svg: string }
  | { kind: "error"; message: string; status?: number };

export type FetchPngResult =
  | { kind: "png"; data: Uint8Array }
  | { kind: "error"; message: string; status?: number };

/**
 * URLs GET acima deste tamanho usam POST com corpo em texto (plantuml-server / Jetty).
 * Valor abaixo do limite teórico: URLs GET muito longas podem devolver 404/414; POST para
 * `/svg` ou `/png` evita o problema (ver plantuml-server: mapeamentos `/svg/*`, `/png/*`).
 */
export const MAX_PLANTUML_GET_URL_LENGTH = 4096;

/**
 * URL base por defeito: servidor HTTP oficial (pré-visualização sem Docker local).
 * O texto do diagrama é enviado a esse anfitrião; para dados sensíveis ou offline,
 * configure `plantumlViewer.serverUrl` para um servidor local (ex.: Docker em 127.0.0.1).
 */
export const DEFAULT_PLANTUML_SERVER_URL =
  "https://www.plantuml.com/plantuml";

/**
 * Normaliza URL base do servidor PlantUML (sem barra final).
 * Não altere o caminho (ex.: `https://www.plantuml.com/plantuml` deve manter `/plantuml`).
 */
export function normalizeServerBaseUrl(raw: string): string {
  let t = raw.trim();
  if (t.length === 0) {
    return DEFAULT_PLANTUML_SERVER_URL;
  }
  return t.replace(/\/+$/, "");
}

export function encodeForPlantumlServer(source: string): string {
  return plantumlEncoder.encode(source);
}

/** URL GET usada para um formato; útil para testes e decisão GET vs POST. */
export function buildPlantumlGetUrl(
  serverBaseUrl: string,
  format: "svg" | "png",
  source: string
): string {
  const base = normalizeServerBaseUrl(serverBaseUrl);
  const encoded = encodeForPlantumlServer(source);
  return `${base}/${format}/${encoded}`;
}

export type FetchSvgOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

/**
 * Obtém o diagrama como SVG a partir do servidor PlantUML.
 * Usa GET com path codificado; se a URL exceder {@link MAX_PLANTUML_GET_URL_LENGTH}, usa POST com texto cru (text/plain).
 */
export async function fetchSvgDiagram(
  serverBaseUrl: string,
  source: string,
  options?: AbortSignal | FetchSvgOptions
): Promise<FetchSvgResult> {
  const opts: FetchSvgOptions =
    options === undefined
      ? {}
      : options instanceof AbortSignal
        ? { signal: options }
        : options;

  const base = normalizeServerBaseUrl(serverBaseUrl);
  const fetchSignal = combineWithTimeout(opts.signal, opts.timeoutMs ?? 0);

  const getUrl = buildPlantumlGetUrl(serverBaseUrl, "svg", source);
  const usePost = getUrl.length > MAX_PLANTUML_GET_URL_LENGTH;

  const postSvg = (): Promise<Response> =>
    fetch(`${base}/svg`, {
      method: "POST",
      signal: fetchSignal,
      headers: {
        Accept: "image/svg+xml,text/plain,*/*",
        "Content-Type": "text/plain; charset=utf-8",
      },
      body: source,
    });

  let res: Response;
  try {
    if (usePost) {
      res = await postSvg();
    } else {
      res = await fetch(getUrl, {
        method: "GET",
        signal: fetchSignal,
        headers: { Accept: "image/svg+xml,text/plain,*/*" },
      });
      if (!res.ok && (res.status === 404 || res.status === 414)) {
        res = await postSvg();
      }
    }
  } catch (e) {
    const msg = formatFetchFailure(e, opts.timeoutMs ?? 0);
    return {
      kind: "error",
      message: `Network error contacting PlantUML server (${base}): ${msg}`,
    };
  }

  const body = await res.text();

  if (!res.ok) {
    return {
      kind: "error",
      status: res.status,
      message: truncate(
        `Server responded ${res.status}: ${stripHtml(body) || body}`,
        4000
      ),
    };
  }

  const trimmed = body.trim();
  if (trimmed.includes("<svg") || trimmed.startsWith("<?xml")) {
    return { kind: "svg", svg: body };
  }

  return {
    kind: "error",
    status: res.status,
    message: truncate(
      `Unexpected server response (not SVG). Start: ${trimmed.slice(0, 500)}`,
      4000
    ),
  };
}

/**
 * Obtém o diagrama como PNG a partir do servidor PlantUML (GET ou POST como em SVG).
 */
export async function fetchPngDiagram(
  serverBaseUrl: string,
  source: string,
  options?: AbortSignal | FetchSvgOptions
): Promise<FetchPngResult> {
  const opts: FetchSvgOptions =
    options === undefined
      ? {}
      : options instanceof AbortSignal
        ? { signal: options }
        : options;

  const base = normalizeServerBaseUrl(serverBaseUrl);
  const fetchSignal = combineWithTimeout(opts.signal, opts.timeoutMs ?? 0);

  const getUrl = buildPlantumlGetUrl(serverBaseUrl, "png", source);
  const usePost = getUrl.length > MAX_PLANTUML_GET_URL_LENGTH;

  const postPng = (): Promise<Response> =>
    fetch(`${base}/png`, {
      method: "POST",
      signal: fetchSignal,
      headers: {
        Accept: "image/png,*/*",
        "Content-Type": "text/plain; charset=utf-8",
      },
      body: source,
    });

  let res: Response;
  try {
    if (usePost) {
      res = await postPng();
    } else {
      res = await fetch(getUrl, {
        method: "GET",
        signal: fetchSignal,
        headers: { Accept: "image/png,*/*" },
      });
      if (!res.ok && (res.status === 404 || res.status === 414)) {
        res = await postPng();
      }
    }
  } catch (e) {
    const msg = formatFetchFailure(e, opts.timeoutMs ?? 0);
    return {
      kind: "error",
      message: `Network error contacting PlantUML server (${base}): ${msg}`,
    };
  }

  const buf = new Uint8Array(await res.arrayBuffer());

  if (!res.ok) {
    const text = new TextDecoder().decode(buf.slice(0, 2000));
    return {
      kind: "error",
      status: res.status,
      message: truncate(
        `Server responded ${res.status}: ${stripHtml(text) || text}`,
        4000
      ),
    };
  }

  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { kind: "png", data: buf };
  }

  const preview = new TextDecoder().decode(buf.slice(0, 500));
  return {
    kind: "error",
    status: res.status,
    message: truncate(
      `Unexpected server response (not PNG). Start: ${preview}`,
      4000
    ),
  };
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(s: string, max: number): string {
  if (s.length <= max) {
    return s;
  }
  return `${s.slice(0, max)}…`;
}

/**
 * Percorre `cause` (undici/Node) para obter códigos como ECONNREFUSED.
 */
export function getUnderlyingFetchErrorCode(e: unknown): string | undefined {
  const seen = new Set<unknown>();
  let cur: unknown = e;
  for (let i = 0; i < 10 && cur !== undefined && cur !== null; i++) {
    if (seen.has(cur)) {
      break;
    }
    seen.add(cur);
    if (typeof cur === "object" && "code" in cur) {
      const c = (cur as { code?: unknown }).code;
      if (typeof c === "string" && c.length > 0) {
        return c;
      }
    }
    const next =
      cur instanceof Error && "cause" in cur
        ? (cur as Error & { cause?: unknown }).cause
        : undefined;
    cur = next;
  }
  return undefined;
}

/**
 * Texto adicional para o utilizador quando o fetch falha (mostrado na Webview).
 */
export function plantumlFetchFailureHint(e: unknown): string {
  const code = getUnderlyingFetchErrorCode(e);
  const msg =
    e instanceof Error ? e.message.toLowerCase() : String(e).toLowerCase();

  if (code === "ECONNREFUSED" || msg.includes("econnrefused")) {
    return (
      "Nothing is accepting connections at that address (PlantUML server stopped, or wrong URL/port). " +
      "Start the server — e.g. docker run -d -p 8080:8080 plantuml/plantuml-server:jetty. " +
      "If port 8080 is taken, map another on the host (e.g. -p 8081:8080) and set " +
      "Settings → PlantUML Viewer → Server URL to http://127.0.0.1:8081 (or your real host/port)."
    );
  }
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return (
      "The host in the URL was not found or DNS failed. Check plantumlViewer.serverUrl."
    );
  }
  if (
    code === "ETIMEDOUT" ||
    code === "UND_ERR_CONNECT_TIMEOUT" ||
    msg.includes("timeout")
  ) {
    return (
      "Connection timed out. Check network, firewall, and that the server is reachable from this environment."
    );
  }
  if (msg.includes("fetch failed") || msg === "failed to fetch") {
    return (
      "\"fetch failed\" on localhost usually means connection refused (server not running), wrong URL, or port in use " +
      "without PlantUML there. Start PlantUML Server; if 8080 is busy, use another Docker port (-p 8081:8080) " +
      "and the same URL in plantumlViewer.serverUrl."
    );
  }
  return "";
}

function formatFetchFailure(e: unknown, timeoutMs?: number): string {
  if (e instanceof Error) {
    const name = (e as { name?: string }).name;
    if (name === "TimeoutError" || name === "AbortError") {
      if (timeoutMs !== undefined && timeoutMs > 0) {
        return `Request canceled (timeout ${timeoutMs} ms).`;
      }
      return "Request canceled.";
    }
    const hint = plantumlFetchFailureHint(e);
    if (hint.length > 0) {
      return `${e.message} — ${hint}`;
    }
    return e.message;
  }
  const hint = plantumlFetchFailureHint(e);
  const base = String(e);
  if (hint.length > 0) {
    return `${base} — ${hint}`;
  }
  return base;
}
