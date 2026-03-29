/**
 * Static HTML document for {@link vscode.CustomTextEditorProvider}.
 * Mode, text, diagram updates via `postMessage`; syntax colouring via highlight layer + `highlight` / `highlightHtml` messages.
 */
export function getPlantumlCustomEditorShellHtml(): string {
  const csp = [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    "script-src 'unsafe-inline'",
    "img-src data: blob:",
    "font-src data: blob:",
  ].join("; ");

  const styles = `
    html { color-scheme: light dark; }
    html, body {
      height: 100%;
      margin: 0;
      box-sizing: border-box;
    }
    body {
      font-family: var(--vscode-font-family);
      background-color: var(
        --vscode-webview-panel-background,
        var(--vscode-editor-background, var(--vscode-sideBar-background))
      );
      color: var(--vscode-editor-foreground);
    }
    #app {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }
    #wvToolbar {
      flex: 0 0 auto;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      padding: 2px 6px;
      border-bottom: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.35));
    }
    #wvToolbar.hidden {
      display: none;
    }
    #wvToolbar .tb-group {
      display: flex;
      align-items: center;
      gap: 1px;
    }
    #wvToolbar .tb-sep {
      width: 1px;
      height: 18px;
      background: var(--vscode-panel-border, rgba(128, 128, 128, 0.45));
      margin: 0 2px;
      flex-shrink: 0;
    }
    #wvToolbar .tb-icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      padding: 0;
      margin: 0;
      box-sizing: border-box;
      background: transparent;
      color: var(--vscode-icon-foreground, var(--vscode-foreground));
      border: 1px solid transparent;
      border-radius: 3px;
      cursor: pointer;
    }
    #wvToolbar .tb-icon-btn:hover {
      background: var(--vscode-toolbar-hoverBackground, rgba(128, 128, 128, 0.2));
    }
    #wvToolbar .tb-icon-btn.active {
      background: var(--vscode-toolbar-activeBackground, rgba(128, 128, 128, 0.28));
      border-color: var(--vscode-toolbar-hoverOutline, transparent);
    }
    #wvToolbar .tb-icon-btn svg {
      flex-shrink: 0;
      pointer-events: none;
    }
    #root {
      display: flex;
      flex-direction: row;
      flex: 1 1 auto;
      min-height: 0;
      width: 100%;
    }
    #codePane {
      display: flex;
      min-width: 0;
      min-height: 0;
      flex: 1 1 50%;
      flex-direction: column;
      border-right: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.35));
    }
    #codeScroll {
      flex: 1 1 auto;
      min-height: 0;
      overflow: auto;
    }
    #codeSizer {
      position: relative;
      width: 100%;
      min-height: 100%;
      box-sizing: border-box;
    }
    #codePre {
      margin: 0;
      padding: 8px;
      white-space: pre-wrap;
      word-break: break-word;
      tab-size: 4;
      font-family: var(--vscode-editor-font-family, var(--vscode-font-family));
      font-size: var(--vscode-editor-font-size, var(--vscode-font-size));
      line-height: var(--vscode-editor-line-height, 1.4);
      color: var(--vscode-editor-foreground);
      box-sizing: border-box;
    }
    #codePre code {
      display: block;
    }
    #codePre .puml-cmt {
      color: var(
        --vscode-editorLineNumber-activeForeground,
        var(--vscode-descriptionForeground, #6a9955)
      );
      font-style: italic;
    }
    #codePre .puml-kw {
      color: var(--vscode-symbolIcon-keywordForeground, #c586c0);
    }
    #codePre .puml-dir {
      color: var(--vscode-editor-preprocessorForeground, #9cdcfe);
    }
    #codePre .puml-str {
      color: var(--vscode-editor-stringForeground, #ce9178);
    }
    #codePre .puml-num {
      color: var(--vscode-editor-numberForeground, #b5cea8);
    }
    #codePre .puml-arrow {
      color: var(--vscode-editor-symbolForeground, #569cd6);
    }
    #codePre .puml-at {
      color: var(--vscode-symbolIcon-classForeground, #4ec9b0);
      font-weight: 600;
    }
    #codePre .puml-plain {
      white-space: pre-wrap;
      word-break: break-word;
    }
    body.mode-code #codePane {
      flex: 1 1 100%;
      border-right: none;
    }
    #diagramPane {
      display: flex;
      min-width: 0;
      min-height: 0;
      flex: 1 1 50%;
      flex-direction: column;
      overflow: hidden;
    }
    body.mode-code #diagramPane { display: none !important; }
    body.mode-preview #codePane { display: none !important; }
    body.mode-preview #diagramPane {
      flex: 1 1 100%;
    }
    #src {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      resize: none;
      border: none;
      outline: none;
      padding: 8px;
      box-sizing: border-box;
      font-family: var(--vscode-editor-font-family, var(--vscode-font-family));
      font-size: var(--vscode-editor-font-size, var(--vscode-font-size));
      line-height: var(--vscode-editor-line-height, 1.4);
      background: transparent;
      color: transparent;
      -webkit-text-fill-color: transparent;
      caret-color: var(--vscode-editor-foreground);
      tab-size: 4;
      overflow: hidden;
      z-index: 1;
    }
    #src::selection {
      background: var(
        --vscode-editor-selectionBackground,
        rgba(100, 150, 200, 0.35)
      );
    }
    #diagramMount {
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    #diagramMount .wrap {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
      box-sizing: border-box;
      padding: 12px;
    }
    #diagramMount .scrollport {
      flex: 1 1 auto;
      overflow: auto;
      min-height: 0;
      cursor: grab;
      -webkit-user-select: none;
      user-select: none;
      touch-action: none;
    }
    #diagramMount .scrollport.grabbing { cursor: grabbing; }
    #diagramMount .zoom-layer {
      display: inline-block;
      transform-origin: 0 0;
    }
    #diagramMount .zoom-layer svg {
      display: block;
      max-width: none !important;
      height: auto !important;
      min-width: min-content;
      vertical-align: top;
    }
    #diagramMount .zoom-layer svg text,
    #diagramMount .zoom-layer svg tspan {
      paint-order: stroke fill;
    }
    #diagramMount .error {
      white-space: pre-wrap;
      word-break: break-word;
      font-family: var(--vscode-editor-font-family, var(--vscode-font-family));
      font-size: var(--vscode-editor-font-size, var(--vscode-font-size));
      color: var(--vscode-errorForeground);
      max-width: 100%;
    }
    #diagramMount .loading {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      font-size: var(--vscode-font-size, 13px);
      color: var(
        --vscode-descriptionForeground,
        var(--vscode-editor-foreground)
      );
    }
    #diagramMount .spinner {
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
      animation: pumlSpin 0.8s linear infinite;
    }
    @keyframes pumlSpin {
      to { transform: rotate(360deg); }
    }
  `.trim();

  const panScript = `(function(){
  var el = document.querySelector(".diagram-scrollport");
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <style>${styles}</style>
</head>
<body class="mode-split">
  <div id="app">
    <div id="wvToolbar" class="hidden">
      <div class="tb-group" role="toolbar" aria-label="View mode">
        <button type="button" class="tb-icon-btn tb-mode" id="wvModeCode" title="Code only" aria-pressed="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path stroke="currentColor" stroke-width="1.25" stroke-linejoin="round" d="M3.5 2.5h6.6l2.4 2.4v8.6H3.5z"/><path stroke="currentColor" stroke-width="1.25" stroke-linejoin="round" d="M10.1 2.5V5h2.4"/></svg>
        </button>
        <button type="button" class="tb-icon-btn tb-mode" id="wvModeSplit" title="Split view" aria-pressed="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2.5" y="3.5" width="4.8" height="9" rx="0.5" stroke="currentColor" stroke-width="1.25"/><rect x="8.7" y="3.5" width="4.8" height="9" rx="0.5" stroke="currentColor" stroke-width="1.25"/></svg>
        </button>
        <button type="button" class="tb-icon-btn tb-mode" id="wvModePreview" title="Preview" aria-pressed="false">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="3.5" width="8.5" height="6" rx="0.5" stroke="currentColor" stroke-width="1.2"/><circle cx="10.8" cy="10.8" r="3.2" stroke="currentColor" stroke-width="1.2"/><path stroke="currentColor" stroke-width="1.2" stroke-linecap="round" d="M13 13l2.2 2.2"/></svg>
        </button>
      </div>
      <span class="tb-sep" aria-hidden="true"></span>
      <div class="tb-group">
        <button type="button" class="tb-icon-btn" id="btnRefresh" title="Refresh diagram" aria-label="Refresh diagram">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" d="M2.5 8a5.5 5.5 0 0 1 9.55-3.65M13.5 8a5.5 5.5 0 0 1-9.55 3.65"/><path stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" d="M12.5 2.5V6h-3M3.5 13.5V10h3"/></svg>
        </button>
        <button type="button" class="tb-icon-btn" id="btnExport" title="Export diagram" aria-label="Export diagram">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" d="M8 2.5v8M5 7.5l3 3 3-3M3 13.5h10"/></svg>
        </button>
      </div>
    </div>
    <div id="root">
      <div id="codePane">
        <div id="codeScroll">
          <div id="codeSizer">
            <pre id="codePre" aria-hidden="true"><code id="codeHl"></code></pre>
            <textarea id="src" spellcheck="false" autocorrect="off" autocapitalize="off"></textarea>
          </div>
        </div>
      </div>
      <div id="diagramPane"><div id="diagramMount"></div></div>
    </div>
  </div>
  <script>
(function () {
  var vscode = acquireVsCodeApi();
  var ta = document.getElementById("src");
  var codeHl = document.getElementById("codeHl");
  var codePre = document.getElementById("codePre");
  var codeSizer = document.getElementById("codeSizer");
  var codeScroll = document.getElementById("codeScroll");
  var mount = document.getElementById("diagramMount");
  var toolbar = document.getElementById("wvToolbar");
  var pushTimer = null;
  var hlTimer = null;
  function pushDoc() {
    vscode.postMessage({ type: "docChange", text: ta.value });
  }
  function layoutCodeLayers() {
    var sh = codePre.offsetHeight;
    ta.style.height = sh + "px";
    codeSizer.style.minHeight = Math.max(sh, codeScroll.clientHeight) + "px";
  }
  function applyHighlight(html) {
    codeHl.innerHTML = html || "<br/>";
    requestAnimationFrame(layoutCodeLayers);
  }
  function scheduleHighlight() {
    clearTimeout(hlTimer);
    hlTimer = setTimeout(function () {
      vscode.postMessage({ type: "requestHighlight", text: ta.value });
    }, 24);
  }
  ta.addEventListener("wheel", function (e) {
    codeScroll.scrollTop += e.deltaY;
    codeScroll.scrollLeft += e.deltaX;
    e.preventDefault();
  }, { passive: false });
  function syncWebviewModeToolbar(mode) {
    ["code", "split", "preview"].forEach(function (m) {
      var el = document.getElementById(
        m === "code" ? "wvModeCode" : m === "split" ? "wvModeSplit" : "wvModePreview"
      );
      if (!el) return;
      var on = m === mode;
      el.classList.toggle("active", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
  ta.addEventListener("input", function () {
    scheduleHighlight();
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushDoc, 400);
  });
  document.querySelectorAll(".tb-mode").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.id;
      var mode =
        id === "wvModeCode" ? "code" : id === "wvModeSplit" ? "split" : "preview";
      vscode.postMessage({ type: "uiCommand", command: "setMode", mode: mode });
    });
  });
  document.getElementById("btnRefresh").addEventListener("click", function () {
    vscode.postMessage({ type: "uiCommand", command: "refresh" });
  });
  document.getElementById("btnExport").addEventListener("click", function () {
    vscode.postMessage({ type: "uiCommand", command: "export" });
  });
  function runPan() {
    ${panScript}
  }
  function setDiagramHtml(html) {
    mount.innerHTML = html;
    runPan();
  }
  window.addEventListener("message", function (ev) {
    var m = ev.data;
    if (!m || typeof m !== "object") return;
    if (m.type === "init") {
      if (m.showWebviewToolbar) {
        toolbar.classList.remove("hidden");
      } else {
        toolbar.classList.add("hidden");
      }
      document.body.className = "mode-" + m.mode;
      syncWebviewModeToolbar(m.mode);
      ta.value = m.text;
      ta.readOnly = !!m.readOnly;
      if (m.diagramHtml) {
        setDiagramHtml(m.diagramHtml);
      } else {
        mount.innerHTML = "";
      }
      if (m.highlightHtml) {
        applyHighlight(m.highlightHtml);
      } else {
        scheduleHighlight();
      }
    }
    if (m.type === "mode") {
      document.body.className = "mode-" + m.mode;
      syncWebviewModeToolbar(m.mode);
      scheduleHighlight();
    }
    if (m.type === "code") {
      if (ta.value !== m.text) ta.value = m.text;
      ta.readOnly = !!m.readOnly;
      if (m.highlightHtml) {
        applyHighlight(m.highlightHtml);
      } else {
        scheduleHighlight();
      }
    }
    if (m.type === "highlight") {
      applyHighlight(m.html);
    }
    if (m.type === "diagram") {
      if (m.kind === "clear") {
        mount.innerHTML = "";
      } else if (m.kind === "html") {
        setDiagramHtml(m.html);
      }
    }
  });
  vscode.postMessage({ type: "ready" });
})();
  <\/script>
</body>
</html>`;
}
