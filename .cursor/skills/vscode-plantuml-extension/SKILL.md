---
name: vscode-plantuml-extension
description: Implementa e evolui a extensão VS Code PlantUML Viewer neste repositório (Webview, comandos plantumlViewer.*, servidor PlantUML). Use ao trabalhar em src/, package.json da extensão, pré-visualização .puml, ou quando o utilizador pedir features do plugin PlantUML.
---

# Extensão VS Code — PlantUML Viewer (projeto)

## Contexto

- Raiz do projeto: extensão TypeScript compilada para `dist/` (`main`: `./dist/extension.js`).
- Visão global: [SPECIFICATION.md](../../../SPECIFICATION.md); **features:** pasta [specs/](../../../specs/) (`spec.md` → `plan.md` → `tasks.md` antes de código).
- Skills relacionados: **typescript-vscode-extension** (TS e API VS Code), **vscode-extension-testing** (suíte de testes).
- `package.json` define linguagem `plantuml`, comandos `openPreview`, `refreshPreview`, `exportDiagram`, e configurações `serverUrl`, `autoRefresh`, `requestTimeoutMs`, `previewZoom`, `diagramPreamble`.

## Estrutura sugerida (ao crescer o código)

```
src/
  extension.ts          # activate / deactivate
  plantuml/             # CustomTextEditorProvider, serverClient, expandIncludes, export, sourceTransform, customEditorHtml
  preview/              # HTML / fragmentos do diagrama (html.ts)
  plantumlConfig.ts     # leitura central de definições
  util/                 # debounce, combineWithTimeout (abort + timeout)
media/                  # CSS mínimo para a Webview (opcional)
```

Manter módulos pequenos; evitar lógica de rede dentro do HTML da Webview — pedidos na extensão (Node).

## Fluxo obrigatório

1. Ler o `TextDocument` (sessão do editor personalizado activa ou `activeTextEditor`) e o texto UTF-8.
2. Obter texto fonte UTF-8.
3. Mostrar estado de **carregamento** na área do diagrama (`buildDiagramLoadingMountContent` ou equivalente) antes do `fetch`.
4. Aplicar `applyDiagramPreamble` com `diagramPreamble` das definições (após includes).
5. Chamar o servidor com `fetchSvgDiagram` / `fetchPngDiagram` — usa **POST** automaticamente se a URL GET codificada exceder o limite (`MAX_PLANTUML_GET_URL_LENGTH` em `serverClient.ts`).
6. Passar à Webview o resultado (SVG **inline** sanitizado em `buildPreviewHtml`, ou mensagem de erro escapada).

## Webview (editor personalizado)

- O diagrama vive na **mesma** Webview que o textarea (`CustomTextEditorProvider`, `viewType` `plantumlViewer.plantumlEditor`); **não** usar `createWebviewPanel` para o fluxo principal de `.puml`.
- `enableScripts: true` para pan no SVG; CSP alinhada a `preview/html.ts` e `customEditorHtml.ts`.

## Configuração

- `plantumlViewer.serverUrl`: normalizar (sem barra final duplicada); string vazia → URL público por defeito (`DEFAULT_PLANTUML_SERVER_URL` em `serverClient.ts`); local/privado → Docker em `http://127.0.0.1:8080` (ou outra porta).
- `plantumlViewer.showStatusBarActions` / `showModeCodeLens`: opcionais, defeito **false** (barra do editor como UI principal).
- `plantumlViewer.requestTimeoutMs`: número positivo (ms); combinar com `AbortSignal` do pedido em curso (cancelar ao re-renderizar).

## Checklist antes de concluir uma tarefa

- [ ] `npm run compile` sem erros.
- [ ] Comandos registados são desposed em `deactivate` ou com o `ExtensionContext.subscriptions`.
- [ ] Nenhum segredo ou URL de produção hardcoded sem opt-in do utilizador.
- [ ] **Release SemVer:** para cada alteração pedida que afecte o produto, incrementar `version` em `package.json`, executar `npm run vscode:package`, actualizar exemplos de `.vsix` no `README.md` se existirem. Ver `SPECIFICATION.md` §14 e a regra em `.cursor/rules/plantuml-plugin-context.mdc`.
- [ ] Atualizar `specs/<feature>/spec.md` (e global `SPECIFICATION.md` se a visão mudar); alinhar bump de versão com `specs/engineering-release/`.

## Teste manual rápido

1. `npm run compile`
2. F5 → “Executar extensão”
3. Novo ficheiro `test.puml` com diagrama mínimo `@startuml\nAlice -> Bob\n@enduml`
4. Abrir `test.puml` (editor PlantUML Viewer por defeito) ou comando “PlantUML: Abrir pré-visualização”
