import * as vscode from "vscode";
import { runExportDiagramPick } from "./plantuml/exportDiagram";
import { PlantumlCustomEditorProvider } from "./plantuml/plantumlCustomEditorProvider";
import { registerOptionalPlantumlCodeLens } from "./plantumlModeCodeLens";
import { PlantumlStatusBarController } from "./plantumlStatusBar";
import { readPlantumlConfig } from "./plantumlConfig";

export function activate(context: vscode.ExtensionContext): void {
  const provider = new PlantumlCustomEditorProvider(context);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      PlantumlCustomEditorProvider.viewType,
      provider,
      {
        webviewOptions: { retainContextWhenHidden: true },
        supportsMultipleEditorsPerDocument: false,
      }
    )
  );

  context.subscriptions.push(new PlantumlStatusBarController());
  context.subscriptions.push(registerOptionalPlantumlCodeLens(context));

  context.subscriptions.push(
    vscode.window.tabGroups.onDidChangeTabs(() => {
      void PlantumlCustomEditorProvider.syncViewModeContext(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("plantumlViewer.toggleViewMode", () =>
      PlantumlCustomEditorProvider.toggleViewMode(context)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("plantumlViewer.viewModeCode", () =>
      PlantumlCustomEditorProvider.setViewMode(context, "code")
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("plantumlViewer.viewModeSplit", () =>
      PlantumlCustomEditorProvider.setViewMode(context, "split")
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("plantumlViewer.viewModePreview", () =>
      PlantumlCustomEditorProvider.setViewMode(context, "preview")
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("plantumlViewer.openPreview", () =>
      PlantumlCustomEditorProvider.setViewMode(context, "split")
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("plantumlViewer.refreshPreview", () =>
      PlantumlCustomEditorProvider.refreshActive()
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("plantumlViewer.exportDiagram", () =>
      runExportDiagramPick(readPlantumlConfig)
    )
  );

  void PlantumlCustomEditorProvider.syncViewModeContext(context);
}

export async function deactivate(): Promise<void> {
  await vscode.commands.executeCommand("setContext", "plantumlViewer.viewMode", "");
}
