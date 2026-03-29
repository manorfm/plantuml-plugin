# Spec: modos de vista

## Problema

O utilizador alterna entre só código, código+diagrama e só diagrama **no mesmo separador**, sem painéis Webview adicionais nem splits externos do VS Code.

## Comportamento esperado

- Três modos persistidos **por URI** no espaço de trabalho: **só código**, **código e diagrama**, **só diagrama**.
- Implementação com **`CustomTextEditorProvider`** (`plantumlViewer.plantumlEditor`): uma Webview por separador (textarea + área de diagrama).
- **`editor/title`:** um controlo visível — `plantumlViewer.toggleViewMode` (ciclo de modos), ícone conforme estado (`setContext` `plantumlViewer.viewMode`).
- **Refresh / Export:** barra de estado (custom editor activo) e barra opcional dentro da Webview (ícones); não em `editor/title`. Na Webview, **três botões de ícone** escolhem o modo directamente (não um único ciclo).
- CodeLens opcional (defeito off): só refresh no editor de texto.
- Barra de estado para refresh/export: defeito **on**.

## Critérios de aceitação

1. Abrir `.puml` usa o editor personalizado por defeito; modos mudam **in-place**.
2. Não se usa `createWebviewPanel` para o fluxo normal de pré-visualização.
3. Exportar e atualizar funcionam com o documento do editor personalizado activo.

## Fora deste spec

- Conteúdo SVG — `preview-rendering`.
- Exportação — `export-diagram`.
