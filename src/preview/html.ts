/**
 * Estilos base alinhados ao tema ativo (claro/escuro/high contrast).
 * Usa variáveis oficiais da Webview e cadeias de fallback.
 * @see https://code.visualstudio.com/api/extension-guides/webview#theming-webview-content
 */
function webviewSurfaceCss(extraBodyRules: string): string {
  return `
    html {
      color-scheme: light dark;
    }
    body {
      margin: 0;
      box-sizing: border-box;
      min-height: 100%;
      font-family: var(--vscode-font-family);
      /* Fundo do painel Webview → editor → barra lateral */
      background-color: var(
        --vscode-webview-panel-background,
        var(--vscode-editor-background, var(--vscode-sideBar-background))
      );
      color: var(--vscode-editor-foreground);
      ${extraBodyRules}
    }
  `.trim();
}

/**
 * Escapa texto para inserção em HTML (mensagens de erro).
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Remove blocos script de SVG antes de inserção inline (defesa em profundidade).
 */
export function sanitizeSvgForInline(svg: string): string {
  let s = svg.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<\?xml[^?]*\?>\s*/i, "").trim();
  return s;
}

/**
 * Estado intermédio enquanto o pedido HTTP ao servidor está em curso.
 */
export function buildLoadingHtml(message = "Rendering diagram…"): string {
  const csp = [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
  ].join("; ");

  const styles = `
    ${webviewSurfaceCss(`
      padding: 24px;
      font-size: var(--vscode-font-size, 13px);
      color: var(
        --vscode-descriptionForeground,
        var(--vscode-editor-foreground)
      );
    `)}
    .loading {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid
        var(
          --vscode-input-border,
          var(--vscode-panel-border, var(--vscode-widget-border, rgba(128, 128, 128, 0.45)))
        );
      border-top-color: var(
        --vscode-progressBar-background,
        var(--vscode-button-background, var(--vscode-focusBorder))
      );
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `.trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <style>${styles}</style>
</head>
<body>
  <div class="loading" aria-live="polite">
    <div class="spinner" role="presentation"></div>
    <span>${escapeHtml(message)}</span>
  </div>
</body>
</html>`;
}

export type PreviewHtmlOptions = {
  /** Escala visual do diagrama (ex.: 1 = 100%, 1.5 = 150%). */
  previewZoom?: number;
};

function buildPanZoomScript(): string {
  return `(function(){
  var el = document.querySelector(".scrollport");
  if (!el) return;
  var dragging = false;
  var prevX = 0, prevY = 0;
  el.addEventListener("mousedown", function(e){
    if (e.button !== 0) return;
    dragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
    el.classList.add("grabbing");
    try { e.preventDefault(); } catch (_) {}
  });
  window.addEventListener("mouseup", function(){
    dragging = false;
    el.classList.remove("grabbing");
  });
  window.addEventListener("mousemove", function(e){
    if (!dragging) return;
    el.scrollLeft -= e.clientX - prevX;
    el.scrollTop -= e.clientY - prevY;
    prevX = e.clientX;
    prevY = e.clientY;
  });
  el.addEventListener("touchstart", function(e){
    if (e.touches.length !== 1) return;
    dragging = true;
    prevX = e.touches[0].clientX;
    prevY = e.touches[0].clientY;
    el.classList.add("grabbing");
  }, { passive: true });
  window.addEventListener("touchend", function(){ dragging = false; el.classList.remove("grabbing"); });
  el.addEventListener("touchmove", function(e){
    if (!dragging || e.touches.length !== 1) return;
    var x = e.touches[0].clientX, y = e.touches[0].clientY;
    el.scrollLeft -= x - prevX;
    el.scrollTop -= y - prevY;
    prevX = x;
    prevY = y;
  }, { passive: true });
})();`;
}

/**
 * HTML da Webview: SVG inline (texto e ligações nítidos) ou bloco de erro.
 * Área com scroll + arrastar para deslocar diagramas maiores que o painel.
 */
export function buildPreviewHtml(
  svgOrError: { svg: string } | { error: string },
  options?: PreviewHtmlOptions
): string {
  const z = options?.previewZoom ?? 1;
  const cspNoScript = [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
  ].join("; ");
  const cspWithScript = [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    "script-src 'unsafe-inline'",
    "img-src data: blob:",
    "font-src data: blob:",
  ].join("; ");

  const styles = `
    ${webviewSurfaceCss(`
      padding: 12px;
    `)}
    .wrap {
      display: flex;
      flex-direction: column;
      min-height: 100%;
      box-sizing: border-box;
    }
    .scrollport {
      flex: 1 1 auto;
      overflow: auto;
      min-height: 0;
      cursor: grab;
      -webkit-user-select: none;
      user-select: none;
      touch-action: none;
    }
    .scrollport.grabbing {
      cursor: grabbing;
    }
    .zoom-layer {
      display: inline-block;
      transform-origin: 0 0;
      zoom: ${z};
    }
    .zoom-layer svg {
      display: block;
      max-width: none !important;
      height: auto !important;
      min-width: min-content;
      vertical-align: top;
    }
    .zoom-layer svg text,
    .zoom-layer svg tspan {
      paint-order: stroke fill;
    }
    .error {
      white-space: pre-wrap;
      word-break: break-word;
      font-family: var(--vscode-editor-font-family, var(--vscode-font-family));
      font-size: var(--vscode-editor-font-size, var(--vscode-font-size));
      color: var(--vscode-errorForeground);
      max-width: 100%;
    }
  `.trim();

  if ("error" in svgOrError) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${cspNoScript}" />
  <style>${styles}</style>
</head>
<body>
  <div class="wrap">
    <div class="error">${escapeHtml(svgOrError.error)}</div>
  </div>
</body>
</html>`;
  }

  const svg = sanitizeSvgForInline(svgOrError.svg);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${cspWithScript}" />
  <style>${styles}</style>
</head>
<body>
  <div class="wrap">
    <div class="scrollport" role="region" aria-label="PlantUML diagram — drag to pan when larger than the panel">
      <div class="zoom-layer">
${svg}
      </div>
    </div>
  </div>
  <script>${buildPanZoomScript()}</script>
</body>
</html>`;
}

/**
 * Conteúdo colocado no contentor do diagrama do editor personalizado (não é documento HTML completo).
 */
export function buildDiagramMountContent(
  svgOrError: { svg: string } | { error: string },
  options?: PreviewHtmlOptions
): string {
  const z = options?.previewZoom ?? 1;
  if ("error" in svgOrError) {
    return `<div class="wrap"><div class="error">${escapeHtml(
      svgOrError.error
    )}</div></div>`;
  }
  const svg = sanitizeSvgForInline(svgOrError.svg);
  return `<div class="wrap"><div class="scrollport diagram-scrollport" role="region" aria-label="PlantUML diagram — drag to pan when larger than the panel"><div class="zoom-layer" style="zoom:${z}">${svg}</div></div></div>`;
}

/**
 * Indicador de carregamento dentro do contentor do diagrama.
 */
export function buildDiagramLoadingMountContent(
  message = "Rendering diagram…"
): string {
  return `<div class="wrap"><div class="loading" aria-live="polite"><div class="spinner" role="presentation"></div><span>${escapeHtml(
    message
  )}</span></div></div>`;
}
