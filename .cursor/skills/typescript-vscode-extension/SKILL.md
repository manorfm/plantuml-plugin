---
name: typescript-vscode-extension
description: TypeScript e padrões da API VS Code para extensões (activate, comandos, Disposable, tipos @types/vscode). Use ao editar src/**/*.ts, package.json contributes, ou ao refatorar a extensão PlantUML Viewer.
---

# TypeScript e API VS Code (extensões)

## Escopo

Aplicar a **todo o código em `src/`** deste repositório. Complementa o skill **vscode-plantuml-extension** (domínio PlantUML) e **vscode-extension-testing** (testes).

## TypeScript

- Respeitar `tsconfig.json`: `strict`, `rootDir`/`outDir`, alvo ES2022.
- Preferir tipos explícitos em APIs públicas e em funções que cruzam módulos.
- Tratar `undefined` (editores inativos, documentos fechados); evitar `!` não justificado.
- Async: usar `async`/`await`; erros em comandos devem ser capturados e mostrados com `vscode.window.showErrorMessage` ou logging, não falhas silenciosas.

## API VS Code — padrões

- **Ativação:** trabalho pesado em `activate`; exportar `deactivate` só se houver cleanup global.
- **Subscriptions:** registar tudo em `context.subscriptions` (comandos, `Disposable`, listeners).
- **Comandos:** handlers `async`; retorno `void` ou `Promise<void>` conforme API.
- **Configuração:** `vscode.workspace.getConfiguration('plantumlViewer')` (prefixo alinhado a `package.json`).
- **Documentos:** `vscode.workspace.openTextDocument` / `activeTextEditor?.document`; respeitar ciclo de vida (documento pode não existir).

## Webview (resumo)

- Tipar referências a `WebviewPanel` e URIs; `webview.asWebviewUri` para recursos locais.
- Detalhes de segurança e fluxo PlantUML: skill **vscode-plantuml-extension**.

## Anti-padrões

- Listeners sem `dispose` correspondente.
- Lógica de rede ou segredos embutidos em scripts da Webview (executar no host da extensão).
