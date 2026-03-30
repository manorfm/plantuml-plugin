import {
  PREVIEW_ZOOM_MAX,
  PREVIEW_ZOOM_MIN,
} from "../constants/previewZoomLimits";
import { DEFAULT_PLANTUML_SERVER_URL } from "./serverClient";
import type { VisualThemeId } from "./rendering/themes";

export type { VisualThemeId } from "./rendering/themes";

export type PlantumlConnectionConfig = {
  serverUrl: string;
  requestTimeoutMs: number;
  previewZoom: number;
  autoRefresh: boolean;
  /** Debounce (ms) before auto-refreshing the diagram after edits. */
  autoRefreshDelayMs: number;
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
  /** Pipeline visual: `none` desactiva préâmbulo automático e pós-processamento por defeito. */
  visualTheme: VisualThemeId;
  /** Cores semânticas (heurísticas) no préâmbulo automático. */
  visualSemanticColors: boolean;
  /** Filtros / CSS no SVG após o render. */
  visualSvgEnhancements: boolean;
};

/**
 * Valores crus como devolvidos por `WorkspaceConfiguration.get` / testes.
 * Centraliza clamping e defaults.
 */
export type RawPlantumlViewerSettings = {
  serverUrl?: string;
  requestTimeoutMs?: number;
  previewZoom?: number;
  autoRefresh?: boolean;
  autoRefreshDelayMs?: number;
  diagramPreamble?: string | null;
  showStatusBarActions?: boolean;
  showModeCodeLens?: boolean;
  showWebviewToolbar?: boolean;
  visualTheme?: string;
  visualSemanticColors?: boolean;
  visualSvgEnhancements?: boolean;
};

export function normalizePlantumlViewerSettings(
  raw: RawPlantumlViewerSettings
): PlantumlConnectionConfig {
  const trimmed = (raw.serverUrl ?? "").trim();
  const requestTimeoutMs = raw.requestTimeoutMs;
  let previewZoom = raw.previewZoom ?? 1;
  if (!Number.isFinite(previewZoom)) {
    previewZoom = 1;
  }
  previewZoom = Math.min(PREVIEW_ZOOM_MAX, Math.max(PREVIEW_ZOOM_MIN, previewZoom));

  let autoRefreshDelayMs = raw.autoRefreshDelayMs ?? 500;
  if (!Number.isFinite(autoRefreshDelayMs)) {
    autoRefreshDelayMs = 500;
  }
  autoRefreshDelayMs = Math.min(30_000, Math.max(50, Math.round(autoRefreshDelayMs)));

  const visualTheme = parseVisualTheme(raw.visualTheme);
  const visualSemanticColors = raw.visualSemanticColors ?? true;
  const visualSvgEnhancements = raw.visualSvgEnhancements ?? true;

  return {
    serverUrl: trimmed.length === 0 ? DEFAULT_PLANTUML_SERVER_URL : trimmed,
    requestTimeoutMs:
      Number.isFinite(requestTimeoutMs) && (requestTimeoutMs as number) > 0
        ? (requestTimeoutMs as number)
        : 45_000,
    previewZoom,
    autoRefresh: raw.autoRefresh ?? true,
    autoRefreshDelayMs,
    diagramPreamble: raw.diagramPreamble ?? "",
    showStatusBarActions: raw.showStatusBarActions ?? true,
    showModeCodeLens: raw.showModeCodeLens ?? false,
    showWebviewToolbar: raw.showWebviewToolbar ?? true,
    visualTheme,
    visualSemanticColors,
    visualSvgEnhancements,
  };
}

function parseVisualTheme(raw: unknown): VisualThemeId {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (
    s === "none" ||
    s === "modern-dark" ||
    s === "glass" ||
    s === "minimal"
  ) {
    return s;
  }
  return "modern-dark";
}
