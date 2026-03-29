import * as vscode from "vscode";
import { getPlantumlCustomEditorShellHtml } from "./customEditorHtml";
import { expandPlantUmlIncludesCached } from "./expandIncludes";
import { fetchSvgDiagram } from "./serverClient";
import { applyDiagramPreamble } from "./sourceTransform";
import {
  invalidatePlantumlConfigCache,
  PREVIEW_ZOOM_MAX,
  PREVIEW_ZOOM_MIN,
  readPlantumlConfig,
} from "../plantumlConfig";
import { isPlantumlEditorDocument } from "../util/plantumlEditor";
import { debounce } from "../util/debounce";
import {
  buildDiagramLoadingMountContent,
  buildDiagramMountContent,
} from "../preview/html";
import { highlightPlantumlToHtml } from "./webviewHighlight";
import {
  diagramCacheKey,
  getCachedDiagram,
  setCachedDiagram,
} from "./diagramSvgCache";

const VIEW_MODES_KEY = "plantumlViewer.viewModesByUri";
const VIEW_MODE_CONTEXT = "plantumlViewer.viewMode";

const MODE_CYCLE: PlantumlViewMode[] = ["code", "split", "preview"];

export type PlantumlViewMode = "code" | "split" | "preview";

let viewModesMemento: vscode.Memento | undefined;
let viewModesCache: Record<string, PlantumlViewMode> | undefined;

function loadViewModesFromStorage(
  memento: vscode.Memento
): Record<string, PlantumlViewMode> {
  const raw = memento.get<Record<string, string>>(VIEW_MODES_KEY, {});
  const out: Record<string, PlantumlViewMode> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === "code" || v === "split" || v === "preview") {
      out[k] = v;
    }
  }
  return out;
}

function loadViewModes(
  memento: vscode.Memento
): Record<string, PlantumlViewMode> {
  if (viewModesMemento !== memento) {
    viewModesMemento = memento;
    viewModesCache = undefined;
  }
  if (!viewModesCache) {
    viewModesCache = loadViewModesFromStorage(memento);
  }
  return viewModesCache;
}

function readViewMode(
  memento: vscode.Memento,
  uri: vscode.Uri
): PlantumlViewMode {
  const m = loadViewModes(memento)[uri.toString()];
  if (m === "code" || m === "split" || m === "preview") {
    return m;
  }
  return "split";
}

async function writeViewMode(
  memento: vscode.Memento,
  uri: vscode.Uri,
  mode: PlantumlViewMode
): Promise<void> {
  const next = { ...loadViewModes(memento), [uri.toString()]: mode };
  await memento.update(VIEW_MODES_KEY, next);
  viewModesCache = next;
}

