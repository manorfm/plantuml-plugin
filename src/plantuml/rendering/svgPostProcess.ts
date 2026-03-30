import type { DiagramKind } from "./analyzeDiagram";
import { getThemeTokens, type VisualThemeId } from "./themes";

const DEFS_PREFIX = "pumlvr-";

/** Diagramas com muitas caixas/arestas: filtros em todos os `rect` enchem o viewBox e “estouram” na Webview. */
function isDenseGraphKind(kind: DiagramKind): boolean {
  return (
    kind === "component" ||
    kind === "deployment" ||
    kind === "class" ||
    kind === "usecase" ||
    kind === "state" ||
    kind === "object" ||
    kind === "other"
  );
}

/**
 * Pós-processamento do SVG devolvido pelo servidor: `<defs>` com filtros/gradientes e CSS interno.
 * Best-effort; não altera primitivas individuais para não corromper layouts Graphviz.
 */
export function postProcessSvg(
  svg: string,
  themeId: VisualThemeId,
  kind: DiagramKind,
  enabled: boolean
): string {
  if (!enabled || themeId === "none") {
    return svg;
  }

  const trimmed = svg.trim();
  if (!trimmed.toLowerCase().includes("<svg")) {
    return svg;
  }

  if (trimmed.includes(`id="${DEFS_PREFIX}shadow"`) || trimmed.includes(`id="${DEFS_PREFIX}grad"`)) {
    return svg;
  }

  const t = getThemeTokens(themeId, kind);
  if (!t) {
    return svg;
  }

  const dense = isDenseGraphKind(kind);
  const idShadow = `${DEFS_PREFIX}shadow`;
  const idGrad = `${DEFS_PREFIX}grad`;

  const allowShadowFilter = t.shadowBlur > 0 && !dense;

  const filterBlock =
    allowShadowFilter
      ? `<filter id="${idShadow}" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="${t.shadowBlur}"/>
    <feOffset dx="0" dy="${t.shadowOffsetY}" result="o"/>
    <feFlood flood-color="#000000" flood-opacity="${t.shadowOpacity}"/>
    <feComposite in2="o" operator="in"/>
    <feMerge>
      <feMergeNode/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>`
      : "";

  const gradientBlock = dense
    ? ""
    : `<linearGradient id="${idGrad}" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" style="stop-color:${t.gradientTop};stop-opacity:1" />
    <stop offset="100%" style="stop-color:${t.gradientBottom};stop-opacity:1" />
  </linearGradient>`;

  const filterCss =
    allowShadowFilter
      ? `svg rect:not([fill="none"]), svg polygon:not([fill="none"]) { filter: url(#${idShadow}); }`
      : "";

  /** Diagramas densos: sombra leve via CSS (evita feGaussianBlur em tudo + dá profundidade às caixas). */
  const denseShadowCss = dense
    ? `svg g > rect:not([fill="none"]),
  svg g > polygon:not([fill="none"]) {
    filter: drop-shadow(${t.denseDropShadow});
  }`
    : "";

  const hoverCss = dense
    ? `svg g:hover { opacity: 0.99; }`
    : themeId === "glass"
      ? `svg g:hover { opacity: 0.97; }`
      : `svg g:hover { filter: brightness(1.04); }`;

  /** Reforça sans-serif no SVG (servidores sem a fonte do skinparam caem para serif). */
  const svgTextFontCss = `svg text, svg tspan {
    font-family: "${t.fontPrimary}", "Liberation Sans", "Helvetica Neue", Arial, sans-serif !important;
  }`;

  const defsContent = `<defs xmlns="http://www.w3.org/2000/svg">
${filterBlock}
${gradientBlock}
<style type="text/css"><![CDATA[
  svg { shape-rendering: geometricPrecision; }
  rect, polygon, ellipse, path { stroke-linejoin: round; stroke-linecap: round; }
  ${svgTextFontCss}
  ${filterCss}
  ${denseShadowCss}
  ${hoverCss}
]]></style>
</defs>`;

  const m = trimmed.match(/^([\s\S]*?<svg\b[^>]*>)/i);
  if (!m) {
    return svg;
  }
  return m[1] + defsContent + trimmed.slice(m[1].length);
}
