import * as path from "path";
import * as vscode from "vscode";
import type { PlantumlConnectionConfig } from "../plantumlConfig";
import { isPlantumlEditorDocument } from "../util/plantumlEditor";
import { getActivePlantumlDocument } from "./plantumlEditorSessionRegistry";
import { expandPlantUmlIncludes } from "./expandIncludes";
import { fetchPngDiagram, fetchSvgDiagram, type FetchSvgOptions } from "./serverClient";
import { enhanceSvgString, prepareUmlForServer } from "./rendering/renderPipeline";

export type ExportFormat = "svg" | "png";

export async function exportActivePlantUmlDiagram(
  format: ExportFormat,
  getConfig: () => PlantumlConnectionConfig
): Promise<void> {
  const doc = getActivePlantumlDocument();
  if (!doc || !isPlantumlEditorDocument(doc)) {
    void vscode.window.showWarningMessage(
      "Open a PlantUML file (.puml) to export."
    );
    return;
  }
  const uri = doc.uri;
  if (uri.scheme !== "file") {
    void vscode.window.showWarningMessage(
      "Save the file to disk before exporting the diagram."
    );
    return;
  }

  let text = doc.getText();

  const expanded = await expandPlantUmlIncludes(uri, text);
  if (!expanded.ok) {
    void vscode.window.showErrorMessage(expanded.message);
    return;
  }
  text = expanded.text;

  const cfgFull = getConfig();
  const visualInput = {
    theme: cfgFull.visualTheme,
    semanticColors: cfgFull.visualSemanticColors,
    svgEnhancements: cfgFull.visualSvgEnhancements,
  };
  const prepared = prepareUmlForServer(text, cfgFull.diagramPreamble, visualInput);
  text = prepared.text;
  const diagramKind = prepared.kind;

  const baseName = path.basename(uri.fsPath, path.extname(uri.fsPath));
  const ext = format === "svg" ? "svg" : "png";
  const filters: Record<string, string[]> =
    format === "svg" ? { SVG: ["svg"] } : { PNG: ["png"] };

  const folder = vscode.Uri.file(path.dirname(uri.fsPath));
  const defaultUri = vscode.Uri.joinPath(folder, `${baseName}.${ext}`);

  const target = await vscode.window.showSaveDialog({
    defaultUri,
    filters,
    saveLabel: "Export",
  });

  if (!target) {
    return;
  }

  const { serverUrl, requestTimeoutMs: timeoutMs } = cfgFull;
  const opts: FetchSvgOptions = { timeoutMs };

  if (format === "svg") {
    const result = await fetchSvgDiagram(serverUrl, text, opts);
    if (result.kind === "error") {
      void vscode.window.showErrorMessage(result.message);
      return;
    }
    const svgOut = enhanceSvgString(result.svg, diagramKind, visualInput);
    const enc = new TextEncoder();
    await vscode.workspace.fs.writeFile(target, enc.encode(svgOut));
  } else {
    const result = await fetchPngDiagram(serverUrl, text, opts);
    if (result.kind === "error") {
      void vscode.window.showErrorMessage(result.message);
      return;
    }
    await vscode.workspace.fs.writeFile(target, result.data);
  }

  void vscode.window.showInformationMessage(
    `Diagram exported: ${target.fsPath}`
  );
}

/**
 * Prompts for format and exports the diagram from the active editor.
 */
export async function runExportDiagramPick(
  getConfig: () => PlantumlConnectionConfig
): Promise<void> {
  const picked = await vscode.window.showQuickPick(
    [
      {
        label: "SVG",
        description: "Vector (scalable)",
        format: "svg" as const,
      },
      {
        label: "PNG",
        description: "Raster image",
        format: "png" as const,
      },
    ],
    { placeHolder: "Export format" }
  );
  if (!picked) {
    return;
  }
  await exportActivePlantUmlDiagram(picked.format, getConfig);
}
