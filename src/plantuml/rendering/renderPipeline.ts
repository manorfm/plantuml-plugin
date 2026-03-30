import type { DiagramKind } from "./analyzeDiagram";
import { analyzeDiagramKind } from "./analyzeDiagram";
import { postProcessSvg } from "./svgPostProcess";
import type { VisualThemeId } from "./themes";
import { fetchSvgDiagram, type FetchSvgOptions } from "../serverClient";
import { applyDiagramPreamble, applyVisualPreambleAfterTheme } from "../sourceTransform";
import { buildVisualPreamble } from "./visualPreamble";

export type VisualRenderingInput = {
  theme: VisualThemeId;
  semanticColors: boolean;
  svgEnhancements: boolean;
};

/**
 * Junta préâmbulo visual (automático) com o préâmbulo do utilizador e devolve o texto exacto a enviar ao servidor.
 */
export function prepareUmlForServer(
  expandedSource: string,
  userPreamble: string | undefined,
  visual: VisualRenderingInput
): { text: string; kind: DiagramKind } {
  const kind = analyzeDiagramKind(expandedSource);
  const vp = buildVisualPreamble(expandedSource, {
    theme: visual.theme,
    semanticColors: visual.semanticColors,
  });
  const base = applyDiagramPreamble(expandedSource, userPreamble?.trim());
  const text = applyVisualPreambleAfterTheme(base, vp);
  return { text, kind };
}

export function enhanceSvgString(
  svg: string,
  kind: DiagramKind,
  visual: VisualRenderingInput
): string {
  return postProcessSvg(svg, visual.theme, kind, visual.svgEnhancements);
}

export type RenderDiagramOptions = {
  uml: string;
  serverUrl: string;
  userPreamble?: string;
  visual: VisualRenderingInput;
  signal?: AbortSignal;
  timeoutMs?: number;
  /**
   * Reservado para evoluções (destaque de arestas, tooltips). O modo actual usa sobretudo CSS no SVG (`visualSvgEnhancements`).
   */
  interactive?: boolean;
};

export type RenderDiagramResult =
  | { kind: "svg"; svg: string }
  | { kind: "error"; message: string };

/**
 * API de desenvolvimento: prepara o texto, obtém SVG do servidor e aplica pós-processamento.
 * Não expande `!include` — o texto deve estar já resolvido se includes forem necessários.
 */
export async function renderDiagram(
  options: RenderDiagramOptions
): Promise<RenderDiagramResult> {
  const { text, kind } = prepareUmlForServer(
    options.uml,
    options.userPreamble,
    options.visual
  );
  const fetchOpts: FetchSvgOptions = {
    signal: options.signal,
    timeoutMs: options.timeoutMs,
  };
  const res = await fetchSvgDiagram(options.serverUrl, text, fetchOpts);
  if (res.kind === "error") {
    return { kind: "error", message: res.message };
  }
  const svg = enhanceSvgString(res.svg, kind, options.visual);
  return { kind: "svg", svg };
}
