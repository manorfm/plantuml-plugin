import * as vscode from "vscode";
import { getPlantumlCustomEditorShellHtml } from "./customEditorHtml";
import { expandPlantUmlIncludes } from "./expandIncludes";
import { fetchSvgDiagram } from "./serverClient";
import { applyDiagramPreamble } from "./sourceTransform";
import { readPlantumlConfig } from "../plantumlConfig";
import { isPlantumlEditorDocument } from "../util/plantumlEditor";
import { debounce } from "../util/debounce";
import {
  buildDiagramLoadingMountContent,
  buildDiagramMountContent,
} from "../preview/html";
import { highlightPlantumlToHtml } from "./webviewHighlight";

const VIEW_MODES_KEY = "plantumlViewer.viewModesByUri";
const VIEW_MODE_CONTEXT = "plantumlViewer.viewMode";
const DEBOUNCE_MS = 500;

const MODE_CYCLE: PlantumlViewMode[] = ["code", "split", "preview"];

export type PlantumlViewMode = "code" | "split" | "preview";

function loadViewModes(
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
  private abort: AbortController | undefined;
  private readonly debouncedRefresh: ReturnType<typeof debounce>;
  private readonly docSub: vscode.Disposable;

  constructor(
    private readonly context: vscode.ExtensionContext,
    readonly document: vscode.TextDocument,
    private readonly webviewPanel: vscode.WebviewPanel
  ) {
    this.mode = readViewMode(this.context.workspaceState, document.uri);
    this.debouncedRefresh = debounce(() => {
      void this.refreshDiagram("debounce");
    }, DEBOUNCE_MS);

    this.docSub = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() !== this.document.uri.toString()) {
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
  }

  async handleMessage(msg: WebviewFromHostMessage): Promise<void> {
    if (!msg || typeof msg !== "object") {
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
      this.applyingFromWebview = true;
      await vscode.workspace.applyEdit(edit);
      this.applyingFromWebview = false;
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
      void this.refreshDiagram("mode");
    }
    void PlantumlCustomEditorProvider.syncViewModeContext(this.context);
  }

  async refreshDiagram(reason: string): Promise<void> {
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

    const expanded = await expandPlantUmlIncludes(uri, text);
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

    this.webview.postMessage({
      type: "diagram",
      kind: "html",
      html: buildDiagramLoadingMountContent(),
    });

    const result = await fetchSvgDiagram(conn.serverUrl, text, {
      signal,
      timeoutMs: conn.requestTimeoutMs,
    });

    if (signal.aborted) {
      return;
    }

    if (result.kind === "svg") {
      this.webview.postMessage({
        type: "diagram",
        kind: "html",
        html: buildDiagramMountContent(
          { svg: result.svg },
          { previewZoom: conn.previewZoom }
        ),
      });
    } else {
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
