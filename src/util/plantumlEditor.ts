import * as vscode from "vscode";

const PLANTUML_FILE = /\.(puml|plantuml|pu|wsd)$/i;

/**
 * Ficheiro PlantUML reconhecido pela extensão: linguagem `plantuml` ou extensão de nome conhecida.
 * Evita falhas quando o modo de linguagem está em «Texto simples» ou outro id.
 */
export function isPlantumlEditorDocument(doc: vscode.TextDocument): boolean {
  if (doc.languageId === "plantuml") {
    return true;
  }
  const path = doc.uri.fsPath || doc.fileName || doc.uri.path;
  return PLANTUML_FILE.test(path);
}