export class PlantumlCustomEditorProvider
  implements vscode.CustomTextEditorProvider
{
  static readonly viewType = "plantumlViewer.plantumlEditor";

  private static readonly sessions = new Map<
    string,
    PlantumlCustomEditorSession
  >();

  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * Custom editor session for the currently active editor tab, if it is this view type.
   */
  static activePlantumlSession(): PlantumlCustomEditorSession | undefined {
    const tab = vscode.window.tabGroups.activeTabGroup?.activeTab;
    const input = tab?.input;
    if (!(input instanceof vscode.TabInputCustom)) {
      return undefined;
    }
    if (input.viewType !== PlantumlCustomEditorProvider.viewType) {
      return undefined;
    }
    return PlantumlCustomEditorProvider.sessions.get(input.uri.toString());
  }

  /**
   * Updates `plantumlViewer.viewMode` context for editor/title menu icons (active tab only).
   */
  static async syncViewModeContext(
    context: vscode.ExtensionContext
  ): Promise<void> {
    const s = PlantumlCustomEditorProvider.activePlantumlSession();
    const mode = s
      ? readViewMode(context.workspaceState, s.document.uri)
      : "";
    await vscode.commands.executeCommand("setContext", VIEW_MODE_CONTEXT, mode);
  }

  static async toggleViewMode(
    context: vscode.ExtensionContext
  ): Promise<void> {
    const s = PlantumlCustomEditorProvider.activePlantumlSession();
    if (!s) {
      return;
    }
    const uri = s.document.uri;
    const cur = readViewMode(context.workspaceState, uri);
    const idx = MODE_CYCLE.indexOf(cur);
    const i = idx >= 0 ? idx : 1;
    const next = MODE_CYCLE[(i + 1) % MODE_CYCLE.length];
    await s.setMode(next);
  }

  /**
   * Active PlantUML document: custom editor tab or text editor.
   */
  static getActivePlantumlDocument(): vscode.TextDocument | undefined {
    const s = PlantumlCustomEditorProvider.activePlantumlSession();
    if (s) {
      return s.document;
    }
    const te = vscode.window.activeTextEditor;
    if (te && isPlantumlEditorDocument(te.document)) {
      return te.document;
    }
    return undefined;
  }

  static async setViewMode(
    context: vscode.ExtensionContext,
    mode: PlantumlViewMode
  ): Promise<void> {
    const s = PlantumlCustomEditorProvider.activePlantumlSession();
    if (s) {
      await s.setMode(mode);
      return;
    }
    const te = vscode.window.activeTextEditor;
    if (te && isPlantumlEditorDocument(te.document)) {
      await writeViewMode(context.workspaceState, te.document.uri, mode);
      await vscode.commands.executeCommand(
        "vscode.openWith",
        te.document.uri,
        this.viewType,
        te.viewColumn ?? vscode.ViewColumn.Active
      );
      return;
    }
    if (mode !== "code") {
      void vscode.window.showWarningMessage(
        "Open a PlantUML file (.puml) and try again."
      );
    }
  }

  static refreshActive(): void {
    const s = PlantumlCustomEditorProvider.activePlantumlSession();
    if (!s) {
      void vscode.window.showInformationMessage(
        "Open a .puml file in PlantUML Viewer and try again."
      );
      return;
    }
    void s.refreshDiagram("manual");
  }

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [],
    };

    const session = new PlantumlCustomEditorSession(
      this.context,
      document,
      webviewPanel
    );

    PlantumlCustomEditorProvider.sessions.set(document.uri.toString(), session);

    webviewPanel.webview.onDidReceiveMessage((msg) => {
      void session.handleMessage(msg as WebviewFromHostMessage);
    });

    webviewPanel.onDidChangeViewState((e) => {
      if (e.webviewPanel.active) {
        void PlantumlCustomEditorProvider.syncViewModeContext(this.context);
      }
    });

    webviewPanel.onDidDispose(() => {
      session.dispose();
      PlantumlCustomEditorProvider.sessions.delete(document.uri.toString());
      void PlantumlCustomEditorProvider.syncViewModeContext(this.context);
    });

    webviewPanel.webview.html = getPlantumlCustomEditorShellHtml();
  }
}

type WebviewFromHostMessage =
  | { type: "ready" }
  | { type: "previewZoomChange"; zoom: number }
  | { type: "docChange"; text: string }
  | { type: "requestHighlight"; text: string }
  | {
      type: "uiCommand";
      command: "setMode" | "refresh" | "export";
      mode?: PlantumlViewMode;
    };

