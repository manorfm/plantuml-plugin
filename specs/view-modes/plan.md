# Plan: modos de vista

**Spec de referência:** [spec.md](./spec.md)

## Arquitectura

- `PlantumlCustomEditorProvider` + `PlantumlCustomEditorSession`: `resolveCustomTextEditor`, mensagens Webview, `WorkspaceEdit` a partir do textarea, debounce + `fetchSvgDiagram`.
- Persistência: `workspaceState` `plantumlViewer.viewModesByUri`.
- `extension.ts`: registo do custom editor e comandos.
- `plantumlStatusBar.ts` / `plantumlModeCodeLens.ts`: opcionais, sincronização com `getActivePlantumlDocument` e `tabGroups.onDidChangeTabs`.

## Módulos

- `src/plantuml/plantumlCustomEditorProvider.ts`, `src/plantuml/customEditorHtml.ts`, `src/preview/html.ts`, `src/extension.ts`

## Configuração

- `showStatusBarActions`, `showModeCodeLens` (defeito false); sem `openPreviewBeside`.
