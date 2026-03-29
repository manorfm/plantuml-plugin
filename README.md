# PlantUML Viewer

Extension for [Visual Studio Code](https://code.visualstudio.com/) and compatible editors (e.g. [Cursor](https://cursor.com/)) that **previews** [PlantUML](https://plantuml.com/) diagrams from `.puml` / `.plantuml` files using a **PlantUML server** on your machine or over the network.

## Requirements

- **Editor:** VS Code ≥ 1.85 (see `engines.vscode` in `package.json`).
- **PlantUML server** reachable over HTTP (the extension does not bundle the Java engine). **By default** it uses the official HTTP server at `https://www.plantuml.com/plantuml` so preview works **without Docker**. Diagram source is sent to that service — for **confidential** data or **offline** use, set **PlantUML Viewer → Server URL** to a **local** server (Docker below).

### Local server (Docker example)

```bash
docker run -d -p 8080:8080 plantuml/plantuml-server:jetty
```

If **port 8080 is already in use** (another container or app), map a different host port and use the same in the extension URL, for example:

```bash
docker run -d -p 8081:8080 plantuml/plantuml-server:jetty
```

In **Settings → PlantUML Viewer → Server URL**, set `http://127.0.0.1:8081` (or the correct value).

Confirm the service responds at the URL configured under **Settings → PlantUML Viewer → Server URL**.

## Features

- **Three view modes** (persisted per file): **code only**, **code + diagram**, **diagram only**, in the **same tab** (`CustomTextEditorProvider`). **One** button in the title bar (`plantumlViewer.toggleViewMode`, cycles code→split→preview) with an icon for the current mode. **Refresh** and **Export** in the **status bar** (with the custom editor active) and in the **webview toolbar** (`showWebviewToolbar`): **three mode icon buttons** (code / split / preview) plus refresh and export icons. Direct mode commands remain in the palette for keybindings.
- **Inline SVG** preview with the VS Code **theme**; pan and zoom as before.
- **Pan:** when the diagram is larger than the panel, **drag** with the mouse (or touch) to move the view; the mouse **wheel** scrolls as usual.
- Optional **auto-refresh** while editing (debounced) or **manual** refresh.
- Configurable **timeout** for HTTP requests to the server.
- **Scale** for the preview (`previewZoom`).
- Optional **preamble** (`diagramPreamble`) — text placed **before** the diagram (after `!include`), useful for `!theme`, `skinparam`, etc., depending on server support.
- **`!include` expansion** with paths relative to the file: `file.puml`, `<file.puml>`, `"path with spaces.puml"`. **`!includeurl`** is not expanded locally (the line is kept).
- **Very large diagrams:** when the encoded GET URL is too long, the extension uses **POST** with the diagram text to `/svg` or `/png` (plantuml-server; very old servers may not support it).
- **Export** to **SVG** or **PNG** (via the server).
- **PlantUML syntax highlighting** (embedded TextMate) and **Format document** in the **text editor**; **PlantUML: Format document** also works with the **PlantUML Viewer** (custom editor) active. See `specs/plantuml-text-editor/`.
- Package as **`.vsix`**: `npm run vscode:package` or **`npm run vsix`** (compile + package).

## Sample diagram (this repository)

The **`examples/`** folder contains **`architecture.puml`**, describing the architecture of this extension. With the **PlantUML server** running and this extension installed, open the file (opens in **PlantUML Viewer** by default) or use **Code and diagram** / **Open preview** from the palette; **split** is the default per URI until you change it.

## Limitations (important)

- **Diagram area:** inside the **same tab** as the code (custom editor). To return to the classic text editor: **Reopen Editor With… → Text Editor**.
- **Inside the SVG:** background and style **drawn by PlantUML** in the SVG (e.g. white background) are **not** changed by the extension. What follows the VS Code theme is the **webview panel** (panel background, error text).
- **PlantUML themes** (`!theme`, `skinparam` in the preamble) depend on the **server** and engine version; the extension only sends the text.
- Servers without **POST** support on the above endpoints may fail for extremely large diagrams.

## “fetch failed” or network errors

If the message still shows **`http://127.0.0.1:8080`** but you are not using a local server, **Server URL** was probably saved with that value in user or workspace settings. Clear the value to restore the extension default or set it explicitly to `https://www.plantuml.com/plantuml`.

1. **With the default URL** (`https://www.plantuml.com/plantuml`): check **Internet** access, firewall, and proxy. Test in a terminal:  
   `curl -sS -o /dev/null -w "%{http_code}\n" "https://www.plantuml.com/plantuml/"` — expect `200` or a redirect.
2. **With a local server** (`http://127.0.0.1:8080`, etc.): ensure the container or process is running — e.g.  
   `docker run -d -p 8080:8080 plantuml/plantuml-server:jetty`  
   **Port in use:** use `-p 8081:8080` and **Server URL** `http://127.0.0.1:8081`. Test: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/`.
3. Under **Settings → PlantUML Viewer → Server URL**, the URL must match the real server. In **WSL** or **Remote-SSH**, `127.0.0.1` is the environment where the extension runs; align host and port accordingly.

The preview error message explains **connection refused** (`ECONNREFUSED`) and other common cases.

**404 on `/svg` or `/png`:** (1) **Server URL** must be the correct **base**: local Docker `http://127.0.0.1:8080` (no extra path); public server `https://www.plantuml.com/plantuml`. The extension calls `GET/POST {base}/svg` and `…/png`. (2) Very long GET URLs: POST is used; if GET returns 404/414, it retries with POST.

## Installation and updates

### Prerequisites

1. **Editor:** Visual Studio Code, Cursor, or another VS Code–based editor (≥ version in `engines.vscode` in `package.json`).
2. **Network** for the default URL (`plantuml.com`), or a **local PlantUML server** if you change **Server URL** (Docker — see [Requirements](#requirements)).

### Install from a `.vsix` file

The **`.vsix`** package contains the ready-to-install extension (built with `npm run vscode:package` at the repository root).

**Option A — Command Palette**

1. **View → Command Palette** (or `Ctrl+Shift+P` / `Cmd+Shift+P`).
2. Run **Extensions: Install from VSIX…**.
3. Select `plantuml-viewer-<version>.vsix` (the filename includes the version from `package.json`).

**Option B — Command line**

```bash
# Visual Studio Code
code --install-extension ./plantuml-viewer-0.10.5.vsix

# Cursor (if the CLI is on your PATH)
cursor --install-extension ./plantuml-viewer-0.10.5.vsix
```

Replace `0.10.5` with the actual version of the generated file (`version` in `package.json`). Use the correct absolute or relative path to the `.vsix`.

After installation, confirm the extension appears under **Extensions** as **PlantUML Viewer** (publisher `local`, unless you changed `publisher` in `package.json`).

### Updating the extension

To move to a **newer** version of the same package:

1. **Bump** the `version` field in `package.json` (usually semantic `X.Y.Z`).
2. Build the new package: `npm run vscode:package`.
3. Install the new `.vsix` using one of the methods above. The installer **replaces** the previous version with the same identifier (`publisher.name`).

To remove first: **Extensions** → find **PlantUML Viewer** → **Uninstall**, then install the new `.vsix`.

**Reload the window** after install or update: **Command Palette → Developer: Reload Window**.

### Development install (without `.vsix`)

To try code changes before packaging:

```bash
npm install
npm run compile
```

Open the repository folder in the editor and use **Run → Start Debugging** (F5). An **Extension Development Host** opens with this extension loaded from source.

## Commands

| Command | Description |
|--------|-------------|
| **PlantUML: Cycle view mode** | Cycles **code → split → preview → code** in the active custom editor (also the only `editor/title` button). |
| **PlantUML: Code only** | Forces code mode (palette / keybindings). |
| **PlantUML: Code and diagram** | Forces split mode. |
| **PlantUML: Diagram only** | Forces diagram-only mode. |
| **PlantUML: Open preview** | Same as **Code and diagram**. |
| **PlantUML: Refresh preview** | Re-renders in the active custom editor (also status bar and webview). |
| **PlantUML: Export diagram…** | Exports SVG/PNG (also status bar and webview). |
| **PlantUML: Format document** | Formats and indents `.puml` (active custom editor or **Format Document** in the text editor). |

**Where the buttons are:** **Editor title:** only the **mode cycle** (`navigation@1`, icon reflects `plantumlViewer.viewMode`). **Status bar:** Refresh + Export when the custom editor is active. **Webview:** optional top bar with **three mode icons** + refresh and export icons. **CodeLens:** refresh only in the **text** editor if `showModeCodeLens`.

**Where the diagram lives:** in the **same tab** as the code (split or diagram-only mode). Technical details: **`docs/editor-behavior-spec.md`**.

**Syntax highlighting:** In the **PlantUML Viewer** (custom editor), the code area uses a colored `<pre>` layer under the textarea (`webviewHighlight.ts`). With **Reopen Editor With… → Text Editor**, the **TextMate grammar** (`syntaxes/plantuml.tmLanguage.json`) colors the `plantuml` buffer.

## Settings (`plantumlViewer.*`)

| Key | Description |
|-----|-------------|
| `serverUrl` | **Base** URL **without** a trailing slash. **Default:** `https://www.plantuml.com/plantuml` (network; avoid for confidential diagrams). Local: Docker `http://127.0.0.1:8080` (or another port). Requests: `{base}/svg` and `{base}/png`. |
| `autoRefresh` | Refresh the preview while editing (debounce ~500 ms). |
| `requestTimeoutMs` | Maximum time (ms) for each HTTP request. |
| `previewZoom` | Diagram scale in the webview (0.25 to 3; 1 = 100%). |
| `diagramPreamble` | Optional text **before** the diagram (multiple lines), after `!include` expansion — e.g. `!theme plain`. |
| `showWebviewToolbar` | **true** by default: webview bar with mode icons (3) + refresh + export. |
| `showStatusBarActions` | **true** by default: Refresh + Export in the status bar (custom editor active only). |
| `showModeCodeLens` | **false** by default: CodeLens refresh only in the **text** editor (optional fallback). |

## `!include`

`!include` lines are expanded **before** sending to the server, reading files relative to the document. Supported forms include `!include parts/a.puml`, `!include <styles.puml>`, and `!include "file with spaces.puml"`. **`!includeurl`** URLs are not treated as local files. **Unsaved** documents (not `file:`) do not resolve on-disk includes; save the file for consistent paths.

## Export

Export uses the same server, the same `!include` expansion, and the same **preamble** as preview. The document must be saved to disk (`file:`).

## Development

```bash
npm run compile    # compile TypeScript
npm run watch      # watch mode
npm test           # tests (Extension Host + Mocha)
npm run vscode:package   # builds plantuml-viewer-*.vsix
npm run vsix             # compile + vsce package (shortcut)
```

Detailed technical documentation: **`SPECIFICATION.md`** at the repository root (not shipped in the `.vsix`); editor behavior: **`docs/editor-behavior-spec.md`** (includes SemVer and `.vsix` build notes in `SPECIFICATION.md`).

## License

MIT — see the `LICENSE` file.
