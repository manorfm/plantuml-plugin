# Plano: registo de sessão do custom editor

Referência: [spec.md](./spec.md).

## Decisão

- **`plantumlEditorSessionRegistry.ts`**: constante `PLANTUML_CUSTOM_EDITOR_VIEW_TYPE`, `Map` de sessões, `registerPlantumlEditorSession` / `unregisterPlantumlEditorSession`, `getActivePlantumlEditorSession()`, `getActivePlantumlDocument()`, interface `PlantumlCustomEditorSessionHandle` (documento + `setMode` + `refreshDiagram`).
- **`plantumlViewMode.ts`**: tipo `PlantumlViewMode` extraído do provider para o registry e a sessão não dependerem de um ficheiro monolítico.
- **`plantumlCustomEditorProvider.ts`**: deixa de manter o `Map` estático local; chama o registo em `resolveCustomTextEditor` e `onDidDispose`; mantém métodos estáticos `activePlantumlSession` / `getActivePlantumlDocument` como delegação ao registo (compatibilidade interna).
- **Consumidores** (`exportDiagram.ts`, `plantumlFormatting.ts`, `plantumlStatusBar.ts`): importam apenas o registry.

## Verificação de dependências

- Opcional em CI: `madge --circular --extensions ts src/` (`npm run lint:deps`) para regressões futuras.
