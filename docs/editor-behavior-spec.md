# Technical specification: PlantUML Viewer editor behavior

## 1. Overview

### Purpose

Files `.puml` / `.plantuml` / `.pu` / `.wsd` open by default in the **custom editor** (`CustomTextEditorProvider`), which combines text editing and PlantUML rendering **in the same tab**, without side preview panels or new editor groups created by the extension when switching modes.

### Supported modes

| Mode | ID | Behavior |
|------|-----|----------|
| Code only | `code` | Text panel (textarea) only in the webview; diagram hidden and render requests cancelled. |
| Code + diagram | `split` | Text and diagram in two columns inside the same webview. |
| Diagram only | `preview` | Diagram area only; code hidden (`TextDocument` still exists and updates in the background). |

Changing mode does **not** open new tabs, does **not** use `createWebviewPanel`, and does **not** force VS Code editor group splits.

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

### Why `CustomTextEditorProvider`

- The API binds a **single** `WebviewPanel` per editor instance to the file’s `TextDocument`.
- Allows updating internal HTML/CSS (layout for the three modes) **in place**, while preserving undo/redo via `WorkspaceEdit` from the textarea.

### Why not `createWebviewPanel`

- `WebviewPanel` creates an **extra** tab or column in the editor area, which conflicts with switching modes **in the same tab** without external splits.

### Registration

- `viewType`: `plantumlViewer.plantumlEditor`
- `supportsMultipleEditorsPerDocument`: `false`
- `webviewOptions.retainContextWhenHidden`: `true`

---

## 4. State Model

### Mode per document

- Key: `plantumlViewer.viewModesByUri` in `workspaceState` (map `uri.toString()` → `"code" | "split" | "preview"`).
- Default when opening a URI with no entry: `split`.

### In-memory session (`PlantumlCustomEditorSession`)

- Per `resolveCustomTextEditor`: reference to `TextDocument`, `WebviewPanel`, current mode (mirrors persisted state after `setMode`), `AbortController` for the current SVG request, refresh debounce, and `applyingFromWebview` flag to avoid loops with `onDidChangeTextDocument`.

### Active session

- `PlantumlCustomEditorProvider.activePlantumlSession()` resolves the active tab via `TabInputCustom`; used by toggle, refresh, export on the status bar, and `syncViewModeContext`.

---

## 5. Command Flow

| Command | Effect |
|---------|--------|
| `toggleViewMode` | Cycles `code` → `split` → `preview` → `code` on the active custom editor session; updates `plantumlViewer.viewMode` (context). |
| `viewModeCode` / `viewModeSplit` / `viewModePreview` | Set mode directly (palette / keybindings); same logic as before. |
| `openPreview` | Equivalent to `viewModeSplit`. |
| `refreshPreview` | `refreshDiagram('manual')` on the active custom editor session. |
| `exportDiagram` | Uses `getActivePlantumlDocument()`, existing export flow. |

---

## 6. Rendering Strategy

### Webview HTML

- **Shell** (`customEditorHtml.ts`): `#app` → optional toolbar `#wvToolbar` + `#root`; `#codePane` with scroll, colored `<pre><code>` (`puml-*`) and transparent textarea; `highlight` / `highlightHtml` messages + `requestHighlight` ↔ `webviewHighlight.ts`.
- **Updates**: `init` (includes `showWebviewToolbar`), `mode`, `code`, `diagram`; `uiCommand` from webview → `setMode` (payload `mode`), `refresh`, `export`.

### Diagram

- Reuses `expandPlantUmlIncludes`, `applyDiagramPreamble`, `fetchSvgDiagram` and fragments `buildDiagramLoadingMountContent` / `buildDiagramMountContent` (`preview/html.ts`).
- SVG sanitized as before; pan/drag re-bound after each `innerHTML` in the diagram container.

### Text

- User edits in the textarea; `docChange` (debounce ~400 ms in webview) applies `WorkspaceEdit.replace` for the whole document.
- External document changes propagate via `postMessage` type `code` and trigger debounced refresh if `autoRefresh` and mode ≠ `code`.

---

## 7. Constraints

- Keep the user in the **same tab** of the custom editor when changing mode.
- **No** dedicated side preview panels.
- **Do not** duplicate all five main commands in the UI (priority: `editor/title`; CodeLens and status bar optional and off by default for duplication).

---

## 8. Future improvements (optional)

- Synchronized scroll between code and diagram in `split` mode.
- Zoom controls in the UI (beyond `previewZoom` in settings).
- Export with destination preview or extra formats.
- Incremental editing (ranges) instead of replacing the whole document on each `docChange`.
