import * as assert from "assert";
import * as vscode from "vscode";

suite("Extensão plantuml-viewer (API)", () => {
  test("API do VS Code disponível no Extension Host", () => {
    assert.ok(Array.isArray(vscode.extensions.all));
  });
});
