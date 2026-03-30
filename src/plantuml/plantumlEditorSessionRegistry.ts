import * as vscode from "vscode";
import { isPlantumlEditorDocument } from "../util/plantumlEditor";
import type { PlantumlViewMode } from "./plantumlViewMode";

/** Mesmo valor que `CustomTextEditorProvider` regista em `package.json`. */
export const PLANTUML_CUSTOM_EDITOR_VIEW_TYPE = "plantumlViewer.plantumlEditor";

/**
 * Superfície mínima da sessão do custom editor (sem dependência do ficheiro do provider).
 * Export / formatação / barra de estado usam só isto — não a classe `PlantumlCustomEditorProvider`.
 */
export interface PlantumlCustomEditorSessionHandle {
  readonly document: vscode.TextDocument;
  setMode(mode: PlantumlViewMode): Promise<void>;
  refreshDiagram(
    reason: string,
    opts?: { skipLoadingBanner?: boolean }
  ): Promise<void>;
}

const sessions = new Map<string, PlantumlCustomEditorSessionHandle>();

export function registerPlantumlEditorSession(
  uriKey: string,
  session: PlantumlCustomEditorSessionHandle
): void {
  sessions.set(uriKey, session);
}

export function unregisterPlantumlEditorSession(uriKey: string): void {
  sessions.delete(uriKey);
}

/**
 * Sessão do custom editor na aba activa, se for o view type PlantUML Viewer.
 */
export function getActivePlantumlEditorSession():
  | PlantumlCustomEditorSessionHandle
  | undefined {
  const tab = vscode.window.tabGroups.activeTabGroup?.activeTab;
  const input = tab?.input;
  if (!(input instanceof vscode.TabInputCustom)) {
    return undefined;
  }
  if (input.viewType !== PLANTUML_CUSTOM_EDITOR_VIEW_TYPE) {
    return undefined;
  }
  return sessions.get(input.uri.toString());
}

/**
 * Documento PlantUML activo: sessão do custom editor ou editor de texto simples.
 */
export function getActivePlantumlDocument(): vscode.TextDocument | undefined {
  const s = getActivePlantumlEditorSession();
  if (s) {
    return s.document;
  }
  const te = vscode.window.activeTextEditor;
  if (te && isPlantumlEditorDocument(te.document)) {
    return te.document;
  }
  return undefined;
}
