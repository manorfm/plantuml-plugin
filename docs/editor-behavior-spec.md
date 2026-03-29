# Especificação técnica: comportamento do editor PlantUML Viewer

## 1. Overview

### Propósito

O ficheiros `.puml` / `.plantuml` / `.pu` / `.wsd` abrem por defeito no **editor personalizado** (`CustomTextEditorProvider`), que combina edição de texto e renderização PlantUML **no mesmo separador**, sem painéis laterais nem novos grupos de editores criados pela extensão ao mudar de modo.

### Modos suportados

| Modo       | Identificador | Comportamento |
|-----------|---------------|---------------|
| Só código | `code`        | Só o painel de texto (textarea) na Webview; diagrama oculto e pedidos de render cancelados. |
| Código + diagrama | `split` | Texto e diagrama em duas colunas dentro da mesma Webview. |
| Só diagrama | `preview`   | Só a área do diagrama; código oculto (o `TextDocument` continua a existir e a ser actualizado em segundo plano). |

A mudança de modo **não** abre novos separadores, **não** usa `createWebviewPanel` e **não** força split do grupo de editores do VS Code.

---

## 2. UI Architecture

### Editor title (`editor/title`)

A **single** visible action: `plantumlViewer.toggleViewMode` (cycles **code → split → preview → code**). The manifest contributes **three** `editor/title` entries for the **same command** with mutually exclusive `when` clauses so only one shows at a time:

- `activeCustomEditorId == plantumlViewer.plantumlEditor && plantumlViewer.viewMode == code` → icon `$(symbol-file)`, menu `title` describes the **next** step (split).
- Same for `split` → `$(split-horizontal)` (next: preview).
- Same for `preview` → `$(preview)` (next: code).

All use `group: navigation@1`. Context key `plantumlViewer.viewMode` is kept in sync via `setContext` when the mode changes, when the webview becomes ready, and when tabs change.

`viewModeCode` / `viewModeSplit` / `viewModePreview` remain as **commands** (palette, keybindings) but are **not** on `editor/title`. `refreshPreview` and `exportDiagram` are **not** on `editor/title`.

### Webview toolbar

Setting `plantumlViewer.showWebviewToolbar` (default **on**): top row with **three icon buttons** for **code / split / preview** (direct `setMode`), plus **Refresh** and **Export** as icons, via `postMessage` → `uiCommand`.

### Status bar

`plantumlViewer.showStatusBarActions` (default **on**): only **Refresh** and **Export**, and only when `activePlantumlSession()` is defined (PlantUML custom editor tab active).

### CodeLens (optional fallback)

- `plantumlViewer.showModeCodeLens` default **off** — only **Refresh** in the **text** editor; does not duplicate mode controls.

---

## 3. Editor Architecture

### Porquê `CustomTextEditorProvider`

- A API associa uma **única** `WebviewPanel` por instância de editor ao `TextDocument` do ficheiro.
- Permite actualizar HTML/CSS internos (layout dos três modos) **in-place**, mantendo undo/redo do documento via `WorkspaceEdit` a partir do textarea.

### Porquê deixar de usar `createWebviewPanel`

- `WebviewPanel` cria um separador ou coluna **adicional** na área de editores, incompatível com o requisito de alternar modos **no mesmo separador** sem splits externos.

### Registo

- `viewType`: `plantumlViewer.plantumlEditor`
- `supportsMultipleEditorsPerDocument`: `false`
- `webviewOptions.retainContextWhenHidden`: `true`

---

## 4. State Model

### Modo por documento

- Chave: `plantumlViewer.viewModesByUri` em `workspaceState` (mapa `uri.toString()` → `"code" | "split" | "preview"`).
- Defeito ao abrir um URI sem entrada: `split`.

### Sessão em memória (`PlantumlCustomEditorSession`)

- Por cada `resolveCustomTextEditor`: referência ao `TextDocument`, `WebviewPanel`, modo actual (espelha o persistido após `setMode`), `AbortController` do pedido SVG actual, debounce de refresh, e flag `applyingFromWebview` para evitar loops com `onDidChangeTextDocument`.

### Sessão activa

- `PlantumlCustomEditorProvider.activePlantumlSession()` resolve o separador activo via `TabInputCustom`; usada por toggle, refresh, export na barra de estado, e `syncViewModeContext`.

---

## 5. Command Flow

| Comando | Efeito |
|---------|--------|
| `toggleViewMode` | Ciclo `code` → `split` → `preview` → `code` na sessão do custom editor activo; actualiza `plantumlViewer.viewMode` (contexto). |
| `viewModeCode` / `viewModeSplit` / `viewModePreview` | Definem modo directamente (paleta / atalhos); mesma lógica que antes. |
| `openPreview` | Equivalente a `viewModeSplit`. |
| `refreshPreview` | `refreshDiagram('manual')` na sessão do custom editor activo. |
| `exportDiagram` | Usa `getActivePlantumlDocument()`, fluxo de export existente. |

---

## 6. Rendering Strategy

### HTML da Webview

- **Shell** (`customEditorHtml.ts`): `#app` → barra opcional `#wvToolbar` + `#root`; `#codePane` com scroll, `<pre><code>` colorido (`puml-*`) e textarea transparente; mensagens `highlight` / `highlightHtml` + `requestHighlight` ↔ `webviewHighlight.ts`.
- **Actualizações**: `init` (inclui `showWebviewToolbar`), `mode`, `code`, `diagram`; `uiCommand` da webview → `setMode` (payload `mode`), `refresh`, `export`.

### Diagrama

- Reutiliza `expandPlantUmlIncludes`, `applyDiagramPreamble`, `fetchSvgDiagram` e fragmentos `buildDiagramLoadingMountContent` / `buildDiagramMountContent` (`preview/html.ts`).
- SVG sanitizado como antes; pan/arrasto re-ligado após cada `innerHTML` no contentor do diagrama.

### Texto

- O utilizador edita no textarea; `docChange` (debounce ~400 ms na Webview) aplica `WorkspaceEdit.replace` em todo o documento.
- Alterações externas ao documento propagam-se com `postMessage` tipo `code` e disparam refresh debounced se `autoRefresh` e modo ≠ `code`.

---

## 7. Constraints

- Manter o utilizador no **mesmo separador** do editor personalizado ao mudar modo.
- **Sem** painéis laterais dedicados à pré-visualização.
- **Sem** duplicar na UI os cinco comandos principais (prioridade: `editor/title`; CodeLens e barra de estado opcionais e desligados por defeito).

---

## 8. Future Improvements (optional)

- Scroll sincronizado entre código e diagrama em modo `split`.
- Controlos de zoom na UI (além de `previewZoom` nas definições).
- Exportação com pré-visualização de destino ou formatos extra.
- Edição incremental (ranges) em vez de substituir o documento inteiro a cada `docChange`.
