import * as vscode from "vscode";
import { DEFAULT_PLANTUML_SERVER_URL } from "./plantuml/serverClient";

export type PlantumlConnectionConfig = {
  serverUrl: string;
  requestTimeoutMs: number;
  previewZoom: number;
  autoRefresh: boolean;
  /** Lines inserted before the diagram (e.g. `!theme plain`). */
  diagramPreamble: string;
  /**
   * Show refresh + export in the status bar when the PlantUML custom editor tab is active.
   */
  showStatusBarActions: boolean;
  /**
   * “Refresh diagram” CodeLens in the text editor only (optional fallback).
   */
  showModeCodeLens: boolean;
  /** Toolbar inside the custom editor webview (top-right). */
  showWebviewToolbar: boolean;
};

export function readPlantumlConfig(): PlantumlConnectionConfig {
  const cfg = vscode.workspace.getConfiguration("plantumlViewer");
  const raw = (cfg.get<string>("serverUrl") ?? "").trim();
  const requestTimeoutMs = cfg.get<number>("requestTimeoutMs", 45_000);
  let previewZoom = cfg.get<number>("previewZoom", 1);
  if (!Number.isFinite(previewZoom)) {
    previewZoom = 1;
  }
  previewZoom = Math.min(3, Math.max(0.25, previewZoom));

  return {
    serverUrl: raw.length === 0 ? DEFAULT_PLANTUML_SERVER_URL : raw,
    requestTimeoutMs:
      Number.isFinite(requestTimeoutMs) && requestTimeoutMs > 0
        ? requestTimeoutMs
        : 45_000,
    previewZoom,
    autoRefresh: cfg.get<boolean>("autoRefresh", true),
    diagramPreamble: cfg.get<string>("diagramPreamble", "") ?? "",
    showStatusBarActions: cfg.get<boolean>("showStatusBarActions", true),
    showModeCodeLens: cfg.get<boolean>("showModeCodeLens", false),
    showWebviewToolbar: cfg.get<boolean>("showWebviewToolbar", true),
  };
}
