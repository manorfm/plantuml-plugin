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
 * Estilos partilhados da área do diagrama (custom editor `#diagramMount` ou painel `.puml-preview-body`).
 * Não altera a estrutura DOM — só aparência (cartão, sombras, loading e erros).
 */
export function diagramAreaChromeCss(scope: string): string {
  return `
    ${scope} .wrap {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
      box-sizing: border-box;
      padding: 10px 14px 14px;
    }
    ${scope} .wrap .scrollport {
      flex: 1 1 auto;
      overflow: auto;
      min-height: 0;
      cursor: grab;
      -webkit-user-select: none;
      user-select: none;
      touch-action: none;
      border-radius: 10px;
      border: 1px solid
        var(
          --vscode-widget-border,
          var(--vscode-panel-border, rgba(128, 128, 128, 0.28))
        );
      background: var(
        --vscode-editorWidget-background,
        var(--vscode-sideBar-background, rgba(128, 128, 128, 0.06))
      );
      box-shadow:
        0 1px 0 var(--vscode-titleBar-inactiveForeground, rgba(128, 128, 128, 0.08)),
        0 6px 24px var(--vscode-widget-shadow, rgba(0, 0, 0, 0.08));
    }
    ${scope} .wrap .scrollport.grabbing {
      cursor: grabbing;
    }
    ${scope} .zoom-layer {
      display: inline-block;
      transform-origin: 0 0;
    }
    ${scope} .zoom-layer svg {
      display: block;
      max-width: none !important;
      height: auto !important;
      min-width: min-content;
      vertical-align: top;
      filter: drop-shadow(0 1px 1px var(--vscode-widget-shadow, rgba(0, 0, 0, 0.06)));
    }
    ${scope} .zoom-layer svg text,
    ${scope} .zoom-layer svg tspan {
      paint-order: stroke fill;
    }
    ${scope} .error {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: var(--vscode-editor-font-family, var(--vscode-font-family));
      font-size: var(--vscode-editor-font-size, var(--vscode-font-size));
      line-height: 1.5;
      color: var(--vscode-errorForeground);
      max-width: 100%;
      padding: 14px 16px;
      border-radius: 10px;
      border: 1px solid
        var(
          --vscode-inputValidation-errorBorder,
          var(--vscode-errorForeground, rgba(220, 80, 80, 0.55))
        );
      background: var(
        --vscode-inputValidation-errorBackground,
        rgba(220, 80, 80, 0.09)
      );
      box-sizing: border-box;
    }
    ${scope} .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      margin: auto;
      min-height: 120px;
      max-width: 280px;
      padding: 22px 26px;
      text-align: center;
      border-radius: 12px;
      border: 1px solid
        var(
          --vscode-widget-border,
          var(--vscode-panel-border, rgba(128, 128, 128, 0.25))
        );
      background: var(
        --vscode-editorWidget-background,
        var(--vscode-sideBar-background, rgba(128, 128, 128, 0.05))
      );
      box-shadow: 0 4px 20px var(--vscode-widget-shadow, rgba(0, 0, 0, 0.07));
      font-size: var(--vscode-font-size, 13px);
      font-weight: 500;
      letter-spacing: 0.01em;
      color: var(
        --vscode-descriptionForeground,
        var(--vscode-editor-foreground)
      );
    }
    ${scope} .spinner {
      width: 22px;
      height: 22px;
      border: 2px solid
        var(
          --vscode-input-border,
          var(--vscode-panel-border, rgba(128, 128, 128, 0.4))
        );
      border-top-color: var(
        --vscode-progressBar-background,
        var(--vscode-button-background, var(--vscode-focusBorder))
      );
      border-radius: 50%;
      animation: pumlDiagramSpin 0.7s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
    }
    @keyframes pumlDiagramSpin {
      to {
        transform: rotate(360deg);
      }
    }
  `.trim();
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
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100%;
    `)}
    ${diagramAreaChromeCss(".puml-preview-body")}
  `.trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <style>${styles}</style>
</head>
<body class="puml-preview-body">
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
    ${diagramAreaChromeCss(".puml-preview-body")}
    .puml-preview-body .wrap {
      min-height: 100%;
    }
    .puml-preview-body .zoom-layer {
      zoom: ${z};
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
<body class="puml-preview-body">
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
<body class="puml-preview-body">
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