class PlantumlCustomEditorSession implements vscode.Disposable {
  private mode: PlantumlViewMode;
  private applyingFromWebview = false;
  /** Skip echoing document text back to the Webview after a `docChange` apply. */
  private skipPostToWebviewOnce = false;
  private abort: AbortController | undefined;
  private readonly debouncedRefresh: ReturnType<typeof debounce>;
  private readonly docSub: vscode.Disposable;
  private zoomPersistTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly context: vscode.ExtensionContext,
    readonly document: vscode.TextDocument,
    private readonly webviewPanel: vscode.WebviewPanel
  ) {
    this.mode = readViewMode(this.context.workspaceState, document.uri);
    this.debouncedRefresh = debounce(() => {
      void this.refreshDiagram("debounce");
    }, () => readPlantumlConfig().autoRefreshDelayMs);

    this.docSub = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() !== this.document.uri.toString()) {
        return;
      }
      if (this.skipPostToWebviewOnce) {
        this.skipPostToWebviewOnce = false;
        if (readPlantumlConfig().autoRefresh && this.mode !== "code") {
          this.debouncedRefresh();
        }
        return;
      }
      if (this.applyingFromWebview) {
        return;
      }
      const docText = e.document.getText();
      this.webview.postMessage({
        type: "code",
        text: docText,
        readOnly: false,
        highlightHtml: highlightPlantumlToHtml(docText),
      });
      if (readPlantumlConfig().autoRefresh && this.mode !== "code") {
        this.debouncedRefresh();
      }
    });
  }

  private get webview(): vscode.Webview {
    return this.webviewPanel.webview;
  }

  dispose(): void {
    this.debouncedRefresh.dispose();
    this.docSub.dispose();
    this.abort?.abort();
    if (this.zoomPersistTimer !== undefined) {
      clearTimeout(this.zoomPersistTimer);
      this.zoomPersistTimer = undefined;
    }
  }

  private schedulePersistPreviewZoom(zoom: number): void {
    const clamped = Math.min(
      PREVIEW_ZOOM_MAX,
      Math.max(PREVIEW_ZOOM_MIN, zoom)
    );
    if (this.zoomPersistTimer !== undefined) {
      clearTimeout(this.zoomPersistTimer);
    }
    this.zoomPersistTimer = setTimeout(() => {
      this.zoomPersistTimer = undefined;
      invalidatePlantumlConfigCache();
      void vscode.workspace
        .getConfiguration("plantumlViewer")
        .update(
          "previewZoom",
          clamped,
          vscode.ConfigurationTarget.Global
        );
    }, 300);
  }

  async handleMessage(msg: WebviewFromHostMessage): Promise<void> {
    if (!msg || typeof msg !== "object") {
      return;
    }
    if (msg.type === "previewZoomChange") {
      const z = msg.zoom;
      if (typeof z !== "number" || !Number.isFinite(z)) {
        return;
      }
      this.schedulePersistPreviewZoom(z);
      return;
    }
    if (msg.type === "requestHighlight") {
      this.webview.postMessage({
        type: "highlight",
        html: highlightPlantumlToHtml(msg.text),
      });
      return;
    }
    if (msg.type === "uiCommand") {
      if (msg.command === "setMode") {
        const m = msg.mode;
        if (m === "code" || m === "split" || m === "preview") {
          await this.setMode(m);
        }
      } else if (msg.command === "refresh") {
        void this.refreshDiagram("manual");
      } else if (msg.command === "export") {
        void vscode.commands.executeCommand("plantumlViewer.exportDiagram");
      }
      return;
    }
    if (msg.type === "ready") {
      const text = this.document.getText();
      const cfg = readPlantumlConfig();
      this.webview.postMessage({
        type: "init",
        mode: this.mode,
        text,
        readOnly: false,
        showWebviewToolbar: cfg.showWebviewToolbar,
        highlightHtml: highlightPlantumlToHtml(text),
        diagramHtml:
          this.mode === "code" ? undefined : buildDiagramLoadingMountContent(),
      });
      if (this.mode !== "code") {
        void this.refreshDiagram("init");
      }
      void PlantumlCustomEditorProvider.syncViewModeContext(this.context);
      return;
    }
    if (msg.type === "docChange") {
      const text = msg.text;
      if (text === this.document.getText()) {
        return;
      }
      const edit = new vscode.WorkspaceEdit();
      const fullRange = new vscode.Range(
        this.document.positionAt(0),
        this.document.positionAt(this.document.getText().length)
      );
      edit.replace(this.document.uri, fullRange, text);
      this.skipPostToWebviewOnce = true;
      this.applyingFromWebview = true;
      try {
        const ok = await vscode.workspace.applyEdit(edit);
        if (!ok) {
          this.skipPostToWebviewOnce = false;
        }
      } catch {
        this.skipPostToWebviewOnce = false;
      } finally {
        this.applyingFromWebview = false;
      }
      if (readPlantumlConfig().autoRefresh && this.mode !== "code") {
        this.debouncedRefresh();
      }
    }
  }

  async setMode(mode: PlantumlViewMode): Promise<void> {
    await writeViewMode(this.context.workspaceState, this.document.uri, mode);
    this.mode = mode;
    this.webview.postMessage({ type: "mode", mode });
    if (mode === "code") {
      this.abort?.abort();
      this.webview.postMessage({ type: "diagram", kind: "clear" });
    } else {
      this.webview.postMessage({
        type: "diagram",
        kind: "html",
        html: buildDiagramLoadingMountContent(),
      });
      void this.refreshDiagram("mode", { skipLoadingBanner: true });
    }
    void PlantumlCustomEditorProvider.syncViewModeContext(this.context);
  }

  async refreshDiagram(
    reason: string,
    opts?: { skipLoadingBanner?: boolean }
  ): Promise<void> {
    if (this.mode === "code") {
      return;
    }
    void reason;

    const conn = readPlantumlConfig();
    const uri = this.document.uri;
    let text: string;
    try {
      text = this.document.getText();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.webview.postMessage({
        type: "diagram",
        kind: "html",
        html: buildDiagramMountContent(
          { error: `Could not read document: ${msg}` },
          { previewZoom: conn.previewZoom }
        ),
      });
      return;
    }

    const expanded = await expandPlantUmlIncludesCached(uri, text);
    if (!expanded.ok) {
      this.webview.postMessage({
        type: "diagram",
        kind: "html",
        html: buildDiagramMountContent(
          { error: expanded.message },
          { previewZoom: conn.previewZoom }
        ),
      });
      return;
    }
    text = expanded.text;
    text = applyDiagramPreamble(text, conn.diagramPreamble);

    this.abort?.abort();
    this.abort = new AbortController();
    const signal = this.abort.signal;

    const cacheKey = diagramCacheKey(conn.serverUrl, text);
    const cached = getCachedDiagram(cacheKey);
    if (cached) {
      if (cached.kind === "svg") {
        this.webview.postMessage({
          type: "diagram",
          kind: "html",
          html: buildDiagramMountContent(
            { svg: cached.svg },
            { previewZoom: conn.previewZoom }
          ),
        });
      } else {
        this.webview.postMessage({
          type: "diagram",
          kind: "html",
          html: buildDiagramMountContent(
            { error: cached.message },
            { previewZoom: conn.previewZoom }
          ),
        });
      }
      return;
    }

    if (!opts?.skipLoadingBanner) {
      this.webview.postMessage({
        type: "diagram",
        kind: "html",
        html: buildDiagramLoadingMountContent(),
      });
    }

    const result = await fetchSvgDiagram(conn.serverUrl, text, {
      signal,
      timeoutMs: conn.requestTimeoutMs,
    });

    if (signal.aborted) {
      return;
    }

    if (result.kind === "svg") {
      setCachedDiagram(cacheKey, { kind: "svg", svg: result.svg });
      this.webview.postMessage({
        type: "diagram",
        kind: "html",
        html: buildDiagramMountContent(
          { svg: result.svg },
          { previewZoom: conn.previewZoom }
        ),
      });
    } else {
      setCachedDiagram(cacheKey, { kind: "err", message: result.message });
      this.webview.postMessage({
        type: "diagram",
        kind: "html",
        html: buildDiagramMountContent(
          { error: result.message },
          { previewZoom: conn.previewZoom }
        ),
      });
    }
  }
}
