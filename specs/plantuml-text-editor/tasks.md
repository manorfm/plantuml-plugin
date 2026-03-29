# Tasks: plantuml-text-editor

- [x] **T-PTE-1** Criar `syntaxes/plantuml.tmLanguage.json` e entrada `grammars` em `package.json`.
- [x] **T-PTE-2** Implementar `formatPlantumlSource` + testes em `src/test/suite/formatPlantuml.test.ts`.
- [x] **T-PTE-3** Registar `DocumentFormattingEditProvider` + comando `plantumlViewer.formatDocument` + `activationEvents` / contributes.
- [x] **T-PTE-4** Adicionar `npm run vsix` e documentar no README.
- [x] **T-PTE-5** Bump SemVer, `npm run vsix`, actualizar `SPECIFICATION.md`, `specs/README.md`, `specs/engineering-release/tasks.md`, `examples/architecture.puml` se aplicável.
- [x] **T-PTE-6 (0.9.1)** Realce na Webview do custom editor (`webviewHighlight.ts`, overlay `<pre>` + `requestHighlight`).
