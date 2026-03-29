# Plano: plantuml-text-editor

Referência: [spec.md](./spec.md).

## Abordagem

### Gramática TextMate

- Ficheiro **`syntaxes/plantuml.tmLanguage.json`** na extensão, com `scopeName` `source.plantuml`.
- Contribuição **`grammars`** em `package.json` ligada a `language: plantuml`.
- Padrões em `patterns` + `repository` para comentários, blocos `@…`, keywords, setas e strings — evitar regex gigantes; aceitar cobertura parcial documentada no spec.

### Formatação

- Módulo puro **`src/plantuml/formatPlantuml.ts`**: `formatPlantumlSource(text, { tabSize, insertSpaces })` → string.
- **`src/plantuml/plantumlFormatting.ts`**: registo de `registerDocumentFormattingEditProvider({ language: 'plantuml' }, …)` e comando **`plantumlViewer.formatDocument`** que:
  - se existir sessão `PlantumlCustomEditorProvider.activePlantumlSession()`, aplica `WorkspaceEdit` em todo o documento;
  - senão, se `activeTextEditor` for PlantUML, delega em `editor.action.formatDocument` **ou** aplica o mesmo núcleo (evitar duplicação: preferir chamar `formatPlantumlSource` nos dois caminhos).
- Opções de indentação: parâmetro `FormattingOptions` no provider; no comando custom editor ler `editor.tabSize` / `editor.insertSpaces` com `getConfiguration('editor', uri)`.

### npm `vsix`

- Em `package.json`: `"vsix": "npm run compile && vsce package"` (espelha prepublish + package).

## Riscos / trade-offs

- Indentação heurística pode falhar em diagramas exóticos; utilizador pode desfazer (`Undo`).
- Realce incompleto em construções raras — aceitável per spec.

## Dependências

- Nenhuma dependência npm nova; só ficheiros JSON + TS.
