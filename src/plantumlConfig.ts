import * as vscode from "vscode";
import {
  normalizePlantumlViewerSettings,
  type PlantumlConnectionConfig,
} from "./plantuml/plantumlConnectionSettings";

export { PREVIEW_ZOOM_MAX, PREVIEW_ZOOM_MIN } from "./constants/previewZoomLimits";
export type {
  PlantumlConnectionConfig,
  RawPlantumlViewerSettings,
} from "./plantuml/plantumlConnectionSettings";
export { normalizePlantumlViewerSettings } from "./plantuml/plantumlConnectionSettings";

let cachedConfig: PlantumlConnectionConfig | undefined;

export function invalidatePlantumlConfigCache(): void {
  cachedConfig = undefined;
}

function readPlantumlConfigUncached(): PlantumlConnectionConfig {
  const cfg = vscode.workspace.getConfiguration("plantumlViewer");
  return normalizePlantumlViewerSettings({
    serverUrl: cfg.get<string>("serverUrl"),
    requestTimeoutMs: cfg.get<number>("requestTimeoutMs", 45_000),
    previewZoom: cfg.get<number>("previewZoom", 1),
    autoRefresh: cfg.get<boolean>("autoRefresh", true),
    autoRefreshDelayMs: cfg.get<number>("autoRefreshDelayMs", 500),
    diagramPreamble: cfg.get<string>("diagramPreamble", "") ?? "",
    showStatusBarActions: cfg.get<boolean>("showStatusBarActions", true),
    showModeCodeLens: cfg.get<boolean>("showModeCodeLens", false),
    showWebviewToolbar: cfg.get<boolean>("showWebviewToolbar", true),
  });
}

export function readPlantumlConfig(): PlantumlConnectionConfig {
  if (!cachedConfig) {
    cachedConfig = readPlantumlConfigUncached();
  }
  return cachedConfig;
}
