# PlantUML Plugin

[![CI](https://github.com/manorfm/plantuml-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/manorfm/plantuml-plugin/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.80.0-007ACC?logo=visualstudiocode)](https://code.visualstudio.com/)

Edit and preview [PlantUML](https://plantuml.com/) diagrams in Visual Studio Code—**code**, **split** (code + diagram), or **diagram only** in one tab—with live preview and export.

**Tests:** `npm test` (Extension Host). `npm run test:coverage:unit` (Node + c8). See [`docs/testing.md`](docs/testing.md).

## Features

- Live diagram preview (SVG); drag to pan; **Ctrl/Cmd + mouse wheel** zooms toward the cursor (plain wheel scrolls)  
- Export to **PNG** or **SVG**  
- Optional refresh while you type  
- PlantUML syntax highlighting and **Format Document**  
- Local `!include` file resolution  

## Getting started

1. Open a `.puml` (or `.plantuml`) file.  
2. Use the Command Palette (**Preview PlantUML**) or the editor toolbar to switch view modes.  

Configure the PlantUML server under **Settings** → search **PlantUML Plugin** (default uses the public demo server).

### Install from a local `.vsix`

After `npm run vscode:package` at the repository root, install the generated file (name follows **`version`** in `package.json`; current example: `plantuml-plugin-manorfm-0.11.10.vsix`):

```bash
code --install-extension plantuml-plugin-manorfm-0.11.10.vsix
```

You can also open the **Extensions** view in VS Code and choose **Install from VSIX…** from the `⋯` menu.

### PlantUML `!theme` in the diagram (server)

Only names from the **PlantUML engine** work in your `.puml` file — see the official list at [plantuml.com/theme](https://plantuml.com/theme). Examples (availability depends on server version): `plain`, `cerulean-outline`, `cerulean`, `aws-orange`, `superhero`, `materia`, `metal`, `lightgray`, `cyborg-outline`, …

**`!theme plain`** is a neutral baseline; with default extension settings, the plugin can still add skinparams and SVG polish on top (unless you also set layout `skinparam`s that take control — see `docs/visual-rendering.md`).

**Never** put **extension** theme names after `!theme` (`modern-dark`, `glass`, `minimal`, `none`). The server does not know them and returns **HTTP 400** (“Cannot load theme …”). Those values are **only** for `plantumlViewer.visualTheme` in VS Code settings.

### Visual themes (extension settings)

These control the optional **rendering pipeline** (extra `skinparam` lines + light SVG polish). They are **not** PlantUML `!theme` names — use the table above for `!theme` in the file.

| Setting | Values | Role |
|--------|--------|------|
| **`plantumlViewer.visualTheme`** | `none` | No automatic pipeline; server output + your `diagramPreamble` only. |
| | `modern-dark` *(default)* | Light, soft palette (slate/sky), Segoe UI, stereotype `<<…>>` accents, spacing, shadows (drop-shadow on dense diagrams). |
| | `glass` | Cool frosted palette with indigo accents; softer hover. |
| | `minimal` | Thin strokes, very light shadows. |
| **`plantumlViewer.visualSemanticColors`** | `true` / `false` *(default: true)* | When the visual theme is active, add semantic skinparam hints from keywords (e.g. user, API, database). |
| **`plantumlViewer.visualSvgEnhancements`** | `true` / `false` *(default: true)* | After render, inject SVG defs / CSS (hover polish). Turn off if the diagram looks clipped or you want raw server SVG. |

Example in `settings.json`:

```json
"plantumlViewer.visualTheme": "modern-dark",
"plantumlViewer.visualSemanticColors": true,
"plantumlViewer.visualSvgEnhancements": true
```

With `!theme plain`, the extension injects a **style** block (colours, font, shadows, stereotypes) **after** that line in the text sent to the server, so the plain theme does not wipe them. Your `diagramPreamble` in settings is still **prepended before** the whole file. Layout `skinparam`s (`nodesep`, …) in your diagram only disable the **automatic** spacing from the extension, not the colours.

Default diagram font is **DejaVu Sans** (good on typical Linux servers); arrow labels use dedicated `ArrowFont*` skinparams, and the SVG step forces sans-serif on `<text>` so labels do not fall back to serif. **Line-crossing “jumps”** (one wire over another) are **not** supported by PlantUML/Graphviz — see [`docs/visual-rendering.md`](docs/visual-rendering.md).

More detail: [`docs/visual-rendering.md`](docs/visual-rendering.md).

## Privacy

Diagram source is sent to the **server URL** you configure. Use a **local or private** server for sensitive content.

## License

MIT — see the repository.

**Issues & source:** [GitHub](https://github.com/manorfm/plantuml-plugin)
