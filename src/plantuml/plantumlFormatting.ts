import * as vscode from "vscode";
import { getActivePlantumlEditorSession } from "./plantumlEditorSessionRegistry";
import { formatPlantumlSource } from "./formatPlantuml";
import { isPlantumlEditorDocument } from "../util/plantumlEditor";

function editorFormatOptionsForDocument(
  uri: vscode.Uri
): { tabSize: number; insertSpaces: boolean } {
  const ed = vscode.workspace.getConfiguration("editor", uri);
  const tabSize = ed.get<number>("tabSize", 4) ?? 4;
  const insertSpaces = ed.get<boolean>("insertSpaces", true) ?? true;
  return { tabSize, insertSpaces };
}

function fullDocumentRange(doc: vscode.TextDocument): vscode.Range {
  const len = doc.getText().length;
  return new vscode.Range(doc.positionAt(0), doc.positionAt(len));
}

export async function formatActivePlantumlDocument(): Promise<void> {
  const session = getActivePlantumlEditorSession();
  if (session) {
    const doc = session.document;
    const opts = editorFormatOptionsForDocument(doc.uri);
    const cur = doc.getText();
    const next = formatPlantumlSource(cur, opts);
    if (next === cur) {
      return;
    }
    const edit = new vscode.WorkspaceEdit();
    edit.replace(doc.uri, fullDocumentRange(doc), next);
    await vscode.workspace.applyEdit(edit);
    return;
  }

  const te = vscode.window.activeTextEditor;
  if (te && isPlantumlEditorDocument(te.document)) {
    await vscode.commands.executeCommand("editor.action.formatDocument");
    return;
  }

  void vscode.window.showWarningMessage(
    "Open a PlantUML file (.puml) in PlantUML Viewer or the text editor."
  );
}

export function registerPlantumlFormatting(): vscode.Disposable {
  const provider = vscode.languages.registerDocumentFormattingEditProvider(
    { language: "plantuml" },
    {
      provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions
      ): vscode.ProviderResult<vscode.TextEdit[]> {
        if (!isPlantumlEditorDocument(document)) {
          return [];
        }
        const cur = document.getText();
        const next = formatPlantumlSource(cur, {
          tabSize: options.tabSize,
          insertSpaces: options.insertSpaces,
        });
        if (next === cur) {
          return [];
        }
        return [vscode.TextEdit.replace(fullDocumentRange(document), next)];
      },
    }
  );

  const cmd = vscode.commands.registerCommand(
    "plantumlViewer.formatDocument",
    () => formatActivePlantumlDocument()
  );

  return vscode.Disposable.from(provider, cmd);
}
