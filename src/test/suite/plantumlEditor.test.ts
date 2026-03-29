import * as assert from "assert";
import * as vscode from "vscode";
import { isPlantumlEditorDocument } from "../../util/plantumlEditor";

function mockDoc(
  languageId: string,
  fsPath: string
): vscode.TextDocument {
  const uri = vscode.Uri.file(fsPath);
  return {
    languageId,
    uri,
    fileName: fsPath,
  } as vscode.TextDocument;
}

suite("util/plantumlEditor — isPlantumlEditorDocument", () => {
  test("languageId plantuml aceita", () => {
    assert.strictEqual(
      isPlantumlEditorDocument(mockDoc("plantuml", "/tmp/x.txt")),
      true
    );
  });

  test("extensão .puml aceita com outro languageId", () => {
    assert.strictEqual(
      isPlantumlEditorDocument(mockDoc("plaintext", "/proj/diagram.puml")),
      true
    );
  });

  test("ficheiro .txt não é PlantUML", () => {
    assert.strictEqual(
      isPlantumlEditorDocument(mockDoc("plaintext", "/proj/readme.txt")),
      false
    );
  });
});
