import * as vscode from "vscode";
import { readPlantumlConfig } from "./plantumlConfig";
import { isPlantumlEditorDocument } from "./util/plantumlEditor";

const DOC_SELECTOR: vscode.DocumentSelector = [
  { language: "plantuml" },
  { scheme: "file", pattern: "**/*.puml" },
  { scheme: "file", pattern: "**/*.plantuml" },
  { scheme: "file", pattern: "**/*.pu" },
  { scheme: "file", pattern: "**/*.wsd" },
];

/**
 * Optional single CodeLens (refresh only) — does not duplicate title-bar mode actions.
 * Applies to the **text** editor only; the custom editor textarea has no CodeLens.
 */
class PlantumlRefreshCodeLensProvider implements vscode.CodeLensProvider {
  provideCodeLenses(
    document: vscode.TextDocument
  ): vscode.ProviderResult<vscode.CodeLens[]> {
    if (!isPlantumlEditorDocument(document)) {
      return [];
    }
    const line = Math.min(
      document.lineCount > 0 ? document.lineCount - 1 : 0,
      findStartLine(document)
    );
    const range = document.lineAt(line).range;
    return [
      new vscode.CodeLens(range, {
        title: "$(refresh) Refresh diagram",
        tooltip:
          "PlantUML: refresh preview (PlantUML Viewer custom editor, diagram modes)",
        command: "plantumlViewer.refreshPreview",
      }),
    ];
  }
}

function findStartLine(doc: vscode.TextDocument): number {
  const n = Math.min(doc.lineCount, 40);
  for (let i = 0; i < n; i++) {
    if (doc.lineAt(i).text.includes("@startuml")) {
      return i;
    }
  }
  return 0;
}

/**
 * Regista CodeLens apenas quando `showModeCodeLens` está ligado; caso contrário não regista provider.
 */
export function registerOptionalPlantumlCodeLens(
  context: vscode.ExtensionContext
): vscode.Disposable {
  let reg: vscode.Disposable | undefined;

  const sync = (): void => {
    reg?.dispose();
    reg = undefined;
    if (!readPlantumlConfig().showModeCodeLens) {
      return;
    }
    reg = vscode.languages.registerCodeLensProvider(
      DOC_SELECTOR,
      new PlantumlRefreshCodeLensProvider()
    );
  };

  sync();

  const cfgSub = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("plantumlViewer.showModeCodeLens")) {
      sync();
    }
  });

  return vscode.Disposable.from(
    cfgSub,
    new vscode.Disposable(() => {
      reg?.dispose();
    })
  );
}
