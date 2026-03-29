import * as vscode from "vscode";
import { PlantumlCustomEditorProvider } from "./plantuml/plantumlCustomEditorProvider";
import { readPlantumlConfig } from "./plantumlConfig";

/**
 * Refresh and export on the status bar when the PlantUML custom editor is active.
 */
export class PlantumlStatusBarController implements vscode.Disposable {
  private readonly refreshItem: vscode.StatusBarItem;
  private readonly exportItem: vscode.StatusBarItem;
  private readonly disposable: vscode.Disposable;

  constructor() {
    this.refreshItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      101
    );
    this.refreshItem.command = "plantumlViewer.refreshPreview";
    this.refreshItem.text = "$(refresh)";
    this.refreshItem.tooltip = "PlantUML: Refresh preview";

    this.exportItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.exportItem.command = "plantumlViewer.exportDiagram";
    this.exportItem.text = "$(save-as)";
    this.exportItem.tooltip = "PlantUML: Export diagram…";

    this.disposable = vscode.Disposable.from(
      this.refreshItem,
      this.exportItem,
      vscode.window.onDidChangeActiveTextEditor(() => this.sync()),
      vscode.window.tabGroups.onDidChangeTabs(() => this.sync()),
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (
          e.affectsConfiguration("plantumlViewer.showStatusBarActions")
        ) {
          this.sync();
        }
      })
    );
    this.sync();
  }

  dispose(): void {
    this.disposable.dispose();
  }

  private sync(): void {
    const enabled = readPlantumlConfig().showStatusBarActions;
    const customActive =
      PlantumlCustomEditorProvider.activePlantumlSession() !== undefined;
    const show = enabled && customActive;
    if (show) {
      this.refreshItem.show();
      this.exportItem.show();
    } else {
      this.refreshItem.hide();
      this.exportItem.hide();
    }
  }
}
